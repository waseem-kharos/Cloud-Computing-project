from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class ContactCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    subject: str = Field(min_length=3, max_length=160)
    message: str = Field(min_length=10, max_length=3000)


class ContactOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    subject: str
    message: str
    is_handled: bool
    created_at: datetime | None = None
