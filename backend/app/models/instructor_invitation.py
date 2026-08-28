import enum
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import DateTime, Enum, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class InvitationStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"
    canceled = "canceled"
    expired = "expired"


INVITATION_EXPIRE_DAYS = 30


def _expires_at() -> datetime:
    return datetime.now(timezone.utc) + timedelta(days=INVITATION_EXPIRE_DAYS)


class InstructorInvitation(Base):
    __tablename__ = "instructor_invitations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    school_id: Mapped[str] = mapped_column(String(36), index=True)
    instructor_email: Mapped[str] = mapped_column(String(255), index=True)
    max_exams: Mapped[int] = mapped_column(Integer, default=1)

    invited_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow
    )
    expired_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_expires_at
    )
    accepted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    rejected_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    canceled_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    status: Mapped[InvitationStatus] = mapped_column(
        Enum(InvitationStatus), default=InvitationStatus.pending
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow
    )
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None

    @property
    def is_expired(self) -> bool:
        expired_at = self.expired_at
        if expired_at.tzinfo is None:
            expired_at = expired_at.replace(tzinfo=timezone.utc)
        return datetime.now(timezone.utc) >= expired_at

    def mark_expired(self) -> None:
        self.status = InvitationStatus.expired
        self.updated_at = datetime.now(timezone.utc)
