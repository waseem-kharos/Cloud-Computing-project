from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.api.deps import DbSession, PatientUser, require_csrf
from app.models.appointment import Appointment, AppointmentStatus
from app.models.department import Department
from app.models.doctor import Doctor
from app.models.notification import Notification
from app.models.user import User
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentOut,
    AppointmentStatus,
    QueueStatusOut,
    RescheduleRequest,
)
from app.schemas.common import Message, Page
from app.schemas.dashboard import PatientDashboardOut, PatientStatsOut
from app.schemas.notification import NotificationOut
from app.services.booking import (
    book_appointment,
    cancel_appointment,
    reschedule_appointment,
)
from app.services.queue import queue_snapshot
from app.services.serializers import appointment_out, notification_out

router = APIRouter(
    prefix="/patient",
    tags=["Patient"],
    dependencies=[Depends(require_csrf)],
)

UPCOMING = (
    AppointmentStatus.booked,
    AppointmentStatus.checked_in,
    AppointmentStatus.in_progress,
)


def _appointment_options():
    return (
        selectinload(Appointment.doctor).selectinload(Doctor.user),
        selectinload(Appointment.doctor).selectinload(Doctor.department),
        selectinload(Appointment.department),
        selectinload(Appointment.patient),
    )


def _patient_query(patient_id: int):
    return (
        select(Appointment)
        .options(*_appointment_options())
        .where(Appointment.patient_id == patient_id)
    )


def _get_owned(db, patient_id: int, appointment_id: int) -> Appointment:
    appointment = db.scalar(
        _patient_query(patient_id).where(Appointment.id == appointment_id)
    )
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found.")
    return appointment


@router.get("/dashboard", response_model=PatientDashboardOut)
def dashboard(db: DbSession, user: PatientUser):
    appointments = list(
        db.scalars(
            _patient_query(user.id).order_by(
                Appointment.appointment_date.desc(), Appointment.slot_time.desc()
            )
        ).all()
    )
    today = date.today()
    upcoming = sorted(
        [
            a
            for a in appointments
            if a.status in UPCOMING
            and (a.appointment_date >= today)
        ],
        key=lambda a: (a.appointment_date, a.slot_time),
    )
    active_today = next(
        (
            a
            for a in appointments
            if a.appointment_date == today and a.status in UPCOMING
        ),
        None,
    )
    notifications = list(
        db.scalars(
            select(Notification)
            .where(Notification.user_id == user.id)
            .order_by(Notification.created_at.desc(), Notification.id.desc())
            .limit(5)
        ).all()
    )
    unread = db.scalar(
        select(func.count(Notification.id)).where(
            Notification.user_id == user.id, Notification.is_read.is_(False)
        )
    ) or 0
    stats = PatientStatsOut(
        upcoming=len(upcoming),
        completed=sum(1 for a in appointments if a.status == AppointmentStatus.completed),
        cancelled=sum(1 for a in appointments if a.status == AppointmentStatus.cancelled),
        total=len(appointments),
    )
    return PatientDashboardOut(
        stats=stats,
        next_appointment=appointment_out(upcoming[0]) if upcoming else None,
        active_queue=queue_snapshot(db, active_today) if active_today else None,
        recent_appointments=[appointment_out(a) for a in appointments[:4]],
        notifications=[NotificationOut(**notification_out(n)) for n in notifications],
        unread_notifications=unread,
    )


@router.get("/appointments", response_model=Page[AppointmentOut])
def list_appointments(
    db: DbSession,
    user: PatientUser,
    scope: str = Query(default="all", pattern="^(all|upcoming|past)$"),
    status_filter: str | None = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=8, ge=1, le=50),
):
    today = date.today()
    stmt = _patient_query(user.id)
    if scope == "upcoming":
        stmt = stmt.where(
            Appointment.status.in_(UPCOMING),
            Appointment.appointment_date >= today,
        ).order_by(Appointment.appointment_date.asc(), Appointment.slot_time.asc())
    elif scope == "past":
        stmt = stmt.where(
            (Appointment.status.in_((AppointmentStatus.completed, AppointmentStatus.cancelled, AppointmentStatus.no_show)))
            | (Appointment.appointment_date < today)
        ).order_by(Appointment.appointment_date.desc(), Appointment.slot_time.desc())
    else:
        stmt = stmt.order_by(
            Appointment.appointment_date.desc(), Appointment.slot_time.desc()
        )

    if status_filter:
        try:
            status_value = AppointmentStatus(status_filter)
        except ValueError:
            raise HTTPException(status_code=422, detail="Unknown appointment status.")
        stmt = stmt.where(Appointment.status == status_value)

    total = db.scalar(select(func.count()).select_from(stmt.order_by(None).subquery())) or 0
    rows = list(
        db.scalars(stmt.offset((page - 1) * page_size).limit(page_size)).all()
    )
    pages = max(1, (total + page_size - 1) // page_size)
    return Page[AppointmentOut](
        items=[AppointmentOut(**appointment_out(a)) for a in rows],
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


@router.post("/appointments", response_model=AppointmentOut, status_code=201)
def create_appointment(payload: AppointmentCreate, db: DbSession, user: PatientUser):
    appointment = book_appointment(db, user, payload)
    appointment = db.scalar(
        _patient_query(user.id).where(Appointment.id == appointment.id)
    )
    return AppointmentOut(**appointment_out(appointment))


@router.get("/appointments/{appointment_id}", response_model=AppointmentOut)
def get_appointment(appointment_id: int, db: DbSession, user: PatientUser):
    appointment = _get_owned(db, user.id, appointment_id)
    return AppointmentOut(**appointment_out(appointment))


@router.patch("/appointments/{appointment_id}/reschedule", response_model=AppointmentOut)
def reschedule(
    appointment_id: int,
    payload: RescheduleRequest,
    db: DbSession,
    user: PatientUser,
):
    appointment = _get_owned(db, user.id, appointment_id)
    appointment = reschedule_appointment(db, appointment, user, payload)
    appointment = _get_owned(db, user.id, appointment.id)
    return AppointmentOut(**appointment_out(appointment))


@router.post("/appointments/{appointment_id}/cancel", response_model=Message)
def cancel(appointment_id: int, db: DbSession, user: PatientUser):
    appointment = _get_owned(db, user.id, appointment_id)
    cancel_appointment(db, appointment, user)
    return Message(message="Appointment cancelled.")


@router.get("/appointments/{appointment_id}/queue", response_model=QueueStatusOut)
def appointment_queue(appointment_id: int, db: DbSession, user: PatientUser):
    appointment = _get_owned(db, user.id, appointment_id)
    return queue_snapshot(db, appointment)


@router.get("/queue")
def my_queue(db: DbSession, user: PatientUser):
    today = date.today()
    appointments = list(
        db.scalars(
            _patient_query(user.id)
            .where(
                Appointment.status.in_(UPCOMING),
                Appointment.appointment_date >= today,
            )
            .order_by(Appointment.appointment_date.asc(), Appointment.slot_time.asc())
        ).all()
    )
    if not appointments:
        return {"appointment": None, "queue": None, "is_today": False}
    appointment = next(
        (a for a in appointments if a.appointment_date == today), appointments[0]
    )
    is_today = appointment.appointment_date == today
    return {
        "appointment": appointment_out(appointment),
        "queue": queue_snapshot(db, appointment) if is_today else None,
        "is_today": is_today,
    }
