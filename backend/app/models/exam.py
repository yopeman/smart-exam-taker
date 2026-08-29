import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class ExamStatus(str, enum.Enum):
    processing = "processing"
    draft = "draft"
    submitted = "submitted"
    scheduled = "scheduled"
    started = "started"
    completed = "completed"
    cancelled = "cancelled"


class Exam(Base):
    __tablename__ = "exams"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    school_id: Mapped[str] = mapped_column(String(36), index=True)
    instructor_id: Mapped[str] = mapped_column(String(36), index=True)
    code: Mapped[str] = mapped_column(String(32), unique=True, index=True)

    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    department: Mapped[str | None] = mapped_column(String(150), nullable=True)
    year_of_study: Mapped[int | None] = mapped_column(Integer, nullable=True)
    semester: Mapped[str | None] = mapped_column(String(50), nullable=True)
    section: Mapped[str | None] = mapped_column(String(50), nullable=True)

    document_content: Mapped[str | None] = mapped_column(Text, nullable=True)
    questions: Mapped[list] = mapped_column(JSON, default=list)

    duration_minutes: Mapped[int] = mapped_column(Integer, default=60)

    max_students: Mapped[int | None] = mapped_column(Integer, nullable=True)
    max_reserved_students: Mapped[int | None] = mapped_column(Integer, nullable=True)

    started_by: Mapped[str | None] = mapped_column(String(36), nullable=True)
    scheduled_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    cancelled_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    status: Mapped[ExamStatus] = mapped_column(
        Enum(ExamStatus), default=ExamStatus.draft
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
