from __future__ import annotations

import re
from datetime import date, time

from pydantic import BaseModel, Field, field_validator

from app.schemas.department import DepartmentBrief


def parse_hhmm(value: str) -> time:
    if not re.fullmatch(r"([01]\d|2[0-3]):[0-5]\d", value):
        raise ValueError("Use 24-hour time in HH:MM format.")
    hour, minute = map(int, value.split(":"))
    return time(hour, minute)


class AvailabilityOut(BaseModel):
    id: int
    weekday: int
    start_time: str
    end_time: str
    slot_minutes: int
    is_active: bool


class AvailabilityIn(BaseModel):
    weekday: int = Field(ge=0, le=6)
    start_time: str
    end_time: str
    slot_minutes: int = Field(default=15, ge=5, le=120)
    is_active: bool = True

    @field_validator("start_time", "end_time")
    @classmethod
    def valid_time(cls, value: str) -> str:
        parse_hhmm(value)
        return value

    def start_time_obj(self) -> time:
        return parse_hhmm(self.start_time)

    def end_time_obj(self) -> time:
        return parse_hhmm(self.end_time)


class DoctorBrief(BaseModel):
    id: int
    full_name: str
    specialization: str
    department_id: int
    department_name: str
    avatar_color: str
    room: str | None = None
    avg_consult_minutes: int = 15


class PublicDoctorOut(DoctorBrief):
    qualifications: str | None = None
    experience_years: int = 0
    bio: str | None = None
    consultation_fee: float = 0
    availability: list[AvailabilityOut] = []
    department: DepartmentBrief | None = None


class AdminDoctorOut(PublicDoctorOut):
    user_id: int
    email: str
    phone: str | None = None
    is_active: bool = True
    appointment_count: int = 0


class DoctorCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: str = Field(max_length=255)
    phone: str | None = Field(default=None, max_length=30)
    password: str = Field(min_length=8, max_length=72)
    department_id: int
    specialization: str = Field(min_length=2, max_length=120)
    qualifications: str | None = Field(default=None, max_length=255)
    experience_years: int = Field(default=0, ge=0, le=70)
    bio: str | None = Field(default=None, max_length=2000)
    consultation_fee: float = Field(default=0, ge=0, le=100000)
    room: str | None = Field(default=None, max_length=30)
    avg_consult_minutes: int = Field(default=15, ge=5, le=120)
    avatar_color: str = Field(default="teal", max_length=30)
    is_active: bool = True
    availability: list[AvailabilityIn] = []

    @field_validator("email")
    @classmethod
    def valid_email(cls, value: str) -> str:
        if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", value):
            raise ValueError("Enter a valid email address.")
        return value.lower()


class DoctorUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=120)
    email: str | None = None
    phone: str | None = Field(default=None, max_length=30)
    department_id: int | None = None
    specialization: str | None = Field(default=None, min_length=2, max_length=120)
    qualifications: str | None = Field(default=None, max_length=255)
    experience_years: int | None = Field(default=None, ge=0, le=70)
    bio: str | None = Field(default=None, max_length=2000)
    consultation_fee: float | None = Field(default=None, ge=0, le=100000)
    room: str | None = Field(default=None, max_length=30)
    avg_consult_minutes: int | None = Field(default=None, ge=5, le=120)
    avatar_color: str | None = Field(default=None, max_length=30)
    is_active: bool | None = None


class DoctorSelfUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=120)
    phone: str | None = Field(default=None, max_length=30)
    bio: str | None = Field(default=None, max_length=2000)
    qualifications: str | None = Field(default=None, max_length=255)
    room: str | None = Field(default=None, max_length=30)
    avg_consult_minutes: int | None = Field(default=None, ge=5, le=120)
    consultation_fee: float | None = Field(default=None, ge=0, le=100000)


class ScheduleUpdate(BaseModel):
    availability: list[AvailabilityIn]

    @field_validator("availability")
    @classmethod
    def validate_blocks(cls, blocks: list[AvailabilityIn]) -> list[AvailabilityIn]:
        seen: set[tuple[int, str]] = set()
        for block in blocks:
            if block.start_time_obj() >= block.end_time_obj():
                raise ValueError("Each availability block must end after it starts.")
            key = (block.weekday, block.start_time)
            if key in seen:
                raise ValueError("Duplicate availability block.")
            seen.add(key)
        return blocks


class TimeOffCreate(BaseModel):
    off_date: date
    reason: str | None = Field(default=None, max_length=255)


class TimeOffOut(BaseModel):
    id: int
    off_date: date
    reason: str | None = None


class SlotOut(BaseModel):
    time: str
    available: bool
    queue_number: int | None = None
    reason: str | None = None


class DoctorStatsOut(BaseModel):
    today_total: int
    waiting: int
    checked_in: int
    in_progress: int
    completed: int
    no_show: int
    upcoming_week: int
