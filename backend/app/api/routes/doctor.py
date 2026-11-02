from __future__ import annotations

from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.api.deps import CurrentDoctor, DbSession, DoctorUser, require_csrf
from app.models.appointment import Appointment, AppointmentStatus
from app.models.doctor import Doctor
from app.models.user import User
from app.schemas.appointment import (
    AppointmentOut,
    CallNextResult,
    DoctorQueueOut,
    StatusUpdateRequest,
)
from app.schemas.common import Message, Page
from app.schemas.dashboard import DoctorDashboardOut
from app.schemas.doctor import (
    AdminDoctorOut,
    DoctorSelfUpdate,
    ScheduleUpdate,
    TimeOffCreate,
    TimeOffOut,
)
from app.services.booking import call_next_patient, update_appointment_status
from app.services.queue import day_appointments, doctor_queue, queue_counts
from app.services.schedule import add_time_off, remove_time_off, replace_schedule
from app.services.serializers import (
    appointment_out,
    availability_out,
    doctor_brief,
    doctor_public,
)

router = APIRouter(
    prefix="/doctor",
    tags=["Doctor"],
    dependencies=[Depends(require_csrf)],
)


def _options():
    return (
        selectinload(Appointment.patient),
        selectinload(Appointment.doctor).selectinload(Doctor.user),
        selectinload(Appointment.doctor).selectinload(Doctor.department),
        selectinload(Appointment.department),
    )


def _appt(db: DbSession, doctor: Doctor, appointment_id: int) -> Appointment:
    row = db.scalar(
        select(Appointment)
        .options(*_options())
        .where(Appointment.id == appointment_id, Appointment.doctor_id == doctor.id)
    )
    if not row:
        raise HTTPException(status_code=404, detail="Appointment not found.")
    return row


@router.get("/dashboard", response_model=DoctorDashboardOut)
def dashboard(db: DbSession, doctor: CurrentDoctor):
    today = date.today()
    appointments = day_appointments(db, doctor.id, today)
    counts = queue_counts(appointments)
    waiting = [a for a in appointments if a.status in (AppointmentStatus.booked, AppointmentStatus.checked_in)]
    current = next((a for a in appointments if a.status == AppointmentStatus.in_progress), None)
    completed = [a for a in appointments if a.status == AppointmentStatus.completed]

    upcoming_rows = list(
        db.scalars(
            select(Appointment)
            .options(*_options())
            .where(
                Appointment.doctor_id == doctor.id,
                Appointment.appointment_date > today,
                Appointment.appointment_date <= today + timedelta(days=7),
                Appointment.status.in_((AppointmentStatus.booked, AppointmentStatus.checked_in)),
            )
            .order_by(Appointment.appointment_date.asc(), Appointment.slot_time.asc())
            .limit(8)
        ).all()
    )

    weekly = []
    for offset in range(7):
        day = today + timedelta(days=offset)
        count = db.scalar(
            select(func.count(Appointment.id)).where(
                Appointment.doctor_id == doctor.id,
                Appointment.appointment_date == day,
                Appointment.status != AppointmentStatus.cancelled,
            )
        ) or 0
        weekly.append({"date": day.isoformat(), "label": day.strftime("%a"), "count": count})

    return DoctorDashboardOut(
        today=today,
        stats={
            "today_total": counts.today_total,
            "waiting": counts.waiting,
            "checked_in": counts.checked_in,
            "in_progress": counts.in_progress,
            "completed": counts.completed,
            "no_show": counts.no_show,
        },
        current=appointment_out(current, include_patient=True) if current else None,
        next=appointment_out(waiting[0], include_patient=True) if waiting else None,
        waiting=[appointment_out(a, include_patient=True) for a in waiting],
        completed=[appointment_out(a, include_patient=True) for a in completed],
        upcoming=[appointment_out(a, include_patient=True) for a in upcoming_rows],
        weekly=weekly,
        doctor=doctor_brief(doctor),
    )


@router.get("/queue", response_model=DoctorQueueOut)
def queue(db: DbSession, doctor: CurrentDoctor, day: date | None = Query(default=None)):
    target = day or date.today()
    if target > date.today() + timedelta(days=60) or target < date.today() - timedelta(days=365):
        raise HTTPException(status_code=422, detail="Choose a valid queue date.")
    return DoctorQueueOut(**doctor_queue(db, doctor, target))


@router.post("/queue/call-next", response_model=CallNextResult)
def call_next(db: DbSession, doctor: CurrentDoctor, user: DoctorUser):
    appointment = call_next_patient(db, doctor, user)
    if not appointment:
        return CallNextResult(message="No patients are waiting right now.", appointment=None)
    row = _appt(db, doctor, appointment.id)
    return CallNextResult(
        message=f"Queue #{appointment.queue_number} has been called.",
        appointment=AppointmentOut(**appointment_out(row, include_patient=True)),
    )


@router.get("/appointments", response_model=Page[AppointmentOut])
def appointments(
    db: DbSession,
    doctor: CurrentDoctor,
    day: date | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    q: str | None = Query(default=None, max_length=100),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=50),
):
    stmt = (
        select(Appointment)
        .options(*_options())
        .join(User, Appointment.patient_id == User.id)
        .where(Appointment.doctor_id == doctor.id)
    )
    if day:
        stmt = stmt.where(Appointment.appointment_date == day)
    if status_filter:
        try:
            stmt = stmt.where(Appointment.status == AppointmentStatus(status_filter))
        except ValueError:
            raise HTTPException(status_code=422, detail="Unknown appointment status.")
    if q:
        term = f"%{q.strip()}%"
        stmt = stmt.where(
            User.full_name.ilike(term)
            | Appointment.reference_code.ilike(term)
            | User.phone.ilike(term)
        )
    stmt = stmt.order_by(
        Appointment.appointment_date.desc(),
        Appointment.slot_time.asc(),
        Appointment.queue_number.asc(),
    )
    total = db.scalar(select(func.count()).select_from(stmt.order_by(None).subquery())) or 0
    rows = list(db.scalars(stmt.offset((page - 1) * page_size).limit(page_size)).all())
    pages = max(1, (total + page_size - 1) // page_size)
    return Page[AppointmentOut](
        items=[
            AppointmentOut(**appointment_out(a, include_patient=True)) for a in rows
        ],
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


@router.get("/appointments/{appointment_id}", response_model=AppointmentOut)
def appointment_detail(appointment_id: int, db: DbSession, doctor: CurrentDoctor):
    row = _appt(db, doctor, appointment_id)
    return AppointmentOut(**appointment_out(row, include_patient=True))


@router.patch("/appointments/{appointment_id}/status", response_model=AppointmentOut)
def update_status(
    appointment_id: int,
    payload: StatusUpdateRequest,
    db: DbSession,
    doctor: CurrentDoctor,
    user: DoctorUser,
):
    row = _appt(db, doctor, appointment_id)
    row = update_appointment_status(
        db,
        row,
        payload.status,
        user,
        doctor_scope=doctor,
        notes=payload.doctor_notes,
    )
    row = _appt(db, doctor, appointment_id)
    return AppointmentOut(**appointment_out(row, include_patient=True))


@router.patch("/appointments/{appointment_id}/notes", response_model=AppointmentOut)
def update_notes(
    appointment_id: int,
    payload: dict,
    db: DbSession,
    doctor: CurrentDoctor,
):
    row = _appt(db, doctor, appointment_id)
    notes = payload.get("doctor_notes")
    if notes is not None and (not isinstance(notes, str) or len(notes) > 2000):
        raise HTTPException(status_code=422, detail="Notes must be 2000 characters or fewer.")
    row.doctor_notes = notes
    db.commit()
    row = _appt(db, doctor, appointment_id)
    return AppointmentOut(**appointment_out(row, include_patient=True))


@router.get("/schedule")
def get_schedule(doctor: CurrentDoctor):
    return {
        "availability": [availability_out(b) for b in doctor.availability],
        "time_off": [
            TimeOffOut(id=o.id, off_date=o.off_date, reason=o.reason)
            for o in sorted(doctor.time_off, key=lambda item: item.off_date)
            if o.off_date >= date.today()
        ],
    }


@router.put("/schedule")
def update_schedule(payload: ScheduleUpdate, db: DbSession, doctor: CurrentDoctor, user: DoctorUser):
    replace_schedule(db, doctor, payload.availability)
    db.refresh(doctor)
    return {
        "message": "Schedule updated.",
        "availability": [availability_out(b) for b in doctor.availability],
    }


@router.post("/time-off", response_model=TimeOffOut, status_code=201)
def create_time_off(
    payload: TimeOffCreate, db: DbSession, doctor: CurrentDoctor, user: DoctorUser
):
    entry = add_time_off(db, doctor, payload.off_date, payload.reason)
    return TimeOffOut(id=entry.id, off_date=entry.off_date, reason=entry.reason)


@router.delete("/time-off/{entry_id}", response_model=Message)
def delete_time_off(entry_id: int, db: DbSession, doctor: CurrentDoctor, user: DoctorUser):
    remove_time_off(db, doctor, entry_id)
    return Message(message="Time off removed.")


@router.get("/profile", response_model=AdminDoctorOut)
def my_profile(doctor: CurrentDoctor):
    return AdminDoctorOut(**doctor_public(doctor), user_id=doctor.user_id, email=doctor.user.email, phone=doctor.user.phone, is_active=doctor.is_active)


@router.patch("/profile", response_model=AdminDoctorOut)
def update_profile(
    payload: DoctorSelfUpdate, db: DbSession, doctor: CurrentDoctor, user: DoctorUser
):
    data = payload.model_dump(exclude_unset=True)
    for field in ("full_name", "phone"):
        if field in data:
            setattr(user, field, data.pop(field))
    for field, value in data.items():
        setattr(doctor, field, value)
    db.commit()
    db.refresh(doctor)
    db.refresh(user)
    return AdminDoctorOut(
        **doctor_public(doctor),
        user_id=doctor.user_id,
        email=doctor.user.email,
        phone=doctor.user.phone,
        is_active=doctor.is_active,
    )


@router.get("/patients/{patient_id}")
def patient_summary(patient_id: int, db: DbSession, doctor: CurrentDoctor):
    appointments = list(
        db.scalars(
            select(Appointment)
            .options(*_options())
            .where(
                Appointment.patient_id == patient_id,
                Appointment.doctor_id == doctor.id,
            )
            .order_by(Appointment.appointment_date.desc())
        ).all()
    )
    if not appointments:
        raise HTTPException(status_code=404, detail="No shared appointments with this patient.")
    patient = appointments[0].patient
    return {
        "patient": {
            "id": patient.id,
            "full_name": patient.full_name,
            "phone": patient.phone,
            "date_of_birth": patient.date_of_birth,
            "gender": patient.gender,
        },
        "appointments": [
            AppointmentOut(**appointment_out(a, include_patient=True)) for a in appointments
        ],
    }
