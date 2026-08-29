import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    DateTime,
    Enum,
    Float,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class AttemptStatus(str, enum.Enum):
    in_progress = "in_progress"
    submitted = "submitted"
    processing = "processing"
    graded = "graded"


class ExamAttempt(Base):
    __tablename__ = "exam_attempts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    exam_id: Mapped[str] = mapped_column(String(36), index=True)
    student_id: Mapped[str] = mapped_column(String(36), index=True)

    student_first_name: Mapped[str] = mapped_column(String(150))
    student_last_name: Mapped[str] = mapped_column(String(150))
    student_id_number: Mapped[str] = mapped_column(String(100))
    student_face_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    face_captured_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    department: Mapped[str | None] = mapped_column(String(150), nullable=True)
    year_of_study: Mapped[int | None] = mapped_column(Integer, nullable=True)
    semester: Mapped[str | None] = mapped_column(String(50), nullable=True)
    section: Mapped[str | None] = mapped_column(String(50), nullable=True)

    answers: Mapped[dict] = mapped_column(JSON, default=dict)
    grading_details: Mapped[list] = mapped_column(JSON, default=list)

    objective_score: Mapped[float] = mapped_column(Float, default=0.0)
    ai_score: Mapped[float] = mapped_column(Float, default=0.0)
    total_score: Mapped[float] = mapped_column(Float, default=0.0)

    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    submitted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    graded_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    status: Mapped[AttemptStatus] = mapped_column(
        Enum(AttemptStatus), default=AttemptStatus.in_progress
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
