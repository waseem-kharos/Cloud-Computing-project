from __future__ import annotations

from datetime import date, datetime, time, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.appointment import Appointment, AppointmentStatus
from app.models.doctor import Availability, Doctor
from app.schemas.appointment import PublicQueueOut, QueueCountsOut, QueueStatusOut
from app.services.serializers import appointment_out, fmt_time

WAITING_STATUSES = (AppointmentStatus.booked, AppointmentStatus.checked_in)
QUEUE_STATUSES = (
    AppointmentStatus.booked,
    AppointmentStatus.checked_in,
    AppointmentStatus.in_progress,
)


def availability_blocks(doctor: Doctor, day: date) -> list[Availability]:
    return sorted(
        [
            block
            for block in doctor.availability
            if block.is_active and block.weekday == day.weekday()
        ],
        key=lambda block: block.start_time,
    )


def doctor_is_off(doctor: Doctor, day: date) -> bool:
    return any(off.off_date == day for off in doctor.time_off)


def slot_times(doctor: Doctor, day: date) -> list[time]:
    """Return the full deterministic slot grid for a doctor and date."""
    if doctor_is_off(doctor, day):
        return []
    times: set[time] = set()
    for block in availability_blocks(doctor, day):
        cursor = datetime.combine(day, block.start_time)
        end = datetime.combine(day, block.end_time)
        step = timedelta(minutes=max(5, block.slot_minutes))
        while cursor + step <= end:
            times.add(cursor.time())
            cursor += step
    return sorted(times)


def block_for_slot(doctor: Doctor, day: date, slot: time) -> Availability | None:
    for block in availability_blocks(doctor, day):
        if block.start_time <= slot < block.end_time:
            return block
    return None


def day_appointments(db: Session, doctor_id: int, day: date) -> list[Appointment]:
    return list(
        db.scalars(
            select(Appointment)
            .where(
                Appointment.doctor_id == doctor_id,
                Appointment.appointment_date == day,
                Appointment.status != AppointmentStatus.cancelled,
            )
            .order_by(Appointment.queue_number.asc())
        ).all()
    )


def active_appointments_by_slot(
    db: Session, doctor_id: int, day: date, exclude_id: int | None = None
) -> dict[time, Appointment]:
    query = select(Appointment).where(
        Appointment.doctor_id == doctor_id,
        Appointment.appointment_date == day,
        Appointment.status != AppointmentStatus.cancelled,
    )
    if exclude_id:
        query = query.where(Appointment.id != exclude_id)
    return {appt.slot_time.replace(second=0, microsecond=0): appt for appt in db.scalars(query).all()}


def slots_for_date(
    db: Session,
    doctor: Doctor,
    day: date,
    *,
    exclude_appointment_id: int | None = None,
    now: datetime | None = None,
) -> list[dict]:
    now = now or datetime.now()
    taken = active_appointments_by_slot(db, doctor.id, day, exclude_appointment_id)
    result: list[dict] = []
    for index, slot in enumerate(slot_times(doctor, day), start=1):
        reason = None
        available = True
        if day < now.date():
            available = False
            reason = "Past date"
        elif day == now.date() and slot <= now.time():
            available = False
            reason = "Time has passed"
        elif slot in taken:
            available = False
            reason = "Already booked"
        result.append(
            {
                "time": slot.strftime("%H:%M"),
                "available": available,
                "queue_number": index,
                "reason": reason,
            }
        )
    return result


def queue_snapshot(db: Session, appointment: Appointment) -> QueueStatusOut:
    appointments = day_appointments(db, appointment.doctor_id, appointment.appointment_date)
    current = next(
        (appt for appt in appointments if appt.status == AppointmentStatus.in_progress), None
    )
    ahead = [
        appt
        for appt in appointments
        if appt.queue_number < appointment.queue_number and appt.status in QUEUE_STATUSES
    ]
    total_in_queue = sum(1 for appt in appointments if appt.status in QUEUE_STATUSES)
    avg = max(1, appointment.doctor.avg_consult_minutes)

    if appointment.status in (AppointmentStatus.completed, AppointmentStatus.cancelled, AppointmentStatus.no_show):
        patients_ahead = 0
    else:
        patients_ahead = len(ahead)

    estimated_wait = patients_ahead * avg
    current_number = current.queue_number if current else None

    if appointment.status == AppointmentStatus.completed:
        progress = 100
    elif appointment.status == AppointmentStatus.in_progress:
        progress = 92
    elif appointment.status in (AppointmentStatus.cancelled, AppointmentStatus.no_show):
        progress = 100 if appointment.status == AppointmentStatus.cancelled else 95
    elif current_number is None:
        progress = 5
    else:
        progress = max(5, min(95, round(current_number / max(1, appointment.queue_number) * 100)))

    return QueueStatusOut(
        appointment_id=appointment.id,
        reference_code=appointment.reference_code,
        appointment_date=appointment.appointment_date,
        slot_time=fmt_time(appointment.slot_time),
        status=appointment.status,
        queue_number=appointment.queue_number,
        doctor_id=appointment.doctor_id,
        doctor_name=appointment.doctor.user.full_name,
        doctor_specialization=appointment.doctor.specialization,
        doctor_room=appointment.doctor.room,
        department_name=appointment.doctor.department.name,
        current_serving=current_number,
        patients_ahead=patients_ahead,
        total_in_queue=total_in_queue,
        estimated_wait_minutes=estimated_wait,
        avg_consult_minutes=avg,
        progress_percent=progress,
        updated_at=datetime.now(),
    )


def public_queue_snapshot(db: Session, appointment: Appointment) -> PublicQueueOut:
    snapshot = queue_snapshot(db, appointment)
    return PublicQueueOut(
        reference_code=snapshot.reference_code,
        appointment_date=snapshot.appointment_date,
        slot_time=snapshot.slot_time,
        status=snapshot.status,
        queue_number=snapshot.queue_number,
        doctor_name=snapshot.doctor_name,
        doctor_specialization=snapshot.doctor_specialization,
        doctor_room=snapshot.doctor_room,
        department_name=snapshot.department_name,
        current_serving=snapshot.current_serving,
        patients_ahead=snapshot.patients_ahead,
        total_in_queue=snapshot.total_in_queue,
        estimated_wait_minutes=snapshot.estimated_wait_minutes,
        avg_consult_minutes=snapshot.avg_consult_minutes,
        progress_percent=snapshot.progress_percent,
    )


def queue_counts(appointments: list[Appointment]) -> QueueCountsOut:
    return QueueCountsOut(
        today_total=len(appointments),
        waiting=sum(1 for a in appointments if a.status in WAITING_STATUSES),
        checked_in=sum(1 for a in appointments if a.status == AppointmentStatus.checked_in),
        in_progress=sum(1 for a in appointments if a.status == AppointmentStatus.in_progress),
        completed=sum(1 for a in appointments if a.status == AppointmentStatus.completed),
        no_show=sum(1 for a in appointments if a.status == AppointmentStatus.no_show),
    )


def doctor_queue(db: Session, doctor: Doctor, day: date) -> dict:
    appointments = day_appointments(db, doctor.id, day)
    current = next(
        (appt for appt in appointments if appt.status == AppointmentStatus.in_progress), None
    )
    waiting = [appt for appt in appointments if appt.status in WAITING_STATUSES]
    completed = [appt for appt in appointments if appt.status == AppointmentStatus.completed]
    return {
        "date": day,
        "current": appointment_out(current, include_patient=True) if current else None,
        "next": appointment_out(waiting[0], include_patient=True) if waiting else None,
        "waiting": [appointment_out(a, include_patient=True) for a in waiting],
        "completed": [appointment_out(a, include_patient=True) for a in completed],
        "stats": queue_counts(appointments),
        "avg_consult_minutes": doctor.avg_consult_minutes,
        "last_updated": datetime.now(),
    }
