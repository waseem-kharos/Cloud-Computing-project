"""Explicit response serializers keep role-based data exposure obvious."""

from __future__ import annotations

from datetime import time
from decimal import Decimal

from app.models.appointment import Appointment, AppointmentStatus
from app.models.department import Department
from app.models.doctor import Availability, Doctor
from app.models.notification import Notification
from app.models.user import User


def fmt_time(value: time | None) -> str:
    return value.strftime("%H:%M") if value else ""


def money(value: Decimal | float | int | None) -> float:
    return float(value or 0)


def department_out(dept: Department, doctor_count: int = 0) -> dict:
    return {
        "id": dept.id,
        "name": dept.name,
        "slug": dept.slug,
        "description": dept.description,
        "icon": dept.icon,
        "accent": dept.accent,
        "is_active": dept.is_active,
        "doctor_count": doctor_count,
    }


def department_brief(dept: Department) -> dict:
    return {
        "id": dept.id,
        "name": dept.name,
        "slug": dept.slug,
        "icon": dept.icon,
        "accent": dept.accent,
    }


def availability_out(block: Availability) -> dict:
    return {
        "id": block.id,
        "weekday": block.weekday,
        "start_time": fmt_time(block.start_time),
        "end_time": fmt_time(block.end_time),
        "slot_minutes": block.slot_minutes,
        "is_active": block.is_active,
    }


def doctor_brief(doctor: Doctor) -> dict:
    return {
        "id": doctor.id,
        "full_name": doctor.user.full_name,
        "specialization": doctor.specialization,
        "department_id": doctor.department_id,
        "department_name": doctor.department.name,
        "avatar_color": doctor.avatar_color,
        "room": doctor.room,
        "avg_consult_minutes": doctor.avg_consult_minutes,
    }


def doctor_public(doctor: Doctor, include_availability: bool = True) -> dict:
    data = doctor_brief(doctor)
    data.update(
        {
            "qualifications": doctor.qualifications,
            "experience_years": doctor.experience_years,
            "bio": doctor.bio,
            "consultation_fee": money(doctor.consultation_fee),
            "availability": (
                [availability_out(b) for b in doctor.availability if b.is_active]
                if include_availability
                else []
            ),
            "department": department_brief(doctor.department),
        }
    )
    return data


def doctor_admin(doctor: Doctor, appointment_count: int = 0) -> dict:
    data = doctor_public(doctor)
    data.update(
        {
            "user_id": doctor.user_id,
            "email": doctor.user.email,
            "phone": doctor.user.phone,
            "is_active": doctor.is_active and doctor.user.is_active,
            "appointment_count": appointment_count,
        }
    )
    return data


def patient_brief(
    patient: User, include_contact: bool = False, include_email: bool = False
) -> dict:
    return {
        "id": patient.id,
        "full_name": patient.full_name,
        "phone": patient.phone if include_contact else None,
        "email": patient.email if include_email else None,
        "date_of_birth": patient.date_of_birth,
        "gender": patient.gender,
    }


def user_out(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "phone": user.phone,
        "role": user.role,
        "is_active": user.is_active,
        "date_of_birth": user.date_of_birth,
        "gender": user.gender,
        "address": user.address,
        "created_at": user.created_at,
    }


def appointment_out(
    appointment: Appointment,
    *,
    include_patient: bool = False,
    patient_contact: bool = True,
    include_patient_email: bool = False,
) -> dict:
    data = {
        "id": appointment.id,
        "reference_code": appointment.reference_code,
        "appointment_date": appointment.appointment_date,
        "slot_time": fmt_time(appointment.slot_time),
        "duration_minutes": appointment.duration_minutes,
        "queue_number": appointment.queue_number,
        "status": appointment.status,
        "reason": appointment.reason,
        "doctor_notes": appointment.doctor_notes,
        "created_at": appointment.created_at,
        "doctor": doctor_brief(appointment.doctor),
        "department": department_brief(appointment.department),
        "patient": None,
    }
    if include_patient:
        data["patient"] = patient_brief(
            appointment.patient,
            include_contact=patient_contact,
            include_email=include_patient_email,
        )
    return data


def notification_out(notification: Notification) -> dict:
    return {
        "id": notification.id,
        "title": notification.title,
        "message": notification.message,
        "category": notification.category,
        "link": notification.link,
        "is_read": notification.is_read,
        "created_at": notification.created_at,
    }


STATUS_LABELS = {
    AppointmentStatus.booked: "Booked",
    AppointmentStatus.checked_in: "Checked in",
    AppointmentStatus.in_progress: "In consultation",
    AppointmentStatus.completed: "Completed",
    AppointmentStatus.cancelled: "Cancelled",
    AppointmentStatus.no_show: "No show",
}


def status_label(status: AppointmentStatus) -> str:
    return STATUS_LABELS.get(status, str(status))
