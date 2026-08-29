from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.models import AttemptStatus


class StartAttemptRequest(BaseModel):
    exam_code: str = Field(min_length=1, max_length=32)
    student_first_name: str = Field(min_length=1, max_length=150)
    student_last_name: str = Field(min_length=1, max_length=150)
    student_id_number: str = Field(min_length=1, max_length=100)
    department: str | None = Field(default=None, max_length=150)
    year_of_study: int | None = Field(default=None, ge=1)
    semester: str | None = Field(default=None, max_length=50)
    section: str | None = Field(default=None, max_length=50)


class SubmitAttemptRequest(BaseModel):
    answers: dict[str, Any] = Field(default_factory=dict)


class AttemptResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    exam_id: str
    student_id: str
    student_first_name: str
    student_last_name: str
    student_id_number: str
    student_face_url: str | None
    face_captured_at: datetime | None
    department: str | None
    year_of_study: int | None
    semester: str | None
    section: str | None
    answers: Any
    grading_details: Any
    objective_score: float
    ai_score: float
    total_score: float
    started_at: datetime
    submitted_at: datetime | None
    graded_at: datetime | None
    status: AttemptStatus
    created_at: datetime
    updated_at: datetime


__all__ = [
    "StartAttemptRequest",
    "SubmitAttemptRequest",
    "AttemptResponse",
]
