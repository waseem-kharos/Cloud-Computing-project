from __future__ import annotations

from datetime import date, timedelta

from fastapi import APIRouter, HTTPException, Query, Request, status
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.api.deps import DbSession
from app.core.config import settings
from app.core.rate_limit import client_key, limiter
from app.models.appointment import Appointment, AppointmentStatus
from app.models.contact import ContactMessage
from app.models.department import Department
from app.models.doctor import Doctor
from app.models.user import User
from app.schemas.appointment import PublicQueueOut
from app.schemas.common import Message, Page
from app.schemas.contact import ContactCreate
from app.schemas.department import DepartmentOut
from app.schemas.doctor import PublicDoctorOut, SlotOut
from app.services.queue import public_queue_snapshot, slots_for_date
from app.services.serializers import department_out, doctor_public

router = APIRouter(prefix="/public", tags=["Public"])


def _doctor_query():
    return (
        select(Doctor)
        .join(Doctor.user)
        .join(Doctor.department)
        .options(
            selectinload(Doctor.user),
            selectinload(Doctor.department),
            selectinload(Doctor.availability),
            selectinload(Doctor.time_off),
        )
        .where(
            Doctor.is_active.is_(True),
            User.is_active.is_(True),
            Department.is_active.is_(True),
        )
    )


@router.get("/overview")
def overview(db: DbSession):
    departments = db.scalar(
        select(func.count(Department.id)).where(Department.is_active.is_(True))
    ) or 0
    doctors = db.scalar(
        select(func.count(Doctor.id))
        .join(Doctor.user)
        .where(Doctor.is_active.is_(True), User.is_active.is_(True))
    ) or 0
    completed = db.scalar(
        select(func.count(Appointment.id)).where(
            Appointment.status == AppointmentStatus.completed
        )
    ) or 0
    return {
        "departments": departments,
        "doctors": doctors,
        "appointments_completed": completed,
    }


@router.get("/departments", response_model=list[DepartmentOut])
def list_departments(db: DbSession):
    departments = list(
        db.scalars(
            select(Department)
            .where(Department.is_active.is_(True))
            .order_by(Department.name.asc())
        ).all()
    )
    counts = dict(
        db.execute(
            select(Doctor.department_id, func.count(Doctor.id))
            .join(Doctor.user)
            .where(Doctor.is_active.is_(True), User.is_active.is_(True))
            .group_by(Doctor.department_id)
        ).all()
    )
    return [DepartmentOut(**department_out(d, counts.get(d.id, 0))) for d in departments]


@router.get("/departments/{slug}", response_model=DepartmentOut)
def get_department(slug: str, db: DbSession):
    dept = db.scalar(
        select(Department).where(Department.slug == slug, Department.is_active.is_(True))
    )
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found.")
    count = db.scalar(
        select(func.count(Doctor.id))
        .join(Doctor.user)
        .where(
            Doctor.department_id == dept.id,
            Doctor.is_active.is_(True),
            User.is_active.is_(True),
        )
    ) or 0
    return DepartmentOut(**department_out(dept, count))


@router.get("/doctors", response_model=Page[PublicDoctorOut])
def list_doctors(
    db: DbSession,
    q: str | None = Query(default=None, max_length=100),
    department_id: int | None = None,
    sort: str = Query(default="name", pattern="^(name|experience|fee)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=9, ge=1, le=50),
):
    stmt = _doctor_query()
    if q:
        term = f"%{q.strip()}%"
        stmt = stmt.where(
            User.full_name.ilike(term)
            | Doctor.specialization.ilike(term)
            | Department.name.ilike(term)
        )
    if department_id:
        stmt = stmt.where(Doctor.department_id == department_id)

    total = db.scalar(select(func.count()).select_from(stmt.order_by(None).subquery())) or 0
    if sort == "experience":
        stmt = stmt.order_by(Doctor.experience_years.desc(), User.full_name.asc())
    elif sort == "fee":
        stmt = stmt.order_by(Doctor.consultation_fee.asc(), User.full_name.asc())
    else:
        stmt = stmt.order_by(User.full_name.asc())

    doctors = list(db.scalars(stmt.offset((page - 1) * page_size).limit(page_size)).all())
    items = [PublicDoctorOut(**doctor_public(d, include_availability=False)) for d in doctors]
    pages = max(1, (total + page_size - 1) // page_size)
    return Page[PublicDoctorOut](
        items=items, total=total, page=page, page_size=page_size, pages=pages
    )


@router.get("/doctors/{doctor_id}", response_model=PublicDoctorOut)
def get_doctor(doctor_id: int, db: DbSession):
    doctor = db.scalar(_doctor_query().where(Doctor.id == doctor_id))
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found.")
    return PublicDoctorOut(**doctor_public(doctor, include_availability=True))


@router.get("/doctors/{doctor_id}/slots", response_model=list[SlotOut])
def get_slots(
    doctor_id: int,
    db: DbSession,
    day: date = Query(alias="date"),
):
    doctor = db.scalar(_doctor_query().where(Doctor.id == doctor_id))
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found.")
    today = date.today()
    if day < today or day > today + timedelta(days=settings.booking_horizon_days):
        raise HTTPException(status_code=422, detail="Choose a date within the booking window.")
    return [SlotOut(**slot) for slot in slots_for_date(db, doctor, day)]


@router.get("/queue/{reference}", response_model=PublicQueueOut)
def public_queue(reference: str, request: Request, db: DbSession):
    limiter.check(client_key(request, "public_queue"), limit=30, window_seconds=60)
    reference = reference.strip().upper()
    appointment = db.scalar(
        select(Appointment)
        .options(
            selectinload(Appointment.doctor).selectinload(Doctor.user),
            selectinload(Appointment.doctor).selectinload(Doctor.department),
        )
        .where(Appointment.reference_code == reference)
    )
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="We could not find an appointment with that reference.",
        )
    return public_queue_snapshot(db, appointment)


@router.post("/contact", response_model=Message, status_code=201)
def contact(payload: ContactCreate, request: Request, db: DbSession):
    limiter.check(client_key(request, "contact"), limit=5, window_seconds=600)
    db.add(
        ContactMessage(
            name=payload.name.strip(),
            email=payload.email.lower(),
            subject=payload.subject.strip(),
            message=payload.message.strip(),
        )
    )
    db.commit()
    return Message(message="Thank you. Your message has been received by our demo team.")
