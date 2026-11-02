from __future__ import annotations

import secrets
from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.doctor import Doctor
from app.models.user import User, UserRole

bearer_scheme = HTTPBearer(auto_error=False)
DbSession = Annotated[Session, Depends(get_db)]


def _token_from_request(
    request: Request, credentials: HTTPAuthorizationCredentials | None
) -> str | None:
    if credentials and credentials.scheme.lower() == "bearer":
        return credentials.credentials
    return request.cookies.get("access_token")


def get_current_user(
    request: Request,
    db: DbSession,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> User:
    token = _token_from_request(request, credentials)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Please sign in to continue.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your session has expired. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.get(User, int(payload["sub"]))
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="This account is inactive.")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_patient(user: CurrentUser) -> User:
    if user.role != UserRole.patient:
        raise HTTPException(status_code=403, detail="Patient access only.")
    return user


def require_doctor_user(user: CurrentUser) -> User:
    if user.role != UserRole.doctor:
        raise HTTPException(status_code=403, detail="Doctor access only.")
    return user


def require_admin(user: CurrentUser) -> User:
    if user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Administrator access only.")
    return user


PatientUser = Annotated[User, Depends(require_patient)]
DoctorUser = Annotated[User, Depends(require_doctor_user)]
AdminUser = Annotated[User, Depends(require_admin)]


def get_current_doctor(db: DbSession, user: DoctorUser) -> Doctor:
    doctor = db.scalar(select(Doctor).where(Doctor.user_id == user.id))
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found.")
    return doctor


CurrentDoctor = Annotated[Doctor, Depends(get_current_doctor)]


def require_csrf(
    request: Request,
    user: CurrentUser,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> None:
    """Double-submit CSRF check for cookie-authenticated mutations.

    Bearer-token clients (API tests, tooling) are not vulnerable to browser CSRF
    and are allowed through.
    """
    if request.method in {"GET", "HEAD", "OPTIONS"}:
        return
    if credentials and credentials.scheme.lower() == "bearer":
        return
    header = request.headers.get("x-csrf-token")
    cookie = request.cookies.get("csrf_token")
    if not header or not cookie or not secrets.compare_digest(header, cookie):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Security check failed. Refresh the page and try again.",
        )
