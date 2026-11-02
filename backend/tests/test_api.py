from __future__ import annotations

from datetime import date, time, timedelta
from threading import Barrier, Thread

import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.models.appointment import Appointment, AppointmentStatus
from tests.conftest import PASSWORDS, login


def tomorrow() -> str:
    return (date.today() + timedelta(days=1)).isoformat()


def test_public_catalog_and_slots(test_db):
    client = test_db["client"]
    assert client.get("/api/health").json()["status"] == "ok"
    departments = client.get("/api/public/departments")
    assert departments.status_code == 200
    assert len(departments.json()) == 2

    doctors = client.get("/api/public/doctors?page_size=5")
    assert doctors.status_code == 200
    body = doctors.json()
    assert body["total"] == 2
    doctor_id = body["items"][0]["id"]

    slots = client.get(f"/api/public/doctors/{doctor_id}/slots?date={tomorrow()}")
    assert slots.status_code == 200
    assert len(slots.json()) == 12
    assert slots.json()[0]["available"] is True
    assert slots.json()[0]["queue_number"] == 1


def test_auth_cookies_and_logout(test_db):
    client = test_db["client"]
    response = client.post(
        "/api/auth/login",
        json={"email": "patient1@test.demo", "password": PASSWORDS["patient1"]},
    )
    assert response.status_code == 200
    assert client.cookies.get("access_token")
    assert client.cookies.get("csrf_token")
    assert "httponly" in response.headers["set-cookie"].lower()

    me = client.get("/api/auth/me")
    assert me.status_code == 200
    assert me.json()["email"] == "patient1@test.demo"

    assert client.post("/api/auth/logout").status_code == 200
    assert client.get("/api/auth/me").status_code == 401


def test_registration_validates_and_creates_patient(test_db):
    client = test_db["client"]
    weak = client.post(
        "/api/auth/register",
        json={
            "full_name": "Weak Password",
            "email": "weak@test.demo",
            "password": "password",
        },
    )
    assert weak.status_code == 422

    created = client.post(
        "/api/auth/register",
        json={
            "full_name": "New Patient",
            "email": "new@test.demo",
            "phone": "+92 300 1111111",
            "password": "NewPatient123",
        },
    )
    assert created.status_code == 201, created.text
    assert created.json()["user"]["role"] == "patient"
    assert client.get("/api/auth/me").json()["email"] == "new@test.demo"


def test_csrf_required_for_cookie_mutations(test_db):
    client = test_db["client"]
    login(client, "patient1@test.demo", PASSWORDS["patient1"])
    payload = {
        "doctor_id": test_db["ids"]["doctor1"],
        "appointment_date": tomorrow(),
        "slot_time": "10:00",
    }
    without = client.post("/api/patient/appointments", json=payload)
    assert without.status_code == 403


def test_role_based_access(test_db):
    client = test_db["client"]
    login(client, "patient1@test.demo", PASSWORDS["patient1"])
    assert client.get("/api/doctor/dashboard").status_code == 403
    assert client.get("/api/admin/stats").status_code == 403
    client.post("/api/auth/logout")

    login(client, "doctor1@test.demo", PASSWORDS["doctor1"])
    assert client.get("/api/patient/dashboard").status_code == 403
    assert client.get("/api/admin/stats").status_code == 403


def test_patient_cannot_access_another_patients_appointment(test_db):
    client = test_db["client"]
    headers = login(client, "patient1@test.demo", PASSWORDS["patient1"])
    # Appointment 1 belongs to patient two.
    assert client.get("/api/patient/appointments/1").status_code == 404
    assert client.post("/api/patient/appointments/1/cancel", headers=headers).status_code == 404


def test_booking_prevents_double_booking_and_past_dates(test_db):
    client = test_db["client"]
    ids = test_db["ids"]
    headers = login(client, "patient1@test.demo", PASSWORDS["patient1"])
    payload = {
        "doctor_id": ids["doctor1"],
        "appointment_date": tomorrow(),
        "slot_time": "09:00",
        "reason": "First booking",
    }
    first = client.post("/api/patient/appointments", json=payload, headers=headers)
    assert first.status_code == 201, first.text
    assert first.json()["queue_number"] == 1
    assert first.json()["status"] == "booked"

    duplicate = client.post("/api/patient/appointments", json=payload, headers=headers)
    assert duplicate.status_code == 409

    client.post("/api/auth/logout")
    headers2 = login(client, "patient2@test.demo", PASSWORDS["patient2"])
    conflict = client.post("/api/patient/appointments", json=payload, headers=headers2)
    assert conflict.status_code == 409

    past = client.post(
        "/api/patient/appointments",
        json={
            "doctor_id": ids["doctor1"],
            "appointment_date": (date.today() - timedelta(days=1)).isoformat(),
            "slot_time": "09:00",
        },
        headers=headers2,
    )
    assert past.status_code == 422

    off_grid = client.post(
        "/api/patient/appointments",
        json={
            "doctor_id": ids["doctor1"],
            "appointment_date": tomorrow(),
            "slot_time": "09:07",
        },
        headers=headers2,
    )
    assert off_grid.status_code == 422


def test_queue_snapshot_and_queue_number(test_db):
    client = test_db["client"]
    ids = test_db["ids"]
    headers = login(client, "patient1@test.demo", PASSWORDS["patient1"])
    first = client.post(
        "/api/patient/appointments",
        json={
            "doctor_id": ids["doctor1"],
            "appointment_date": tomorrow(),
            "slot_time": "09:15",
        },
        headers=headers,
    )
    assert first.status_code == 201
    client.post("/api/auth/logout")

    headers = login(client, "patient2@test.demo", PASSWORDS["patient2"])
    second = client.post(
        "/api/patient/appointments",
        json={
            "doctor_id": ids["doctor1"],
            "appointment_date": tomorrow(),
            "slot_time": "10:00",
        },
        headers=headers,
    )
    assert second.status_code == 201, second.text
    assert second.json()["queue_number"] == 5

    queue = client.get(f"/api/patient/appointments/{second.json()['id']}/queue")
    assert queue.status_code == 200
    body = queue.json()
    assert body["queue_number"] == 5
    assert body["patients_ahead"] == 1
    assert body["estimated_wait_minutes"] == 15
    assert 5 <= body["progress_percent"] <= 95


def test_reschedule_and_cancel_rules(test_db):
    client = test_db["client"]
    ids = test_db["ids"]
    headers = login(client, "patient1@test.demo", PASSWORDS["patient1"])
    booking = client.post(
        "/api/patient/appointments",
        json={
            "doctor_id": ids["doctor1"],
            "appointment_date": tomorrow(),
            "slot_time": "09:00",
        },
        headers=headers,
    )
    appointment_id = booking.json()["id"]

    moved = client.patch(
        f"/api/patient/appointments/{appointment_id}/reschedule",
        json={"appointment_date": tomorrow(), "slot_time": "09:30"},
        headers=headers,
    )
    assert moved.status_code == 200, moved.text
    assert moved.json()["slot_time"] == "09:30"
    assert moved.json()["queue_number"] == 3

    old_slot = client.get(
        f"/api/public/doctors/{ids['doctor1']}/slots?date={tomorrow()}"
    ).json()[0]
    assert old_slot["time"] == "09:00"
    assert old_slot["available"] is True

    cancelled = client.post(
        f"/api/patient/appointments/{appointment_id}/cancel", headers=headers
    )
    assert cancelled.status_code == 200
    again = client.post(
        f"/api/patient/appointments/{appointment_id}/cancel", headers=headers
    )
    assert again.status_code == 409

    detail = client.get(f"/api/patient/appointments/{appointment_id}")
    assert detail.json()["status"] == "cancelled"


def test_doctor_call_next_and_status_flow(test_db):
    client = test_db["client"]
    headers = login(client, "doctor1@test.demo", PASSWORDS["doctor1"])
    queue = client.get("/api/doctor/queue")
    assert queue.status_code == 200
    assert queue.json()["stats"]["today_total"] == 2
    assert queue.json()["next"]["queue_number"] == 1

    called = client.post("/api/doctor/queue/call-next", headers=headers)
    assert called.status_code == 200, called.text
    appointment_id = called.json()["appointment"]["id"]
    assert called.json()["appointment"]["status"] == "in_progress"

    again = client.post("/api/doctor/queue/call-next", headers=headers)
    assert again.status_code == 409

    completed = client.patch(
        f"/api/doctor/appointments/{appointment_id}/status",
        json={"status": "completed", "doctor_notes": "Reviewed."},
        headers=headers,
    )
    assert completed.status_code == 200, completed.text
    assert completed.json()["status"] == "completed"
    assert completed.json()["doctor_notes"] == "Reviewed."

    next_patient = client.post("/api/doctor/queue/call-next", headers=headers)
    assert next_patient.status_code == 200
    assert next_patient.json()["appointment"]["queue_number"] == 2

    invalid = client.patch(
        f"/api/doctor/appointments/{appointment_id}/status",
        json={"status": "booked"},
        headers=headers,
    )
    assert invalid.status_code == 409


def test_doctor_cannot_access_another_doctors_appointment(test_db):
    client = test_db["client"]
    headers = login(client, "doctor2@test.demo", PASSWORDS["doctor2"])
    assert client.get("/api/doctor/appointments/1").status_code == 404
    assert (
        client.patch(
            "/api/doctor/appointments/1/status",
            json={"status": "checked_in"},
            headers=headers,
        ).status_code
        == 404
    )


def test_admin_stats_and_management(test_db):
    client = test_db["client"]
    headers = login(client, "admin@test.demo", PASSWORDS["admin"])
    stats = client.get("/api/admin/stats")
    assert stats.status_code == 200
    body = stats.json()
    assert body["total_patients"] == 3
    assert body["total_doctors"] == 2
    assert len(body["bookings_last_7_days"]) == 7

    patients = client.get("/api/admin/patients")
    assert patients.status_code == 200
    assert patients.json()["total"] == 3

    created = client.post(
        "/api/admin/departments",
        json={
            "name": "Dermatology",
            "description": "Skin care",
            "icon": "Sparkles",
            "accent": "teal",
        },
        headers=headers,
    )
    assert created.status_code == 201, created.text
    dept_id = created.json()["id"]
    assert created.json()["slug"] == "dermatology"

    deleted = client.delete(f"/api/admin/departments/{dept_id}", headers=headers)
    assert deleted.status_code == 200

    blocked = client.delete(
        f"/api/admin/departments/{test_db['ids']['dept_a']}", headers=headers
    )
    assert blocked.status_code == 409

    doctor = client.post(
        "/api/admin/doctors",
        json={
            "full_name": "Dr. New Hire",
            "email": "new.doctor@test.demo",
            "password": "Doctor12345",
            "department_id": test_db["ids"]["dept_b"],
            "specialization": "Neurologist",
            "experience_years": 4,
            "avg_consult_minutes": 15,
        },
        headers=headers,
    )
    assert doctor.status_code == 201, doctor.text
    assert doctor.json()["email"] == "new.doctor@test.demo"

    deactivated = client.patch(
        f"/api/admin/patients/{test_db['ids']['patient3']}",
        json={"is_active": False},
        headers=headers,
    )
    assert deactivated.status_code == 200
    assert deactivated.json()["is_active"] is False


def test_public_queue_is_private_and_labelled(test_db):
    client = test_db["client"]
    response = client.get("/api/public/queue/MQ-TEST0001")
    assert response.status_code == 200
    body = response.json()
    assert body["queue_number"] == 1
    assert "patient" not in body
    assert "full_name" not in str(body)
    assert "phone" not in body
    assert client.get("/api/public/queue/MQ-NOTREAL").status_code == 404


def test_contact_form_and_validation(test_db):
    client = test_db["client"]
    bad = client.post(
        "/api/public/contact",
        json={"name": "A", "email": "not-an-email", "subject": "Hi", "message": "short"},
    )
    assert bad.status_code == 422
    good = client.post(
        "/api/public/contact",
        json={
            "name": "Visitor",
            "email": "visitor@test.demo",
            "subject": "Appointment question",
            "message": "This is a sufficiently long demo message.",
        },
    )
    assert good.status_code == 201


def test_database_unique_index_blocks_concurrent_duplicate(test_db):
    Session = test_db["Session"]
    ids = test_db["ids"]
    barrier = Barrier(2)
    errors: list[Exception] = []

    def insert(reference: str):
        with Session() as db:
            barrier.wait()
            db.add(
                Appointment(
                    reference_code=reference,
                    patient_id=ids["patient1"],
                    doctor_id=ids["doctor2"],
                    department_id=ids["dept_b"],
                    appointment_date=date.today() + timedelta(days=3),
                    slot_time=time(9, 0),
                    duration_minutes=15,
                    queue_number=1,
                    status=AppointmentStatus.booked,
                )
            )
            try:
                db.commit()
            except Exception as exc:  # pragma: no cover - expected race
                errors.append(exc)

    threads = [
        Thread(target=insert, args=("MQ-RACE0001",)),
        Thread(target=insert, args=("MQ-RACE0002",)),
    ]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join()

    with Session() as db:
        count = len(
            db.scalars(
                select(Appointment).where(
                    Appointment.doctor_id == ids["doctor2"],
                    Appointment.appointment_date == date.today() + timedelta(days=3),
                )
            ).all()
        )
    assert count == 1
    assert len(errors) == 1
    assert isinstance(errors[0], IntegrityError)
