from __future__ import annotations

import re
from datetime import date, datetime

from pydantic import BaseModel, Field, field_validator

from app.models.appointment import AppointmentStatus
from app.schemas.department import DepartmentBrief
from app.schemas.doctor import DoctorBrief


class PatientBrief(BaseModel):
    id: int
    full_name: str
    phone: str | None = None
    email: str | None = None
    date_of_birth: date | None = None
    gender: str | None = None


class AppointmentCreate(BaseModel):
    doctor_id: int
    appointment_date: date
    slot_time: str
    reason: str | None = Field(default=None, max_length=500)

    @field_validator("slot_time")
    @classmethod
    def valid_time(cls, value: str) -> str:
        if not re.fullmatch(r"([01]\d|2[0-3]):[0-5]\d", value):
            raise ValueError("Choose a valid appointment slot.")
        return value


class RescheduleRequest(BaseModel):
    appointment_date: date
    slot_time: str

    @field_validator("slot_time")
    @classmethod
    def valid_time(cls, value: str) -> str:
        if not re.fullmatch(r"([01]\d|2[0-3]):[0-5]\d", value):
            raise ValueError("Choose a valid appointment slot.")
        return value


class StatusUpdateRequest(BaseModel):
    status: AppointmentStatus
    doctor_notes: str | None = Field(default=None, max_length=2000)


class DoctorNotesRequest(BaseModel):
    doctor_notes: str | None = Field(default=None, max_length=2000)


class AppointmentOut(BaseModel):
    id: int
    reference_code: str
    appointment_date: date
    slot_time: str
    duration_minutes: int
    queue_number: int
    status: AppointmentStatus
    reason: str | None = None
    doctor_notes: str | None = None
    created_at: datetime | None = None
    doctor: DoctorBrief
    department: DepartmentBrief
    patient: PatientBrief | None = None


class QueueStatusOut(BaseModel):
    appointment_id: int
    reference_code: str
    appointment_date: date
    slot_time: str
    status: AppointmentStatus
    queue_number: int
    doctor_id: int
    doctor_name: str
    doctor_specialization: str = ""
    doctor_room: str | None = None
    department_name: str
    current_serving: int | None = None
    patients_ahead: int
    total_in_queue: int
    estimated_wait_minutes: int
    avg_consult_minutes: int
    progress_percent: int
    updated_at: datetime | None = None


class PublicQueueOut(BaseModel):
    reference_code: str
    appointment_date: date
    slot_time: str
    status: AppointmentStatus
    queue_number: int
    doctor_name: str
    doctor_specialization: str = ""
    doctor_room: str | None = None
    department_name: str
    current_serving: int | None = None
    patients_ahead: int
    total_in_queue: int
    estimated_wait_minutes: int
    avg_consult_minutes: int = 15
    progress_percent: int


class QueueCountsOut(BaseModel):
    today_total: int
    waiting: int
    checked_in: int
    in_progress: int
    completed: int
    no_show: int


class DoctorQueueOut(BaseModel):
    date: date
    current: AppointmentOut | None = None
    next: AppointmentOut | None = None
    waiting: list[AppointmentOut]
    completed: list[AppointmentOut]
    stats: QueueCountsOut
    avg_consult_minutes: int
    last_updated: datetime | None = None


class CallNextResult(BaseModel):
    message: str
    appointment: AppointmentOut | None = None
