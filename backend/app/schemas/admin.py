from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, EmailStr


class AdminUserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    phone: str | None = None
    role: str
    is_active: bool
    date_of_birth: date | None = None
    gender: str | None = None
    created_at: datetime | None = None
    appointment_count: int = 0


class AdminPatientUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    is_active: bool | None = None


class AdminAppointmentCancel(BaseModel):
    reason: str | None = None


class ActivityOut(BaseModel):
    id: int
    actor_name: str | None = None
    action: str
    entity_type: str
    entity_id: int | None = None
    detail: str | None = None
    created_at: datetime | None = None
