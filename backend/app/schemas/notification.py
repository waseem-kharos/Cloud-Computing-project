from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class NotificationOut(BaseModel):
    id: int
    title: str
    message: str
    category: str
    link: str | None = None
    is_read: bool
    created_at: datetime | None = None


class NotificationListOut(BaseModel):
    items: list[NotificationOut]
    unread: int
