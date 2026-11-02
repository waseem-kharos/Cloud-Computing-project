from __future__ import annotations

from datetime import date, time
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.api.deps import get_db
from app.core.security import hash_password
from app.db.base import Base
from app.main import app
from app.models.appointment import Appointment, AppointmentStatus
from app.models.department import Department
from app.models.doctor import Availability, Doctor
from app.models.user import User, UserRole

PASSWORDS = {
    "patient1": "Patient@12345",
    "patient2": "Patient@12345",
    "patient3": "Patient@12345",
    "doctor1": "Doctor@12345",
    "doctor2": "Doctor@12345",
    "admin": "Admin@12345",
}

HASHED = hash_password("Patient@12345")
DOCTOR_HASHED = hash_password("Doctor@12345")
ADMIN_HASHED = hash_password("Admin@12345")


@pytest.fixture()
def test_db(tmp_path):
    engine = create_engine(
        f"sqlite:///{tmp_path / 'test.db'}",
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)

    with TestingSession() as db:
        admin = User(
            email="admin@test.demo",
            full_name="Test Admin",
            hashed_password=ADMIN_HASHED,
            role=UserRole.admin,
        )
        patient1 = User(
            email="patient1@test.demo",
            full_name="Patient One",
            phone="+92 300 1000001",
            hashed_password=HASHED,
            role=UserRole.patient,
        )
        patient2 = User(
            email="patient2@test.demo",
            full_name="Patient Two",
            phone="+92 300 1000002",
            hashed_password=HASHED,
            role=UserRole.patient,
        )
        patient3 = User(
            email="patient3@test.demo",
            full_name="Patient Three",
            phone="+92 300 1000003",
            hashed_password=HASHED,
            role=UserRole.patient,
        )
        dept_a = Department(
            name="Cardiology",
            slug="cardiology",
            description="Heart care",
            icon="HeartPulse",
            accent="rose",
        )
        dept_b = Department(
            name="Neurology",
            slug="neurology",
            description="Brain care",
            icon="Brain",
            accent="violet",
        )
        doc_user1 = User(
            email="doctor1@test.demo",
            full_name="Dr. Test One",
            hashed_password=DOCTOR_HASHED,
            role=UserRole.doctor,
        )
        doc_user2 = User(
            email="doctor2@test.demo",
            full_name="Dr. Test Two",
            hashed_password=DOCTOR_HASHED,
            role=UserRole.doctor,
        )
        doctor1 = Doctor(
            user=doc_user1,
            department=dept_a,
            specialization="Cardiologist",
            qualifications="MBBS",
            experience_years=10,
            bio="Test doctor",
            consultation_fee=Decimal("2000.00"),
            room="A-1",
            avg_consult_minutes=15,
            avatar_color="blue",
        )
        doctor2 = Doctor(
            user=doc_user2,
            department=dept_b,
            specialization="Neurologist",
            experience_years=8,
            consultation_fee=Decimal("2200.00"),
            room="B-1",
            avg_consult_minutes=20,
            avatar_color="violet",
        )
        for doctor in (doctor1, doctor2):
            for weekday in range(7):
                doctor.availability.append(
                    Availability(
                        weekday=weekday,
                        start_time=time(9, 0),
                        end_time=time(12, 0),
                        slot_minutes=15,
                        is_active=True,
                    )
                )
        db.add_all(
            [
                admin,
                patient1,
                patient2,
                patient3,
                dept_a,
                dept_b,
                doctor1,
                doctor2,
            ]
        )
        db.flush()

        # Today's queue for doctor one: two waiting patients.
        db.add_all(
            [
                Appointment(
                    reference_code="MQ-TEST0001",
                    patient_id=patient2.id,
                    doctor_id=doctor1.id,
                    department_id=dept_a.id,
                    appointment_date=date.today(),
                    slot_time=time(9, 0),
                    duration_minutes=15,
                    queue_number=1,
                    status=AppointmentStatus.booked,
                    reason="Queue test one",
                ),
                Appointment(
                    reference_code="MQ-TEST0002",
                    patient_id=patient3.id,
                    doctor_id=doctor1.id,
                    department_id=dept_a.id,
                    appointment_date=date.today(),
                    slot_time=time(9, 15),
                    duration_minutes=15,
                    queue_number=2,
                    status=AppointmentStatus.checked_in,
                    reason="Queue test two",
                ),
            ]
        )
        db.commit()

        ids = {
            "admin": admin.id,
            "patient1": patient1.id,
            "patient2": patient2.id,
            "patient3": patient3.id,
            "doctor1": doctor1.id,
            "doctor2": doctor2.id,
            "doctor_user1": doc_user1.id,
            "doctor_user2": doc_user2.id,
            "dept_a": dept_a.id,
            "dept_b": dept_b.id,
        }

    def override_get_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)
    yield {"client": client, "ids": ids, "engine": engine, "Session": TestingSession}
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


def login(client: TestClient, email: str, password: str) -> dict[str, str]:
    response = client.post("/api/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    csrf = client.cookies.get("csrf_token")
    assert csrf
    return {"X-CSRF-Token": csrf}


@pytest.fixture()
def patient_client(test_db):
    client = test_db["client"]
    headers = login(client, "patient1@test.demo", PASSWORDS["patient1"])
    return client, headers, test_db["ids"]


@pytest.fixture()
def doctor_client(test_db):
    client = test_db["client"]
    headers = login(client, "doctor1@test.demo", PASSWORDS["doctor1"])
    return client, headers, test_db["ids"]


@pytest.fixture()
def admin_client(test_db):
    client = test_db["client"]
    headers = login(client, "admin@test.demo", PASSWORDS["admin"])
    return client, headers, test_db["ids"]


