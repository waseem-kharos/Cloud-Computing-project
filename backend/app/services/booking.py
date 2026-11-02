from __future__ import annotations

from datetime import date, datetime, time, timedelta

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import generate_reference
from app.models.activity import ActivityLog
from app.models.appointment import Appointment, AppointmentStatus
from app.models.doctor import Doctor
from app.models.notification import Notification
from app.models.user import User
from app.schemas.appointment import AppointmentCreate, RescheduleRequest
from app.services.queue import block_for_slot, doctor_is_off, slot_times
from app.services.serializers import fmt_time


ALLOWED_TRANSITIONS: dict[AppointmentStatus, set[AppointmentStatus]] = {
    AppointmentStatus.booked: {
        AppointmentStatus.checked_in,
        AppointmentStatus.cancelled,
        AppointmentStatus.no_show,
    },
    AppointmentStatus.checked_in: {
        AppointmentStatus.in_progress,
        AppointmentStatus.cancelled,
        AppointmentStatus.no_show,
    },
    AppointmentStatus.in_progress: {
        AppointmentStatus.completed,
        AppointmentStatus.cancelled,
    },
    AppointmentStatus.completed: set(),
    AppointmentStatus.cancelled: set(),
    AppointmentStatus.no_show: set(),
}


def parse_slot(value: str) -> time:
    hour, minute = map(int, value.split(":"))
    return time(hour, minute)


def add_notification(
    db: Session,
    user_id: int,
    *,
    title: str,
    message: str,
    category: str = "info",
    link: str | None = None,
    commit: bool = False,
) -> None:
    db.add(
        Notification(
            user_id=user_id,
            title=title,
            message=message,
            category=category,
            link=link,
        )
    )
    if commit:
        db.commit()


def log_activity(
    db: Session,
    actor_id: int | None,
    action: str,
    entity_type: str,
    entity_id: int | None = None,
    detail: str | None = None,
) -> None:
    db.add(
        ActivityLog(
            actor_id=actor_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            detail=detail,
        )
    )


def _reference(db: Session) -> str:
    for _ in range(10):
        candidate = generate_reference()
        exists = db.scalar(select(Appointment.id).where(Appointment.reference_code == candidate))
        if not exists:
            return candidate
    raise HTTPException(status_code=500, detail="Could not create a booking reference.")


def _patient_slot_conflict(
    db: Session, patient_id: int, day: date, slot: time, exclude_id: int | None = None
) -> bool:
    query = select(Appointment.id).where(
        Appointment.patient_id == patient_id,
        Appointment.appointment_date == day,
        Appointment.slot_time == slot,
        Appointment.status != AppointmentStatus.cancelled,
    )
    if exclude_id:
        query = query.where(Appointment.id != exclude_id)
    return db.scalar(query) is not None


def _ensure_slot_bookable(db: Session, doctor: Doctor, day: date, slot: time) -> int:
    today = date.today()
    if day < today:
        raise HTTPException(status_code=422, detail="You cannot book a date in the past.")
    if day > today + timedelta(days=settings.booking_horizon_days):
        raise HTTPException(
            status_code=422,
            detail=f"Appointments can be booked up to {settings.booking_horizon_days} days ahead.",
        )
    if doctor_is_off(doctor, day):
        raise HTTPException(status_code=422, detail="The doctor is unavailable on this date.")
    times = slot_times(doctor, day)
    if slot not in times:
        raise HTTPException(status_code=422, detail="This time is not part of the doctor's schedule.")
    if day == today and slot <= datetime.now().time():
        raise HTTPException(status_code=422, detail="This time has already passed.")
    return times.index(slot) + 1


def book_appointment(db: Session, patient: User, payload: AppointmentCreate) -> Appointment:
    doctor = db.get(Doctor, payload.doctor_id)
    if not doctor or not doctor.is_active or not doctor.user.is_active:
        raise HTTPException(status_code=404, detail="Doctor not found or currently unavailable.")
    if not doctor.department.is_active:
        raise HTTPException(status_code=422, detail="This department is not accepting appointments.")

    slot = parse_slot(payload.slot_time)
    queue_number = _ensure_slot_bookable(db, doctor, payload.appointment_date, slot)

    existing = db.scalar(
        select(Appointment.id).where(
            Appointment.doctor_id == doctor.id,
            Appointment.appointment_date == payload.appointment_date,
            Appointment.slot_time == slot,
            Appointment.status != AppointmentStatus.cancelled,
        )
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="That slot was just booked. Please choose another time.",
        )
    if _patient_slot_conflict(db, patient.id, payload.appointment_date, slot):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You already have another appointment at this time.",
        )

    block = block_for_slot(doctor, payload.appointment_date, slot)
    appointment = Appointment(
        reference_code=_reference(db),
        patient_id=patient.id,
        doctor_id=doctor.id,
        department_id=doctor.department_id,
        appointment_date=payload.appointment_date,
        slot_time=slot,
        duration_minutes=block.slot_minutes if block else doctor.avg_consult_minutes,
        queue_number=queue_number,
        status=AppointmentStatus.booked,
        reason=payload.reason,
    )
    db.add(appointment)
    try:
        db.flush()
        add_notification(
            db,
            patient.id,
            title="Appointment confirmed",
            message=(
                f"Your appointment with {doctor.user.full_name} on "
                f"{payload.appointment_date.strftime('%d %b %Y')} at {fmt_time(slot)} is confirmed. "
                f"Your queue number is {queue_number}."
            ),
            category="success",
            link=f"/patient/appointments/{appointment.id}",
        )
        add_notification(
            db,
            doctor.user_id,
            title="New appointment booked",
            message=(
                f"{patient.full_name} booked {payload.appointment_date.strftime('%d %b %Y')} "
                f"at {fmt_time(slot)} (queue #{queue_number})."
            ),
            category="info",
            link="/doctor/appointments",
        )
        log_activity(
            db,
            patient.id,
            "appointment.booked",
            "appointment",
            appointment.id,
            f"Booked with {doctor.user.full_name} on {payload.appointment_date} at {fmt_time(slot)}",
        )
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="That slot was just booked by another patient. Please choose another time.",
        )
    db.refresh(appointment)
    return appointment


def reschedule_appointment(
    db: Session, appointment: Appointment, patient: User, payload: RescheduleRequest
) -> Appointment:
    if appointment.patient_id != patient.id:
        raise HTTPException(status_code=403, detail="You can only reschedule your own appointments.")
    if appointment.status != AppointmentStatus.booked:
        raise HTTPException(
            status_code=409,
            detail="Only appointments that have not been checked in can be rescheduled.",
        )
    if appointment.appointment_date == payload.appointment_date and fmt_time(
        appointment.slot_time
    ) == payload.slot_time:
        raise HTTPException(status_code=422, detail="Choose a different date or time.")

    doctor = appointment.doctor
    slot = parse_slot(payload.slot_time)
    queue_number = _ensure_slot_bookable(db, doctor, payload.appointment_date, slot)

    conflict = db.scalar(
        select(Appointment.id).where(
            Appointment.doctor_id == doctor.id,
            Appointment.appointment_date == payload.appointment_date,
            Appointment.slot_time == slot,
            Appointment.id != appointment.id,
            Appointment.status != AppointmentStatus.cancelled,
        )
    )
    if conflict:
        raise HTTPException(status_code=409, detail="That slot is no longer available.")
    if _patient_slot_conflict(
        db, patient.id, payload.appointment_date, slot, exclude_id=appointment.id
    ):
        raise HTTPException(
            status_code=409,
            detail="You already have another appointment at this time.",
        )

    old = f"{appointment.appointment_date.strftime('%d %b')} {fmt_time(appointment.slot_time)}"
    block = block_for_slot(doctor, payload.appointment_date, slot)
    appointment.appointment_date = payload.appointment_date
    appointment.slot_time = slot
    appointment.duration_minutes = block.slot_minutes if block else doctor.avg_consult_minutes
    appointment.queue_number = queue_number

    try:
        add_notification(
            db,
            patient.id,
            title="Appointment rescheduled",
            message=(
                f"Your appointment was moved from {old} to "
                f"{payload.appointment_date.strftime('%d %b %Y')} at {fmt_time(slot)}. "
                f"Your new queue number is {queue_number}."
            ),
            category="info",
            link=f"/patient/appointments/{appointment.id}",
        )
        add_notification(
            db,
            doctor.user_id,
            title="Appointment rescheduled",
            message=(
                f"{patient.full_name} moved their appointment to "
                f"{payload.appointment_date.strftime('%d %b %Y')} at {fmt_time(slot)}."
            ),
            category="warning",
            link="/doctor/appointments",
        )
        log_activity(
            db,
            patient.id,
            "appointment.rescheduled",
            "appointment",
            appointment.id,
            f"Moved from {old} to {payload.appointment_date} {fmt_time(slot)}",
        )
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="That slot was just taken. Choose another time.")
    db.refresh(appointment)
    return appointment


def cancel_appointment(
    db: Session, appointment: Appointment, actor: User, *, reason: str | None = None
) -> Appointment:
    if appointment.status in (AppointmentStatus.completed, AppointmentStatus.in_progress):
        raise HTTPException(status_code=409, detail="This appointment can no longer be cancelled.")
    if appointment.status in (AppointmentStatus.cancelled, AppointmentStatus.no_show):
        raise HTTPException(status_code=409, detail="This appointment is already closed.")

    appointment.status = AppointmentStatus.cancelled
    appointment.cancelled_at = datetime.now()
    add_notification(
        db,
        appointment.patient_id,
        title="Appointment cancelled",
        message=(
            f"Your appointment with {appointment.doctor.user.full_name} on "
            f"{appointment.appointment_date.strftime('%d %b %Y')} at "
            f"{fmt_time(appointment.slot_time)} was cancelled."
        ),
        category="warning",
        link="/patient/appointments",
    )
    if actor.id != appointment.doctor.user_id:
        add_notification(
            db,
            appointment.doctor.user_id,
            title="Appointment cancelled",
            message=(
                f"{appointment.patient.full_name}'s appointment on "
                f"{appointment.appointment_date.strftime('%d %b %Y')} at "
                f"{fmt_time(appointment.slot_time)} was cancelled."
            ),
            category="warning",
            link="/doctor/appointments",
        )
    log_activity(
        db,
        actor.id,
        "appointment.cancelled",
        "appointment",
        appointment.id,
        reason or f"Cancelled appointment {appointment.reference_code}",
    )
    db.commit()
    db.refresh(appointment)
    return appointment


def update_appointment_status(
    db: Session,
    appointment: Appointment,
    new_status: AppointmentStatus,
    actor: User,
    *,
    doctor_scope: Doctor | None = None,
    notes: str | None = None,
) -> Appointment:
    if doctor_scope and appointment.doctor_id != doctor_scope.id:
        raise HTTPException(status_code=403, detail="This appointment belongs to another doctor.")
    if new_status == appointment.status:
        if notes is not None:
            appointment.doctor_notes = notes
            db.commit()
        return appointment
    if new_status not in ALLOWED_TRANSITIONS[appointment.status]:
        raise HTTPException(
            status_code=409,
            detail=f"Cannot change status from {appointment.status.value} to {new_status.value}.",
        )
    if new_status == AppointmentStatus.in_progress:
        current = db.scalar(
            select(Appointment.id).where(
                Appointment.doctor_id == appointment.doctor_id,
                Appointment.appointment_date == appointment.appointment_date,
                Appointment.status == AppointmentStatus.in_progress,
                Appointment.id != appointment.id,
            )
        )
        if current:
            raise HTTPException(
                status_code=409,
                detail="Another patient is already in consultation. Complete that visit first.",
            )

    old_status = appointment.status
    appointment.status = new_status
    if notes is not None:
        appointment.doctor_notes = notes
    if new_status == AppointmentStatus.cancelled:
        appointment.cancelled_at = datetime.now()

    messages = {
        AppointmentStatus.checked_in: "You are checked in. Please wait for your queue number to be called.",
        AppointmentStatus.in_progress: "It is your turn. Please proceed to the consultation room.",
        AppointmentStatus.completed: "Your consultation is complete. Thank you for visiting.",
        AppointmentStatus.cancelled: "Your appointment has been cancelled.",
        AppointmentStatus.no_show: "Your appointment was marked as a no-show.",
    }
    add_notification(
        db,
        appointment.patient_id,
        title="Appointment updated",
        message=messages.get(new_status, "Your appointment status was updated."),
        category="success" if new_status == AppointmentStatus.in_progress else "info",
        link=f"/patient/appointments/{appointment.id}",
    )
    log_activity(
        db,
        actor.id,
        f"appointment.{new_status.value}",
        "appointment",
        appointment.id,
        f"{appointment.reference_code} moved from {old_status.value} to {new_status.value}",
    )
    db.commit()
    db.refresh(appointment)
    return appointment


def call_next_patient(db: Session, doctor: Doctor, actor: User) -> Appointment | None:
    today = date.today()
    try:
        # Lock any in-progress appointment for this doctor/date
        current = db.scalar(
            select(Appointment)
            .where(
                Appointment.doctor_id == doctor.id,
                Appointment.appointment_date == today,
                Appointment.status == AppointmentStatus.in_progress,
            )
            .with_for_update()
        )
        if current:
            db.rollback()
            raise HTTPException(
                status_code=409,
                detail="A patient is already in consultation. Mark that visit complete first.",
            )
        # Lock next waiting patient
        nxt = db.scalar(
            select(Appointment)
            .where(
                Appointment.doctor_id == doctor.id,
                Appointment.appointment_date == today,
                Appointment.status.in_((AppointmentStatus.booked, AppointmentStatus.checked_in)),
            )
            .order_by(Appointment.queue_number.asc())
            .with_for_update()
        )
        if not nxt:
            db.rollback()
            return None
        nxt.status = AppointmentStatus.in_progress
        add_notification(
            db,
            nxt.patient_id,
            title=f"Queue #{nxt.queue_number}: it is your turn",
            message=f"{doctor.user.full_name} is ready to see you. Please proceed to {doctor.room or 'the consultation room'}.",
            category="success",
            link=f"/patient/appointments/{nxt.id}",
        )
        log_activity(
            db,
            actor.id,
            "queue.called_next",
            "appointment",
            nxt.id,
            f"Called queue #{nxt.queue_number} for {doctor.user.full_name}",
        )
        db.commit()
        db.refresh(nxt)
        return nxt
    except HTTPException:
        raise
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Could not call next patient due to a concurrent update. Please try again.")
    except Exception:
        db.rollback()
        raise HTTPException(status_code=409, detail="Could not call next patient. Please try again.")


