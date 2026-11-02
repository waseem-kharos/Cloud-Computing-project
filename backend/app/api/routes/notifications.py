from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select, update

from app.api.deps import CurrentUser, DbSession, require_csrf
from app.models.notification import Notification
from app.schemas.common import Message
from app.schemas.notification import NotificationListOut, NotificationOut
from app.services.serializers import notification_out

router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"],
    dependencies=[Depends(require_csrf)],
)


@router.get("", response_model=NotificationListOut)
def list_notifications(db: DbSession, user: CurrentUser):
    rows = list(
        db.scalars(
            select(Notification)
            .where(Notification.user_id == user.id)
            .order_by(Notification.created_at.desc(), Notification.id.desc())
            .limit(50)
        ).all()
    )
    unread = db.scalar(
        select(func.count(Notification.id)).where(
            Notification.user_id == user.id, Notification.is_read.is_(False)
        )
    ) or 0
    return NotificationListOut(
        items=[NotificationOut(**notification_out(n)) for n in rows], unread=unread
    )


@router.post("/{notification_id}/read", response_model=Message)
def mark_read(notification_id: int, db: DbSession, user: CurrentUser):
    notification = db.get(Notification, notification_id)
    if not notification or notification.user_id != user.id:
        raise HTTPException(status_code=404, detail="Notification not found.")
    notification.is_read = True
    db.commit()
    return Message(message="Notification marked as read.")


@router.post("/read-all", response_model=Message)
def mark_all_read(db: DbSession, user: CurrentUser):
    db.execute(
        update(Notification)
        .where(Notification.user_id == user.id, Notification.is_read.is_(False))
        .values(is_read=True)
    )
    db.commit()
    return Message(message="All notifications marked as read.")
