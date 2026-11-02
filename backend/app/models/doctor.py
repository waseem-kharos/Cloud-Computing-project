from __future__ import annotations

from datetime import date, time
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    Date,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    Time,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Doctor(Base):
    __tablename__ = "doctors"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    department_id: Mapped[int] = mapped_column(
        ForeignKey("departments.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    specialization: Mapped[str] = mapped_column(String(120), nullable=False)
    qualifications: Mapped[str | None] = mapped_column(String(255))
    experience_years: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    bio: Mapped[str | None] = mapped_column(Text)
    consultation_fee: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    room: Mapped[str | None] = mapped_column(String(30))
    avg_consult_minutes: Mapped[int] = mapped_column(Integer, default=15, nullable=False)
    avatar_color: Mapped[str] = mapped_column(String(30), default="teal", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    user: Mapped["User"] = relationship(back_populates="doctor_profile")  # noqa: F821
    department: Mapped["Department"] = relationship(back_populates="doctors")  # noqa: F821
    availability: Mapped[list["Availability"]] = relationship(
        back_populates="doctor", cascade="all, delete-orphan", order_by="Availability.weekday"
    )
    time_off: Mapped[list["DoctorDateOff"]] = relationship(
        back_populates="doctor", cascade="all, delete-orphan"
    )
    appointments: Mapped[list["Appointment"]] = relationship(back_populates="doctor")  # noqa: F821


class Availability(Base):
    __tablename__ = "availability"
    __table_args__ = (
        UniqueConstraint("doctor_id", "weekday", "start_time", name="uq_availability_block"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    doctor_id: Mapped[int] = mapped_column(
        ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False, index=True
    )
    weekday: Mapped[int] = mapped_column(Integer, nullable=False)  # Monday = 0
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    slot_minutes: Mapped[int] = mapped_column(Integer, default=15, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    doctor: Mapped["Doctor"] = relationship(back_populates="availability")


class DoctorDateOff(Base):
    __tablename__ = "doctor_date_off"
    __table_args__ = (UniqueConstraint("doctor_id", "off_date", name="uq_doctor_date_off"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    doctor_id: Mapped[int] = mapped_column(
        ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False, index=True
    )
    off_date: Mapped[date] = mapped_column(Date, nullable=False)
    reason: Mapped[str | None] = mapped_column(String(255))

    doctor: Mapped["Doctor"] = relationship(back_populates="time_off")
