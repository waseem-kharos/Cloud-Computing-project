from __future__ import annotations

import re

from pydantic import BaseModel, Field, field_validator


class DepartmentOut(BaseModel):
    id: int
    name: str
    slug: str
    description: str
    icon: str
    accent: str
    is_active: bool
    doctor_count: int = 0


class DepartmentBrief(BaseModel):
    id: int
    name: str
    slug: str
    icon: str
    accent: str


class DepartmentCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    description: str = Field(default="", max_length=1000)
    icon: str = Field(default="Stethoscope", max_length=60)
    accent: str = Field(default="blue", max_length=30)
    is_active: bool = True

    @field_validator("name")
    @classmethod
    def clean_name(cls, value: str) -> str:
        return " ".join(value.split())


class DepartmentUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    description: str | None = Field(default=None, max_length=1000)
    icon: str | None = Field(default=None, max_length=60)
    accent: str | None = Field(default=None, max_length=30)
    is_active: bool | None = None


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "department"
