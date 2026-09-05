from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.models import AttemptStatus
from app.schemas.exam import LimitedSchool
from app.schemas.question import StudentAttempt, TotalQuestions


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
    """Student answers. Accepts either the canonical `attempts` list (each with a
    `question_id` and a unique `id`) or a flat `answers` dict keyed by question id.
    """

    attempts: list[StudentAttempt] | None = None
    answers: dict[str, Any] = Field(default_factory=dict)

    def answer_map(self) -> dict[str, Any]:
        """Collapse `attempts` into a dict keyed by question_id."""
        if self.attempts:
            return {a.question_id: a.attempt for a in self.attempts}
        return self.answers


class UpdateAttemptScoresRequest(BaseModel):
    grading_details: list[Any] | None = Field(default=None)
    objective_score: float | None = Field(default=None, ge=0)
    ai_score: float | None = Field(default=None, ge=0)
    total_score: float | None = Field(default=None, ge=0)


class AttemptExam(BaseModel):
    id: str
    title: str
    code: str
    questions: TotalQuestions | None = None


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
    exam: AttemptExam | None = None
    school: LimitedSchool | None = None
    created_at: datetime
    updated_at: datetime


__all__ = [
    "StartAttemptRequest",
    "SubmitAttemptRequest",
    "AttemptResponse",
    "AttemptExam",
]
