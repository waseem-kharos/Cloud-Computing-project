from __future__ import annotations

from datetime import date

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.appointment import Appointment, AppointmentStatus
from app.models.doctor import Availability, Doctor, DoctorDateOff
from app.schemas.doctor import AvailabilityIn

ACTIVE_EXCEPT_CANCELLED = Appointment.status != AppointmentStatus.cancelled


def replace_schedule(db: Session, doctor: Doctor, blocks: list[AvailabilityIn]) -> Doctor:
    doctor.availability.clear()
    for block in blocks:
        doctor.availability.append(
            Availability(
                weekday=block.weekday,
                start_time=block.start_time_obj(),
                end_time=block.end_time_obj(),
                slot_minutes=block.slot_minutes,
                is_active=block.is_active,
            )
        )
    db.commit()
    db.refresh(doctor)
    return doctor


def add_time_off(db: Session, doctor: Doctor, off_date: date, reason: str | None) -> DoctorDateOff:
    if off_date < date.today():
        raise HTTPException(status_code=422, detail="Choose today or a future date.")
    existing = db.scalar(
        select(DoctorDateOff).where(
            DoctorDateOff.doctor_id == doctor.id, DoctorDateOff.off_date == off_date
        )
    )
    if existing:
        raise HTTPException(status_code=409, detail="That date is already marked as unavailable.")
    booked = db.scalar(
        select(Appointment.id).where(
            Appointment.doctor_id == doctor.id,
            Appointment.appointment_date == off_date,
            ACTIVE_EXCEPT_CANCELLED,
        )
    )
    if booked:
        raise HTTPException(
            status_code=409,
            detail="There are appointments booked on that date. Reschedule or cancel them first.",
        )
    entry = DoctorDateOff(doctor_id=doctor.id, off_date=off_date, reason=reason)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def remove_time_off(db: Session, doctor: Doctor, entry_id: int) -> None:
    entry = db.get(DoctorDateOff, entry_id)
    if not entry or entry.doctor_id != doctor.id:
        raise HTTPException(status_code=404, detail="Time-off entry not found.")
    db.delete(entry)
    db.commit()
