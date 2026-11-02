"""Create realistic synthetic demo data for MediQueue.

Run from the backend folder:
    python -m app.seed
    python -m app.seed --reset   # destructive: wipes the configured database
"""

from __future__ import annotations

import argparse
from datetime import date, datetime, time, timedelta
from decimal import Decimal

from sqlalchemy import select

from app.core.security import generate_reference, hash_password
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models.activity import ActivityLog
from app.models.appointment import Appointment, AppointmentStatus
from app.models.contact import ContactMessage
from app.models.department import Department
from app.models.doctor import Availability, Doctor
from app.models.notification import Notification
from app.models.user import User, UserRole
from app.services.queue import slot_times

PATIENT_PASSWORD = "Patient@12345"
DOCTOR_PASSWORD = "Doctor@12345"
ADMIN_PASSWORD = "Admin@12345"

DEPARTMENTS = [
    {
        "name": "Cardiology",
        "description": "Heart health, blood pressure, rhythm disorders and preventive cardiac care.",
        "icon": "HeartPulse",
        "accent": "rose",
        "doctors": [
            (
                "Dr. Ayesha Khan",
                "ayesha.khan@mediqueue.demo",
                "Consultant Cardiologist",
                "MBBS, FCPS (Cardiology)",
                14,
                "Ayesha focuses on preventive cardiology, hypertension and heart-failure follow-up. She explains every care plan in plain language.",
                15,
                "C-201",
                "rose",
                "blue",
            ),
            (
                "Dr. Omar Farooq",
                "omar.farooq@mediqueue.demo",
                "Interventional Cardiologist",
                "MBBS, MD, Fellowship in Interventional Cardiology",
                9,
                "Omar works with patients recovering from cardiac procedures and supports long-term heart-health planning.",
                20,
                "C-204",
                "blue",
                "rose",
            ),
        ],
    },
    {
        "name": "Neurology",
        "description": "Assessment and care for headaches, migraine, seizures, memory concerns and nerve conditions.",
        "icon": "Brain",
        "accent": "violet",
        "doctors": [
            (
                "Dr. Hina Malik",
                "hina.malik@mediqueue.demo",
                "Consultant Neurologist",
                "MBBS, FCPS (Neurology)",
                12,
                "Hina has a special interest in migraine management, epilepsy and post-stroke rehabilitation.",
                20,
                "N-102",
                "violet",
                "violet",
            )
        ],
    },
    {
        "name": "Pediatrics",
        "description": "Friendly, family-centred care for newborns, children and adolescents.",
        "icon": "Baby",
        "accent": "amber",
        "doctors": [
            (
                "Dr. Zain Abbas",
                "zain.abbas@mediqueue.demo",
                "Consultant Pediatrician",
                "MBBS, FCPS (Pediatrics)",
                8,
                "Zain supports childhood growth, vaccinations and common infections with a calm, family-first approach.",
                15,
                "P-110",
                "amber",
                "amber",
            ),
            (
                "Dr. Sana Raza",
                "sana.raza@mediqueue.demo",
                "Pediatric Specialist",
                "MBBS, MRCPCH",
                6,
                "Sana helps families manage asthma, allergies and nutrition concerns in children of all ages.",
                15,
                "P-112",
                "green",
                "amber",
            ),
        ],
    },
    {
        "name": "Dermatology",
        "description": "Skin, hair and nail consultations with evidence-based treatment plans.",
        "icon": "Sparkles",
        "accent": "teal",
        "doctors": [
            (
                "Dr. Bilal Sheikh",
                "bilal.sheikh@mediqueue.demo",
                "Consultant Dermatologist",
                "MBBS, MD (Dermatology)",
                10,
                "Bilal treats acne, eczema and pigmentation with practical routines that fit everyday life.",
                15,
                "D-108",
                "teal",
                "teal",
            ),
            (
                "Dr. Mahnoor Iqbal",
                "mahnoor.iqbal@mediqueue.demo",
                "Dermatology Specialist",
                "MBBS, FCPS (Dermatology)",
                5,
                "Mahnoor focuses on hair and scalp health, sensitive skin and adolescent dermatology.",
                15,
                "D-109",
                "green",
                "teal",
            ),
        ],
    },
    {
        "name": "Orthopedics",
        "description": "Bone, joint and muscle care, injury recovery and mobility support.",
        "icon": "Bone",
        "accent": "blue",
        "doctors": [
            (
                "Dr. Usman Tariq",
                "usman.tariq@mediqueue.demo",
                "Consultant Orthopedic Surgeon",
                "MBBS, FCPS (Orthopedics)",
                15,
                "Usman treats sports injuries, knee and shoulder pain, and supports recovery after surgery.",
                20,
                "O-301",
                "blue",
                "blue",
            ),
            (
                "Dr. Fatima Noor",
                "fatima.noor@mediqueue.demo",
                "Orthopedic Specialist",
                "MBBS, MD (Orthopedics)",
                7,
                "Fatima has a special interest in posture, back pain and non-surgical joint care.",
                20,
                "O-303",
                "teal",
                "blue",
            ),
        ],
    },
    {
        "name": "General Medicine",
        "description": "Everyday health concerns, preventive checks and referrals for adults.",
        "icon": "Stethoscope",
        "accent": "green",
        "doctors": [
            (
                "Dr. Hamza Siddiqui",
                "hamza.siddiqui@mediqueue.demo",
                "Consultant Physician",
                "MBBS, FCPS (Internal Medicine)",
                11,
                "Hamza provides whole-person primary care, from routine check-ups to long-term condition reviews.",
                15,
                "G-101",
                "green",
                "green",
            )
        ],
    },
]

PATIENTS = [
    ("Waseem Ahmed", "patient@mediqueue.demo", "+92 300 5550101", "1998-04-12", "male"),
    ("Sarah Malik", "sarah.malik@example.demo", "+92 300 5550102", "1991-09-23", "female"),
    ("Daniel Brooks", "daniel.brooks@example.demo", "+92 300 5550103", "1985-01-08", "male"),
    ("Maya Patel", "maya.patel@example.demo", "+92 300 5550104", "2001-06-30", "female"),
    ("Ali Hassan", "ali.hassan@example.demo", "+92 300 5550105", "1979-11-17", "male"),
    ("Noor Fatima", "noor.fatima@example.demo", "+92 300 5550106", "1995-03-04", "female"),
]


def _availability(doctor: Doctor, weekdays: range, start: time, end: time, slot: int) -> None:
    for weekday in weekdays:
        doctor.availability.append(
            Availability(
                weekday=weekday,
                start_time=start,
                end_time=end,
                slot_minutes=slot,
                is_active=True,
            )
        )


def _queue_number(doctor: Doctor, day: date, slot: time) -> int:
    times = slot_times(doctor, day)
    if slot not in times:
        raise ValueError(f"{slot} is not part of the schedule for {doctor.user.full_name}")
    return times.index(slot) + 1


def _appointment(
    patient: User,
    doctor: Doctor,
    day: date,
    slot: time,
    status: AppointmentStatus,
    reason: str,
    notes: str | None = None,
) -> Appointment:
    return Appointment(
        reference_code=generate_reference(),
        patient_id=patient.id,
        doctor_id=doctor.id,
        department_id=doctor.department_id,
        appointment_date=day,
        slot_time=slot,
        duration_minutes=doctor.avg_consult_minutes,
        queue_number=_queue_number(doctor, day, slot),
        status=status,
        reason=reason,
        doctor_notes=notes,
        cancelled_at=datetime.now() if status == AppointmentStatus.cancelled else None,
    )


def seed(reset: bool = False) -> None:
    if reset:
        Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    with SessionLocal() as db:
        if not reset and db.scalar(select(User.id).limit(1)):
            print("Database already contains data. Use --reset to rebuild demo data.")
            return

        admin = User(
            email="admin@mediqueue.demo",
            full_name="Hospital Administrator",
            phone="+92 300 5550100",
            hashed_password=hash_password(ADMIN_PASSWORD),
            role=UserRole.admin,
        )
        db.add(admin)

        patients: list[User] = []
        for name, email, phone, dob, gender in PATIENTS:
            patient = User(
                email=email,
                full_name=name,
                phone=phone,
                hashed_password=hash_password(PATIENT_PASSWORD),
                role=UserRole.patient,
                date_of_birth=date.fromisoformat(dob),
                gender=gender,
                address="Demo address, Lahore",
            )
            db.add(patient)
            patients.append(patient)

        doctors: list[Doctor] = []
        for dept_index, dept_data in enumerate(DEPARTMENTS):
            department = Department(
                name=dept_data["name"],
                slug=dept_data["name"].lower(),
                description=dept_data["description"],
                icon=dept_data["icon"],
                accent=dept_data["accent"],
            )
            db.add(department)
            db.flush()
            for index, doc in enumerate(dept_data["doctors"]):
                (
                    full_name,
                    email,
                    specialization,
                    qualifications,
                    experience,
                    bio,
                    minutes,
                    room,
                    avatar_color,
                    _accent,
                ) = doc
                user = User(
                    email=email,
                    full_name=full_name,
                    phone=f"+92 300 55502{dept_index}{index:02d}",
                    hashed_password=hash_password(DOCTOR_PASSWORD),
                    role=UserRole.doctor,
                )
                doctor = Doctor(
                    user=user,
                    department=department,
                    specialization=specialization,
                    qualifications=qualifications,
                    experience_years=experience,
                    bio=bio,
                    consultation_fee=Decimal("2500.00") + Decimal(experience * 100),
                    room=room,
                    avg_consult_minutes=minutes,
                    avatar_color=avatar_color,
                )
                _availability(doctor, range(0, 7), time(9, 0), time(13, 0), 15)
                _availability(doctor, range(0, 7), time(14, 0), time(17, 0), 15)
                db.add(doctor)
                doctors.append(doctor)

        db.flush()

        today = date.today()
        tomorrow = today + timedelta(days=1)
        yesterday = today - timedelta(days=1)

        # A lively queue for the featured doctor so the demo has real queue state.
        demo_doctor = doctors[0]
        queue_specs = [
            (patients[1], time(9, 0), AppointmentStatus.completed, "Routine cardiac review", "Blood pressure stable. Review in 6 months."),
            (patients[2], time(9, 15), AppointmentStatus.completed, "Chest discomfort follow-up", "ECG normal. Continue current medication."),
            (patients[3], time(9, 30), AppointmentStatus.in_progress, "Palpitations assessment", "Consultation in progress."),
            (patients[4], time(9, 45), AppointmentStatus.checked_in, "Annual heart check", None),
            (patients[0], time(10, 0), AppointmentStatus.booked, "Blood pressure follow-up", None),
            (patients[5], time(10, 15), AppointmentStatus.booked, "Preventive cardiac screening", None),
        ]
        for patient, slot, status, reason, notes in queue_specs:
            db.add(_appointment(patient, demo_doctor, today, slot, status, reason, notes))

        # Other departments have appointments too, so admin charts are meaningful.
        other_specs = [
            (patients[2], doctors[2], today, time(10, 30), AppointmentStatus.checked_in, "Recurring migraine review"),
            (patients[4], doctors[4], today, time(11, 0), AppointmentStatus.booked, "Child vaccination consultation"),
            (patients[5], doctors[5], today, time(14, 30), AppointmentStatus.booked, "Eczema review"),
            (patients[1], doctors[7], today, time(15, 0), AppointmentStatus.booked, "Knee pain assessment"),
            (patients[3], doctors[9], today, time(16, 0), AppointmentStatus.booked, "General health check"),
            (patients[0], doctors[1], tomorrow, time(9, 30), AppointmentStatus.booked, "Cardiac risk review"),
            (patients[2], doctors[3], tomorrow, time(10, 0), AppointmentStatus.booked, "Growth and nutrition review"),
            (patients[1], doctors[6], tomorrow, time(14, 15), AppointmentStatus.booked, "Hair loss consultation"),
            (patients[3], doctors[8], tomorrow, time(15, 30), AppointmentStatus.booked, "Lower back pain"),
            (patients[4], doctors[0], tomorrow, time(16, 15), AppointmentStatus.booked, "Heart health check"),
            (patients[0], doctors[9], yesterday, time(9, 0), AppointmentStatus.completed, "Fever and fatigue"),
            (patients[1], doctors[4], yesterday, time(10, 0), AppointmentStatus.completed, "Seasonal allergy"),
            (patients[2], doctors[7], yesterday, time(11, 0), AppointmentStatus.no_show, "Shoulder pain"),
            (patients[3], doctors[2], yesterday, time(14, 0), AppointmentStatus.cancelled, "Migraine follow-up"),
        ]
        for patient, doctor, day, slot, status, reason in other_specs:
            db.add(_appointment(patient, doctor, day, slot, status, reason))

        db.flush()

        notifications = [
            (patients[0].id, "Appointment confirmed", "Your appointment with Dr. Ayesha Khan is confirmed. Your queue number is 5.", "success", "/patient/appointments"),
            (patients[0].id, "Health tip", "Bring a list of your current medicines to your next consultation.", "info", None),
            (patients[0].id, "Welcome to MediQueue", "This is a demonstration account. Appointments and queue data are synthetic.", "info", None),
            (doctors[0].user_id, "Today's queue is ready", "6 patients are booked for today. Your first patient has been checked in.", "info", "/doctor/queue"),
            (admin.id, "Demo data loaded", "Sample departments, doctors, patients and appointments were created for this prototype.", "info", "/admin"),
        ]
        for user_id, title, message, category, link in notifications:
            db.add(
                Notification(
                    user_id=user_id,
                    title=title,
                    message=message,
                    category=category,
                    link=link,
                    is_read=False,
                )
            )

        db.add_all(
            [
                ContactMessage(
                    name="Demo Visitor",
                    email="visitor@example.demo",
                    subject="Appointment question",
                    message="Can I reschedule an appointment after booking? This is a sample message for the admin inbox.",
                ),
                ContactMessage(
                    name="Sample Patient",
                    email="sample.patient@example.demo",
                    subject="Accessibility feedback",
                    message="The queue tracker is easy to read. Please keep the large queue numbers in the next version.",
                    is_handled=True,
                ),
            ]
        )

        for actor_id, action, entity_type, detail in [
            (admin.id, "demo.seeded", "system", "Synthetic demo dataset created"),
            (patients[0].id, "appointment.booked", "appointment", "Booked with Dr. Ayesha Khan"),
            (doctors[0].user_id, "queue.called_next", "appointment", "Called queue #3"),
            (patients[3].id, "auth.login", "user", "patient signed in"),
        ]:
            db.add(
                ActivityLog(
                    actor_id=actor_id,
                    action=action,
                    entity_type=entity_type,
                    detail=detail,
                )
            )

        db.commit()

    print("MediQueue demo data created.")
    print("  Admin : admin@mediqueue.demo / Admin@12345")
    print("  Doctor: ayesha.khan@mediqueue.demo / Doctor@12345")
    print("  Patient: patient@mediqueue.demo / Patient@12345")
    print("All names, appointments and queue data are synthetic demo data.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed MediQueue demo data")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Drop all tables and recreate the full demo dataset.",
    )
    args = parser.parse_args()
    seed(reset=args.reset)


if __name__ == "__main__":
    main()
