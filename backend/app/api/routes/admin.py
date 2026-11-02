from __future__ import annotations

from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload

from app.api.deps import AdminUser, DbSession, require_csrf
from app.core.security import hash_password
from app.models.activity import ActivityLog
from app.models.appointment import Appointment, AppointmentStatus
from app.models.contact import ContactMessage
from app.models.department import Department
from app.models.doctor import Availability, Doctor
from app.models.user import User, UserRole
from app.schemas.admin import AdminAppointmentCancel, AdminPatientUpdate, AdminUserOut, ActivityOut
from app.schemas.appointment import AppointmentOut, DoctorQueueOut, StatusUpdateRequest
from app.schemas.common import Message, Page
from app.schemas.contact import ContactOut
from app.schemas.dashboard import AdminStatsOut
from app.schemas.department import DepartmentCreate, DepartmentOut, DepartmentUpdate, slugify
from app.schemas.doctor import (
    AdminDoctorOut,
    AvailabilityIn,
    DoctorCreate,
    DoctorUpdate,
    ScheduleUpdate,
    TimeOffCreate,
    TimeOffOut,
)
from app.services.booking import (
    call_next_patient,
    cancel_appointment,
    log_activity,
    update_appointment_status,
)
from app.services.queue import doctor_queue, queue_counts
from app.services.schedule import add_time_off, remove_time_off, replace_schedule
from app.services.serializers import (
    appointment_out,
    availability_out,
    department_out,
    doctor_admin,
    doctor_public,
)

router = APIRouter(
    prefix="/admin",
    tags=["Administration"],
    dependencies=[Depends(require_csrf)],
)


def _appt_options():
    return (
        selectinload(Appointment.patient),
        selectinload(Appointment.doctor).selectinload(Doctor.user),
        selectinload(Appointment.doctor).selectinload(Doctor.department),
        selectinload(Appointment.department),
    )


def _doctor_options():
    return (
        selectinload(Doctor.user),
        selectinload(Doctor.department),
        selectinload(Doctor.availability),
        selectinload(Doctor.time_off),
    )


def _doctor_or_404(db, doctor_id: int) -> Doctor:
    doctor = db.scalar(
        select(Doctor).options(*_doctor_options()).where(Doctor.id == doctor_id)
    )
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found.")
    return doctor


def _doctor_counts(db, doctor_ids: list[int]) -> dict[int, int]:
    if not doctor_ids:
        return {}
    rows = db.execute(
        select(Appointment.doctor_id, func.count(Appointment.id))
        .where(Appointment.doctor_id.in_(doctor_ids))
        .group_by(Appointment.doctor_id)
    ).all()
    return {doctor_id: count for doctor_id, count in rows}


def _serialize_activity(row: ActivityLog, actor: User | None) -> dict:
    return {
        "id": row.id,
        "actor_name": actor.full_name if actor else "System",
        "action": row.action,
        "entity_type": row.entity_type,
        "entity_id": row.entity_id,
        "detail": row.detail,
        "created_at": row.created_at,
    }


@router.get("/stats", response_model=AdminStatsOut)
def stats(db: DbSession, _: AdminUser):
    today = date.today()
    total_patients = db.scalar(
        select(func.count(User.id)).where(User.role == UserRole.patient)
    ) or 0
    total_doctors = db.scalar(
        select(func.count(Doctor.id))
        .join(Doctor.user)
        .where(Doctor.is_active.is_(True), User.is_active.is_(True))
    ) or 0
    total_appointments = db.scalar(select(func.count(Appointment.id))) or 0
    today_appointments = db.scalar(
        select(func.count(Appointment.id)).where(Appointment.appointment_date == today)
    ) or 0
    upcoming = db.scalar(
        select(func.count(Appointment.id)).where(
            Appointment.appointment_date > today,
            Appointment.status.in_((AppointmentStatus.booked, AppointmentStatus.checked_in)),
        )
    ) or 0
    cancelled = db.scalar(
        select(func.count(Appointment.id)).where(
            Appointment.status == AppointmentStatus.cancelled
        )
    ) or 0
    completed = db.scalar(
        select(func.count(Appointment.id)).where(
            Appointment.status == AppointmentStatus.completed
        )
    ) or 0
    active_queues = db.scalar(
        select(func.count(Appointment.id)).where(
            Appointment.status == AppointmentStatus.in_progress
        )
    ) or 0

    start = today - timedelta(days=6)
    created_rows = db.execute(
        select(func.date(Appointment.created_at), func.count(Appointment.id))
        .where(Appointment.created_at >= datetime.combine(start, datetime.min.time()))
        .group_by(func.date(Appointment.created_at))
    ).all()
    created_map = {str(day): count for day, count in created_rows}
    bookings = []
    for offset in range(7):
        day = start + timedelta(days=offset)
        bookings.append(
            {
                "date": day.isoformat(),
                "label": day.strftime("%a"),
                "count": created_map.get(day.isoformat(), 0),
            }
        )

    status_rows = db.execute(
        select(Appointment.status, func.count(Appointment.id)).group_by(Appointment.status)
    ).all()
    status_distribution = [
        {"name": status.value.replace("_", " ").title(), "value": count}
        for status, count in status_rows
    ]
    dept_rows = db.execute(
        select(Department.name, func.count(Appointment.id))
        .join(Appointment, Appointment.department_id == Department.id)
        .group_by(Department.name)
        .order_by(func.count(Appointment.id).desc())
    ).all()
    department_distribution = [{"name": name, "value": count} for name, count in dept_rows]

    activity_rows = list(
        db.scalars(
            select(ActivityLog)
            .order_by(ActivityLog.created_at.desc(), ActivityLog.id.desc())
            .limit(8)
        ).all()
    )
    actor_ids = [row.actor_id for row in activity_rows if row.actor_id]
    actors = {
        user.id: user
        for user in db.scalars(select(User).where(User.id.in_(actor_ids))).all()
    } if actor_ids else {}
    unread_messages = db.scalar(
        select(func.count(ContactMessage.id)).where(ContactMessage.is_handled.is_(False))
    ) or 0

    return AdminStatsOut(
        total_patients=total_patients,
        total_doctors=total_doctors,
        total_appointments=total_appointments,
        today_appointments=today_appointments,
        upcoming_appointments=upcoming,
        cancelled_appointments=cancelled,
        completed_appointments=completed,
        active_queues=active_queues,
        bookings_last_7_days=bookings,
        status_distribution=status_distribution,
        department_distribution=department_distribution,
        recent_activity=[
            _serialize_activity(row, actors.get(row.actor_id)) for row in activity_rows
        ],
        unread_messages=unread_messages,
    )


# ---------------------------------------------------------------------------
# Patients
# ---------------------------------------------------------------------------


@router.get("/patients", response_model=Page[AdminUserOut])
def list_patients(
    db: DbSession,
    _: AdminUser,
    q: str | None = Query(default=None, max_length=100),
    status_filter: str = Query(default="all", alias="status", pattern="^(all|active|inactive)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=50),
):
    stmt = select(User).where(User.role == UserRole.patient)
    if q:
        term = f"%{q.strip()}%"
        stmt = stmt.where(
            User.full_name.ilike(term) | User.email.ilike(term) | User.phone.ilike(term)
        )
    if status_filter == "active":
        stmt = stmt.where(User.is_active.is_(True))
    elif status_filter == "inactive":
        stmt = stmt.where(User.is_active.is_(False))
    stmt = stmt.order_by(User.created_at.desc(), User.id.desc())
    total = db.scalar(select(func.count()).select_from(stmt.order_by(None).subquery())) or 0
    users = list(db.scalars(stmt.offset((page - 1) * page_size).limit(page_size)).all())
    counts = {}
    if users:
        counts = dict(
            db.execute(
                select(Appointment.patient_id, func.count(Appointment.id))
                .where(Appointment.patient_id.in_([u.id for u in users]))
                .group_by(Appointment.patient_id)
            ).all()
        )
    pages = max(1, (total + page_size - 1) // page_size)
    return Page[AdminUserOut](
        items=[
            AdminUserOut(
                id=u.id,
                email=u.email,
                full_name=u.full_name,
                phone=u.phone,
                role=u.role.value,
                is_active=u.is_active,
                date_of_birth=u.date_of_birth,
                gender=u.gender,
                created_at=u.created_at,
                appointment_count=counts.get(u.id, 0),
            )
            for u in users
        ],
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


@router.get("/patients/{patient_id}", response_model=AdminUserOut)
def get_patient(patient_id: int, db: DbSession, _: AdminUser):
    user = db.get(User, patient_id)
    if not user or user.role != UserRole.patient:
        raise HTTPException(status_code=404, detail="Patient not found.")
    count = db.scalar(
        select(func.count(Appointment.id)).where(Appointment.patient_id == patient_id)
    ) or 0
    return AdminUserOut(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        role=user.role.value,
        is_active=user.is_active,
        date_of_birth=user.date_of_birth,
        gender=user.gender,
        created_at=user.created_at,
        appointment_count=count,
    )


@router.patch("/patients/{patient_id}", response_model=AdminUserOut)
def update_patient(
    patient_id: int, payload: AdminPatientUpdate, db: DbSession, admin: AdminUser
):
    user = db.get(User, patient_id)
    if not user or user.role != UserRole.patient:
        raise HTTPException(status_code=404, detail="Patient not found.")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    log_activity(
        db,
        admin.id,
        "patient.updated",
        "user",
        user.id,
        f"Updated patient {user.full_name}",
    )
    db.commit()
    return get_patient(patient_id, db, admin)


# ---------------------------------------------------------------------------
# Doctors
# ---------------------------------------------------------------------------


@router.get("/doctors", response_model=Page[AdminDoctorOut])
def list_doctors(
    db: DbSession,
    _: AdminUser,
    q: str | None = Query(default=None, max_length=100),
    department_id: int | None = None,
    status_filter: str = Query(default="all", alias="status", pattern="^(all|active|inactive)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=50),
):
    stmt = select(Doctor).options(*_doctor_options()).join(Doctor.user).join(Doctor.department)
    if q:
        term = f"%{q.strip()}%"
        stmt = stmt.where(
            User.full_name.ilike(term)
            | Doctor.specialization.ilike(term)
            | Department.name.ilike(term)
        )
    if department_id:
        stmt = stmt.where(Doctor.department_id == department_id)
    if status_filter == "active":
        stmt = stmt.where(Doctor.is_active.is_(True), User.is_active.is_(True))
    elif status_filter == "inactive":
        stmt = stmt.where(or_(Doctor.is_active.is_(False), User.is_active.is_(False)))
    stmt = stmt.order_by(User.full_name.asc())
    total = db.scalar(select(func.count()).select_from(stmt.order_by(None).subquery())) or 0
    doctors = list(db.scalars(stmt.offset((page - 1) * page_size).limit(page_size)).all())
    counts = _doctor_counts(db, [d.id for d in doctors])
    pages = max(1, (total + page_size - 1) // page_size)
    return Page[AdminDoctorOut](
        items=[AdminDoctorOut(**doctor_admin(d, counts.get(d.id, 0))) for d in doctors],
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


@router.post("/doctors", response_model=AdminDoctorOut, status_code=201)
def create_doctor(payload: DoctorCreate, db: DbSession, admin: AdminUser):
    department = db.get(Department, payload.department_id)
    if not department:
        raise HTTPException(status_code=422, detail="Department not found.")
    if db.scalar(select(User.id).where(User.email == payload.email.lower())):
        raise HTTPException(status_code=409, detail="An account with this email already exists.")
    user = User(
        email=payload.email.lower(),
        full_name=payload.full_name,
        phone=payload.phone,
        hashed_password=hash_password(payload.password),
        role=UserRole.doctor,
    )
    doctor = Doctor(
        user=user,
        department_id=payload.department_id,
        specialization=payload.specialization,
        qualifications=payload.qualifications,
        experience_years=payload.experience_years,
        bio=payload.bio,
        consultation_fee=payload.consultation_fee,
        room=payload.room,
        avg_consult_minutes=payload.avg_consult_minutes,
        avatar_color=payload.avatar_color,
        is_active=payload.is_active,
    )
    for block in payload.availability:
        doctor.availability.append(
            Availability(
                weekday=block.weekday,
                start_time=block.start_time_obj(),
                end_time=block.end_time_obj(),
                slot_minutes=block.slot_minutes,
                is_active=block.is_active,
            )
        )
    db.add(doctor)
    try:
        db.flush()
        log_activity(
            db,
            admin.id,
            "doctor.created",
            "doctor",
            doctor.id,
            f"Added {user.full_name} ({payload.specialization})",
        )
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Could not create doctor. Check the email and schedule.")
    db.refresh(doctor)
    return AdminDoctorOut(**doctor_admin(doctor))


@router.patch("/doctors/{doctor_id}", response_model=AdminDoctorOut)
def update_doctor(
    doctor_id: int, payload: DoctorUpdate, db: DbSession, admin: AdminUser
):
    doctor = _doctor_or_404(db, doctor_id)
    data = payload.model_dump(exclude_unset=True)
    if "email" in data and data["email"]:
        email = data["email"].lower()
        clash = db.scalar(
            select(User.id).where(User.email == email, User.id != doctor.user_id)
        )
        if clash:
            raise HTTPException(status_code=409, detail="That email is already in use.")
        doctor.user.email = email
    if "department_id" in data and data["department_id"]:
        if not db.get(Department, data["department_id"]):
            raise HTTPException(status_code=422, detail="Department not found.")
        doctor.department_id = data.pop("department_id")
    for field in ("full_name", "phone"):
        if field in data:
            setattr(doctor.user, field, data.pop(field))
    for field, value in data.items():
        if field != "email":
            setattr(doctor, field, value)
    if "is_active" in data:
        doctor.user.is_active = bool(data["is_active"])
    log_activity(
        db,
        admin.id,
        "doctor.updated",
        "doctor",
        doctor.id,
        f"Updated {doctor.user.full_name}",
    )
    db.commit()
    doctor = _doctor_or_404(db, doctor_id)
    count = _doctor_counts(db, [doctor.id]).get(doctor.id, 0)
    return AdminDoctorOut(**doctor_admin(doctor, count))


# ---------------------------------------------------------------------------
# Departments
# ---------------------------------------------------------------------------


@router.get("/departments", response_model=list[DepartmentOut])
def list_departments(
    db: DbSession, _: AdminUser, include_inactive: bool = Query(default=True)
):
    stmt = select(Department).order_by(Department.name.asc())
    if not include_inactive:
        stmt = stmt.where(Department.is_active.is_(True))
    departments = list(db.scalars(stmt).all())
    counts = dict(
        db.execute(
            select(Doctor.department_id, func.count(Doctor.id)).group_by(Doctor.department_id)
        ).all()
    )
    return [DepartmentOut(**department_out(d, counts.get(d.id, 0))) for d in departments]


@router.post("/departments", response_model=DepartmentOut, status_code=201)
def create_department(payload: DepartmentCreate, db: DbSession, admin: AdminUser):
    if db.scalar(select(Department.id).where(Department.name == payload.name)):
        raise HTTPException(status_code=409, detail="A department with this name already exists.")
    base_slug = slugify(payload.name)
    slug = base_slug
    index = 2
    while db.scalar(select(Department.id).where(Department.slug == slug)):
        slug = f"{base_slug}-{index}"
        index += 1
    dept = Department(
        name=payload.name,
        slug=slug,
        description=payload.description,
        icon=payload.icon,
        accent=payload.accent,
        is_active=payload.is_active,
    )
    db.add(dept)
    db.flush()
    log_activity(
        db, admin.id, "department.created", "department", dept.id, f"Created {dept.name}"
    )
    db.commit()
    db.refresh(dept)
    return DepartmentOut(**department_out(dept, 0))


@router.patch("/departments/{department_id}", response_model=DepartmentOut)
def update_department(
    department_id: int, payload: DepartmentUpdate, db: DbSession, admin: AdminUser
):
    dept = db.get(Department, department_id)
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found.")
    data = payload.model_dump(exclude_unset=True)
    if "name" in data and data["name"] != dept.name:
        clash = db.scalar(
            select(Department.id).where(
                Department.name == data["name"], Department.id != department_id
            )
        )
        if clash:
            raise HTTPException(status_code=409, detail="A department with this name already exists.")
        base_slug = slugify(data["name"])
        slug = base_slug
        index = 2
        while db.scalar(
            select(Department.id).where(Department.slug == slug, Department.id != department_id)
        ):
            slug = f"{base_slug}-{index}"
            index += 1
        dept.slug = slug
    for field, value in data.items():
        setattr(dept, field, value)
    log_activity(
        db, admin.id, "department.updated", "department", dept.id, f"Updated {dept.name}"
    )
    db.commit()
    db.refresh(dept)
    count = db.scalar(
        select(func.count(Doctor.id)).where(Doctor.department_id == dept.id)
    ) or 0
    return DepartmentOut(**department_out(dept, count))


@router.delete("/departments/{department_id}", response_model=Message)
def delete_department(department_id: int, db: DbSession, admin: AdminUser):
    dept = db.get(Department, department_id)
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found.")
    doctor_count = db.scalar(
        select(func.count(Doctor.id)).where(Doctor.department_id == dept.id)
    ) or 0
    appointment_count = db.scalar(
        select(func.count(Appointment.id)).where(Appointment.department_id == dept.id)
    ) or 0
    if doctor_count or appointment_count:
        raise HTTPException(
            status_code=409,
            detail="This department has doctors or appointments. Deactivate it instead.",
        )
    db.delete(dept)
    log_activity(
        db, admin.id, "department.deleted", "department", department_id, f"Deleted {dept.name}"
    )
    db.commit()
    return Message(message="Department deleted.")


# ---------------------------------------------------------------------------
# Appointments and queues
# ---------------------------------------------------------------------------


@router.get("/appointments", response_model=Page[AppointmentOut])
def list_appointments(
    db: DbSession,
    _: AdminUser,
    q: str | None = Query(default=None, max_length=100),
    status_filter: str | None = Query(default=None, alias="status"),
    doctor_id: int | None = None,
    day: date | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=50),
):
    stmt = (
        select(Appointment)
        .options(*_appt_options())
        .join(User, Appointment.patient_id == User.id)
        .join(Doctor, Appointment.doctor_id == Doctor.id)
        .join(Department, Appointment.department_id == Department.id)
    )
    if q:
        term = f"%{q.strip()}%"
        stmt = stmt.where(
            User.full_name.ilike(term)
            | Appointment.reference_code.ilike(term)
            | Doctor.specialization.ilike(term)
        )
    if status_filter:
        try:
            stmt = stmt.where(Appointment.status == AppointmentStatus(status_filter))
        except ValueError:
            raise HTTPException(status_code=422, detail="Unknown appointment status.")
    if doctor_id:
        stmt = stmt.where(Appointment.doctor_id == doctor_id)
    if day:
        stmt = stmt.where(Appointment.appointment_date == day)
    stmt = stmt.order_by(
        Appointment.appointment_date.desc(), Appointment.slot_time.asc()
    )
    total = db.scalar(select(func.count()).select_from(stmt.order_by(None).subquery())) or 0
    rows = list(db.scalars(stmt.offset((page - 1) * page_size).limit(page_size)).all())
    pages = max(1, (total + page_size - 1) // page_size)
    return Page[AppointmentOut](
        items=[
            AppointmentOut(**appointment_out(a, include_patient=True, include_patient_email=True))
            for a in rows
        ],
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


@router.get("/appointments/{appointment_id}", response_model=AppointmentOut)
def get_appointment(appointment_id: int, db: DbSession, _: AdminUser):
    row = db.scalar(
        select(Appointment).options(*_appt_options()).where(Appointment.id == appointment_id)
    )
    if not row:
        raise HTTPException(status_code=404, detail="Appointment not found.")
    return AppointmentOut(
        **appointment_out(row, include_patient=True, include_patient_email=True)
    )


@router.post("/appointments/{appointment_id}/cancel", response_model=Message)
def admin_cancel(
    appointment_id: int,
    payload: AdminAppointmentCancel,
    db: DbSession,
    admin: AdminUser,
):
    row = db.get(Appointment, appointment_id)
    if not row:
        raise HTTPException(status_code=404, detail="Appointment not found.")
    cancel_appointment(db, row, admin, reason=payload.reason)
    return Message(message="Appointment cancelled.")


@router.patch("/appointments/{appointment_id}/status", response_model=AppointmentOut)
def admin_status(
    appointment_id: int,
    payload: StatusUpdateRequest,
    db: DbSession,
    admin: AdminUser,
):
    row = db.scalar(
        select(Appointment).options(*_appt_options()).where(Appointment.id == appointment_id)
    )
    if not row:
        raise HTTPException(status_code=404, detail="Appointment not found.")
    row = update_appointment_status(
        db, row, payload.status, admin, notes=payload.doctor_notes
    )
    row = db.scalar(
        select(Appointment).options(*_appt_options()).where(Appointment.id == appointment_id)
    )
    return AppointmentOut(
        **appointment_out(row, include_patient=True, include_patient_email=True)
    )


@router.get("/queues")
def queues(
    db: DbSession,
    _: AdminUser,
    day: date | None = Query(default=None),
    doctor_id: int | None = None,
):
    target = day or date.today()
    if doctor_id:
        doctor = _doctor_or_404(db, doctor_id)
        return DoctorQueueOut(**doctor_queue(db, doctor, target))
    doctors = list(
        db.scalars(
            select(Doctor)
            .options(*_doctor_options())
            .where(Doctor.is_active.is_(True))
            .order_by(Doctor.id.asc())
        ).all()
    )
    from app.services.queue import day_appointments

    items = []
    for doctor in doctors:
        appointments = day_appointments(db, doctor.id, target)
        counts = queue_counts(appointments)
        items.append(
            {
                "doctor": {
                    "id": doctor.id,
                    "full_name": doctor.user.full_name,
                    "specialization": doctor.specialization,
                    "department_name": doctor.department.name,
                    "avatar_color": doctor.avatar_color,
                    "room": doctor.room,
                },
                "stats": counts.model_dump(),
                "current": next(
                    (
                        appointment_out(a, include_patient=True)
                        for a in appointments
                        if a.status == AppointmentStatus.in_progress
                    ),
                    None,
                ),
            }
        )
    return {"date": target, "items": items}


@router.post("/queues/{doctor_id}/call-next")
def admin_call_next(doctor_id: int, db: DbSession, admin: AdminUser):
    doctor = _doctor_or_404(db, doctor_id)
    appointment = call_next_patient(db, doctor, admin)
    if not appointment:
        return {"message": "No patients are waiting right now.", "appointment": None}
    row = db.scalar(
        select(Appointment).options(*_appt_options()).where(Appointment.id == appointment.id)
    )
    return {
        "message": f"Queue #{row.queue_number} has been called.",
        "appointment": appointment_out(row, include_patient=True, include_patient_email=True),
    }


# ---------------------------------------------------------------------------
# Schedules
# ---------------------------------------------------------------------------


@router.get("/doctors/{doctor_id}/schedule")
def get_schedule(doctor_id: int, db: DbSession, _: AdminUser):
    doctor = _doctor_or_404(db, doctor_id)
    return {
        "doctor": doctor_admin(doctor),
        "availability": [availability_out(b) for b in doctor.availability],
        "time_off": [
            TimeOffOut(id=o.id, off_date=o.off_date, reason=o.reason)
            for o in sorted(doctor.time_off, key=lambda item: item.off_date)
            if o.off_date >= date.today()
        ],
    }


@router.put("/doctors/{doctor_id}/schedule")
def update_schedule(
    doctor_id: int, payload: ScheduleUpdate, db: DbSession, admin: AdminUser
):
    doctor = _doctor_or_404(db, doctor_id)
    replace_schedule(db, doctor, payload.availability)
    log_activity(
        db,
        admin.id,
        "schedule.updated",
        "doctor",
        doctor.id,
        f"Updated schedule for {doctor.user.full_name}",
    )
    db.commit()
    return {"message": "Schedule updated.", "availability": [availability_out(b) for b in doctor.availability]}


@router.post("/doctors/{doctor_id}/time-off", response_model=TimeOffOut, status_code=201)
def admin_add_time_off(
    doctor_id: int, payload: TimeOffCreate, db: DbSession, admin: AdminUser
):
    doctor = _doctor_or_404(db, doctor_id)
    entry = add_time_off(db, doctor, payload.off_date, payload.reason)
    return TimeOffOut(id=entry.id, off_date=entry.off_date, reason=entry.reason)


@router.delete("/doctors/{doctor_id}/time-off/{entry_id}", response_model=Message)
def admin_remove_time_off(
    doctor_id: int, entry_id: int, db: DbSession, admin: AdminUser
):
    doctor = _doctor_or_404(db, doctor_id)
    remove_time_off(db, doctor, entry_id)
    return Message(message="Time off removed.")


# ---------------------------------------------------------------------------
# Activity and contact messages
# ---------------------------------------------------------------------------


@router.get("/activity", response_model=Page[ActivityOut])
def activity(
    db: DbSession,
    _: AdminUser,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=15, ge=1, le=50),
):
    stmt = select(ActivityLog).order_by(ActivityLog.created_at.desc(), ActivityLog.id.desc())
    total = db.scalar(select(func.count()).select_from(stmt.order_by(None).subquery())) or 0
    rows = list(db.scalars(stmt.offset((page - 1) * page_size).limit(page_size)).all())
    actor_ids = [row.actor_id for row in rows if row.actor_id]
    actors = {
        user.id: user
        for user in db.scalars(select(User).where(User.id.in_(actor_ids))).all()
    } if actor_ids else {}
    pages = max(1, (total + page_size - 1) // page_size)
    return Page[ActivityOut](
        items=[
            ActivityOut(**_serialize_activity(row, actors.get(row.actor_id))) for row in rows
        ],
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


@router.get("/messages", response_model=Page[ContactOut])
def messages(
    db: DbSession,
    _: AdminUser,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=50),
):
    stmt = select(ContactMessage).order_by(ContactMessage.created_at.desc())
    total = db.scalar(select(func.count()).select_from(stmt.order_by(None).subquery())) or 0
    rows = list(db.scalars(stmt.offset((page - 1) * page_size).limit(page_size)).all())
    pages = max(1, (total + page_size - 1) // page_size)
    return Page[ContactOut](
        items=[
            ContactOut(
                id=row.id,
                name=row.name,
                email=row.email,
                subject=row.subject,
                message=row.message,
                is_handled=row.is_handled,
                created_at=row.created_at,
            )
            for row in rows
        ],
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


@router.post("/messages/{message_id}/handled", response_model=Message)
def mark_message_handled(message_id: int, db: DbSession, admin: AdminUser):
    row = db.get(ContactMessage, message_id)
    if not row:
        raise HTTPException(status_code=404, detail="Message not found.")
    row.is_handled = True
    db.commit()
    return Message(message="Message marked as handled.")
