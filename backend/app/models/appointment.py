from __future__ import annotations

import enum
from datetime import date, datetime, time

from sqlalchemy import (
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    Time,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class AppointmentStatus(str, enum.Enum):
    booked = "booked"
    checked_in = "checked_in"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"
    no_show = "no_show"


ACTIVE_STATUSES = (
    AppointmentStatus.booked,
    AppointmentStatus.checked_in,
    AppointmentStatus.in_progress,
    AppointmentStatus.completed,
)

_ACTIVE_SQL = "status IN ('booked','checked_in','in_progress','completed')"


class Appointment(Base):
    __tablename__ = "appointments"
    __table_args__ = (
        Index(
            "uq_active_appointment_slot",
            "doctor_id",
            "appointment_date",
            "slot_time",
            unique=True,
            sqlite_where=text(_ACTIVE_SQL),
            postgresql_where=text(_ACTIVE_SQL),
        ),
        Index(
            "uq_active_appointment_queue",
            "doctor_id",
            "appointment_date",
            "queue_number",
            unique=True,
            sqlite_where=text(_ACTIVE_SQL),
            postgresql_where=text(_ACTIVE_SQL),
        ),
        Index("ix_appointments_date_status", "appointment_date", "status"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    reference_code: Mapped[str] = mapped_column(
        String(20), unique=True, index=True, nullable=False
    )
    patient_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    doctor_id: Mapped[int] = mapped_column(
        ForeignKey("doctors.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    department_id: Mapped[int] = mapped_column(
        ForeignKey("departments.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    appointment_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    slot_time: Mapped[time] = mapped_column(Time, nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=15, nullable=False)
    queue_number: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[AppointmentStatus] = mapped_column(
        Enum(AppointmentStatus, native_enum=False, length=20),
        default=AppointmentStatus.booked,
        nullable=False,
        index=True,
    )
    reason: Mapped[str | None] = mapped_column(Text)
    doctor_notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    patient: Mapped["User"] = relationship(  # noqa: F821
        back_populates="appointments", foreign_keys=[patient_id]
    )
    doctor: Mapped["Doctor"] = relationship(back_populates="appointments")  # noqa: F821
    department: Mapped["Department"] = relationship(back_populates="appointments")  # noqa: F821

    @property
    def is_active(self) -> bool:
        return self.status in ACTIVE_STATUSES
