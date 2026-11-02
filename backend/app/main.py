from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import admin, auth, doctor, notifications, patient, public
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine


@asynccontextmanager
async def lifespan(_: FastAPI):
    try:
        if settings.is_production:
            settings.validate_production()
    except Exception as exc:  # pragma: no cover - startup validation
        raise RuntimeError(str(exc)) from exc
    if settings.auto_create_tables:
        Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="MediQueue API",
    description=(
        "Smart hospital queue and appointment platform. "
        "Demo data only - not connected to a real hospital."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url=f"{settings.api_prefix}/docs",
    redoc_url=f"{settings.api_prefix}/redoc",
    openapi_url=f"{settings.api_prefix}/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def security_headers(request, call_next):  # type: ignore[no-untyped-def]
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response


app.include_router(auth.router, prefix=settings.api_prefix)
app.include_router(public.router, prefix=settings.api_prefix)
app.include_router(patient.router, prefix=settings.api_prefix)
app.include_router(doctor.router, prefix=settings.api_prefix)
app.include_router(admin.router, prefix=settings.api_prefix)
app.include_router(notifications.router, prefix=settings.api_prefix)


@app.get("/", tags=["System"])
def root():
    return {
        "name": "MediQueue API",
        "version": "1.0.0",
        "docs": f"{settings.api_prefix}/docs",
        "demo": True,
    }


@app.get(f"{settings.api_prefix}/health", tags=["System"])
def health():
    return {"status": "ok", "environment": settings.environment}
