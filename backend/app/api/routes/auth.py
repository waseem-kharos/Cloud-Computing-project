from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.api.deps import CurrentUser, DbSession, require_csrf
from app.core.config import settings
from app.core.rate_limit import client_key, limiter
from app.core.security import create_access_token, hash_password, random_token, verify_password
from app.models.activity import ActivityLog
from app.models.user import User, UserRole
from app.schemas.auth import (
    AuthResponse,
    ChangePasswordRequest,
    LoginRequest,
    RegisterRequest,
    UpdateProfileRequest,
    UserOut,
)
from app.schemas.common import Message
from app.services.serializers import user_out

router = APIRouter(prefix="/auth", tags=["Authentication"])


def set_auth_cookies(response: Response, user: User) -> str:
    token = create_access_token(user.id, user.role.value)
    csrf = random_token(24)
    max_age = settings.access_token_expire_minutes * 60
    response.set_cookie(
        "access_token",
        token,
        max_age=max_age,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        path="/",
    )
    response.set_cookie(
        "csrf_token",
        csrf,
        max_age=max_age,
        httponly=False,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        path="/",
    )
    return csrf


def clear_auth_cookies(response: Response) -> None:
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("csrf_token", path="/")


@router.post("/register", response_model=AuthResponse, status_code=201)
def register(payload: RegisterRequest, request: Request, response: Response, db: DbSession):
    limiter.check(client_key(request, "register"), limit=8, window_seconds=600)
    email = payload.email.lower()
    if db.scalar(select(User.id).where(User.email == email)):
        raise HTTPException(status_code=409, detail="An account with this email already exists.")
    user = User(
        email=email,
        full_name=payload.full_name,
        phone=payload.phone,
        hashed_password=hash_password(payload.password),
        role=UserRole.patient,
        date_of_birth=payload.date_of_birth,
        gender=payload.gender,
    )
    db.add(user)
    try:
        db.flush()
        db.add(
            ActivityLog(
                actor_id=user.id,
                action="auth.registered",
                entity_type="user",
                entity_id=user.id,
                detail=f"Patient account created for {user.email}",
            )
        )
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="An account with this email already exists.")
    db.refresh(user)
    csrf = set_auth_cookies(response, user)
    return AuthResponse(user=UserOut(**user_out(user)), csrf_token=csrf)


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, request: Request, response: Response, db: DbSession):
    email = payload.email.lower()
    limiter.check(client_key(request, f"login:{email}"), limit=10, window_seconds=600)
    user = db.scalar(select(User).where(User.email == email))
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password.")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="This account has been deactivated.")
    if user.role == UserRole.doctor:
        if not user.doctor_profile or not user.doctor_profile.is_active:
            raise HTTPException(status_code=403, detail="This doctor profile is not active.")
    db.add(
        ActivityLog(
            actor_id=user.id,
            action="auth.login",
            entity_type="user",
            entity_id=user.id,
            detail=f"{user.role.value} signed in",
        )
    )
    db.commit()
    csrf = set_auth_cookies(response, user)
    return AuthResponse(user=UserOut(**user_out(user)), csrf_token=csrf)


@router.post("/logout", response_model=Message)
def logout(response: Response):
    clear_auth_cookies(response)
    return Message(message="Signed out.")


@router.get("/me", response_model=UserOut)
def me(request: Request, response: Response, user: CurrentUser):
    if not request.cookies.get("csrf_token"):
        response.set_cookie(
            "csrf_token",
            random_token(24),
            max_age=settings.access_token_expire_minutes * 60,
            httponly=False,
            secure=settings.cookie_secure,
            samesite=settings.cookie_samesite,
            path="/",
        )
    return UserOut(**user_out(user))


@router.patch("/me", response_model=UserOut, dependencies=[Depends(require_csrf)])
def update_me(payload: UpdateProfileRequest, user: CurrentUser, db: DbSession):
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return UserOut(**user_out(user))


@router.post("/change-password", response_model=Message, dependencies=[Depends(require_csrf)])
def change_password(payload: ChangePasswordRequest, user: CurrentUser, db: DbSession):
    if not verify_password(payload.current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Your current password is incorrect.")
    if verify_password(payload.new_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Choose a password you have not used before.")
    user.hashed_password = hash_password(payload.new_password)
    db.add(
        ActivityLog(
            actor_id=user.id,
            action="auth.password_changed",
            entity_type="user",
            entity_id=user.id,
            detail="Password changed",
        )
    )
    db.commit()
    return Message(message="Password updated successfully.")
