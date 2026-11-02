from __future__ import annotations

from datetime import date

from pydantic import BaseModel

from app.schemas.appointment import AppointmentOut, QueueStatusOut
from app.schemas.doctor import DoctorBrief
from app.schemas.notification import NotificationOut


class PatientStatsOut(BaseModel):
    upcoming: int
    completed: int
    cancelled: int
    total: int


class PatientDashboardOut(BaseModel):
    stats: PatientStatsOut
    next_appointment: AppointmentOut | None = None
    active_queue: QueueStatusOut | None = None
    recent_appointments: list[AppointmentOut]
    notifications: list[NotificationOut]
    unread_notifications: int


class DoctorDashboardOut(BaseModel):
    today: date
    stats: dict[str, int]
    current: AppointmentOut | None = None
    next: AppointmentOut | None = None
    waiting: list[AppointmentOut]
    completed: list[AppointmentOut]
    upcoming: list[AppointmentOut]
    weekly: list[dict[str, int | str]]
    doctor: DoctorBrief


class AdminStatsOut(BaseModel):
    total_patients: int
    total_doctors: int
    total_appointments: int
    today_appointments: int
    upcoming_appointments: int
    cancelled_appointments: int
    completed_appointments: int
    active_queues: int
    bookings_last_7_days: list[dict[str, int | str]]
    status_distribution: list[dict[str, int | str]]
    department_distribution: list[dict[str, int | str]]
    recent_activity: list[dict[str, object]]
    unread_messages: int
