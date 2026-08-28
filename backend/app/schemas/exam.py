from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, TypeAdapter

from app.models import ExamStatus
from app.schemas.question import QuestionList
from app.schemas.user import MessageResponse

questions_adapter: TypeAdapter[QuestionList] = TypeAdapter(QuestionList)


class ExamUpdateRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=2000)
    department: str | None = Field(default=None, max_length=150)
    year_of_study: int | None = Field(default=None, ge=1)
    semester: str | None = Field(default=None, max_length=50)
    section: str | None = Field(default=None, max_length=50)
    duration_minutes: int | None = Field(default=None, ge=1)
    questions: list[dict] | None = None


class ScheduleRequest(BaseModel):
    scheduled_at: datetime
    timezone: str = "UTC"


class ExamResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    school_id: str
    instructor_id: str
    code: str
    title: str
    description: str | None
    department: str | None
    year_of_study: int | None
    semester: str | None
    section: str | None
    document_content: str | None
    questions: QuestionList
    duration_minutes: int
    status: ExamStatus
    started_by: str | None
    scheduled_at: datetime | None
    started_at: datetime | None
    completed_at: datetime | None
    cancelled_at: datetime | None
    created_at: datetime
    updated_at: datetime


__all__ = [
    "ExamUpdateRequest",
    "ScheduleRequest",
    "ExamResponse",
    "MessageResponse",
    "questions_adapter",
]
