# MediQueue Backend

FastAPI backend for MediQueue - Smart Hospital Queue & Appointment Management System.

## Tech Stack
- Python 3.12
- FastAPI 0.161.1
- SQLAlchemy 2.1.6
- Alembic 1.20.1
- Pydantic v2
- SQLite (dev) / PostgreSQL (prod ready)
- JWT + HttpOnly Cookies + CSRF Double Submit

## Features
- Role-based auth (Patient, Doctor, Admin)
- Appointment booking, reschedule, cancel
- Live queue management with concurrency protection
- Doctor schedules & time-off
- Notifications
- Public queue lookup via reference code
- Admin dashboard & management

## Setup

### 1. Create virtual environment
```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# Linux/Mac
source .venv/bin/activate
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Environment setup
Copy `.env.example` to `.env` and update values:
```bash
copy .env.example .env  # Windows
cp .env.example .env    # Linux/Mac
```

Key variables:
- `SECRET_KEY` - Generate strong key for production
- `DATABASE_URL` - sqlite:///./hospital.db (default)
- `ENVIRONMENT` - development/production
- `COOKIE_SECURE` - true for HTTPS

### 4. Run migrations
```bash
alembic upgrade head
```

### 5. Seed demo data (optional)
```bash
python -m app.seed
```

### 6. Run server
```bash
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

API docs: http://127.0.0.1:8000/api/docs

## Demo Credentials
- Admin: admin@mediqueue.demo / Admin@12345
- Doctor: ayesha.khan@mediqueue.demo / Doctor@12345
- Patient: patient@mediqueue.demo / Patient@12345

## Testing
```bash
python -m pytest -q
```

## Security
- HttpOnly secure cookies for auth
- CSRF protection on state-changing operations
- Rate limiting on sensitive endpoints
- Role-based access control
- Password hashing with bcrypt
