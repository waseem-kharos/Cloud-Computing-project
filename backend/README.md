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

## Free demo deployment (PythonAnywhere + Netlify)

This setup avoids card-based hosting plans. PythonAnywhere's free account has strict
resource limits, and its ASGI hosting is experimental. It is suitable only for a small
demo, not a production hospital or real patient data.

### Backend on PythonAnywhere

1. Create a free Beginner account at https://www.pythonanywhere.com/registration/register/beginner/
   and note your PythonAnywhere username.
2. Open a Bash console and run:

   ```bash
   git clone https://github.com/waseem-kharos/Cloud-Computing-project.git
   cd Cloud-Computing-project/backend
   mkvirtualenv mediqueue --python=python3.12
   pip install -r requirements.txt
   ```

3. Generate a secret with `python -c "import secrets; print(secrets.token_urlsafe(48))"`.
   Create `backend/.env` with the generated value and your username:

   ```dotenv
   ENVIRONMENT=production
   SECRET_KEY=replace-with-the-generated-value
   COOKIE_SECURE=true
   DATABASE_URL=sqlite:////home/YOUR_USERNAME/Cloud-Computing-project/backend/hospital.db
   ```

4. Seed the synthetic demo data once:

   ```bash
   python -m app.seed
   ```

5. Install the PythonAnywhere command-line tool and create the ASGI site, replacing
   `YOUR_USERNAME` with your actual username:

   ```bash
   pip install --upgrade pythonanywhere
   pa website create --domain YOUR_USERNAME.pythonanywhere.com --command \
   "cd /home/YOUR_USERNAME/Cloud-Computing-project/backend && /home/YOUR_USERNAME/.virtualenvs/mediqueue/bin/uvicorn --app-dir /home/YOUR_USERNAME/Cloud-Computing-project/backend --uds \${DOMAIN_SOCKET} app.main:app"
   ```

### Frontend on Netlify

1. Create a free Netlify account and import this GitHub repository.
2. Before deploying, replace `YOUR_PYTHONANYWHERE_USERNAME` in the root `netlify.toml`
   with the same PythonAnywhere username.
3. Netlify reads the build directory and API proxy rules from `netlify.toml`. The proxy
   keeps API calls and secure login cookies on the frontend's origin.

The SQLite database is stored in the PythonAnywhere account and persists across app
restarts, but the free plan has a very small daily CPU allowance. Demo accounts use
public sample passwords; change or disable them before sharing the demo.
