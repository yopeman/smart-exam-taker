import uuid
from enum import Enum
from typing import Annotated, Literal, Union

from pydantic import BaseModel, ConfigDict, Field, model_validator


class QuestionType(str, Enum):
    mcq = "mcq"
    matching = "matching"
    true_false = "true_false"
    blank_space = "blank_space"
    short_answer = "short_answer"


# ==================== Question Unions ====================


class MCQOption(BaseModel):
    model_config = ConfigDict(extra="forbid")

    letter: str = Field(min_length=1)
    option: str = Field(min_length=1)


class MCQQuestion(BaseModel):
    model_config = ConfigDict(extra="forbid")

    type: Literal[QuestionType.mcq] = QuestionType.mcq
    question: str = Field(min_length=1)
    options: list[MCQOption] = Field(min_length=2)
    correct_answer: str = Field(min_length=1)

    @model_validator(mode="after")
    def _validate_correct_answer(self) -> "MCQQuestion":
        allowed = {opt.letter for opt in self.options}
        if self.correct_answer not in allowed:
            raise ValueError(
                f'correct_answer "{self.correct_answer}" must match one of the '
                f"option letters: {sorted(allowed)}"
            )
        return self


class TrueFalseQuestion(BaseModel):
    model_config = ConfigDict(extra="forbid")

    type: Literal[QuestionType.true_false] = QuestionType.true_false
    question: str = Field(min_length=1)
    correct_answer: bool


class MatchingQuestion(BaseModel):
    model_config = ConfigDict(extra="forbid")

    type: Literal[QuestionType.matching] = QuestionType.matching
    question: str = Field(min_length=1)
    left_items: list[str] = Field(min_length=1)
    right_items: list[str] = Field(min_length=1)
    correct_mapping: dict[int, int]

    @model_validator(mode="after")
    def _validate_mapping(self) -> "MatchingQuestion":
        left_items = self.left_items
        right_items = self.right_items
        mapping = self.correct_mapping

        if set(mapping.keys()) != set(range(len(left_items))):
            raise ValueError(
                "correct_mapping keys must cover all left items "
                f"(0..{len(left_items) - 1}). Got keys: {sorted(mapping.keys())}"
            )

        for left_idx, right_idx in mapping.items():
            if right_idx < 0 or right_idx >= len(right_items):
                raise ValueError(
                    f"right index {right_idx} for left item {left_idx} is out of "
                    f"range. Valid range: 0..{len(right_items) - 1}"
                )

        if len(set(mapping.values())) != len(mapping.values()):
            raise ValueError(
                "Each right item can be matched to at most one left item "
                "(unique mapping required)."
            )

        return self


class BlankSpaceQuestion(BaseModel):
    model_config = ConfigDict(extra="forbid")

    type: Literal[QuestionType.blank_space] = QuestionType.blank_space
    question: str = Field(min_length=1)
    correct_answers: list[str] = Field(min_length=1)


class ShortAnswerQuestion(BaseModel):
    model_config = ConfigDict(extra="forbid")

    type: Literal[QuestionType.short_answer] = QuestionType.short_answer
    question: str = Field(min_length=1)
    correct_answer: str = Field(min_length=1)


QuestionUnion = Annotated[
    Union[
        MCQQuestion,
        MatchingQuestion,
        TrueFalseQuestion,
        BlankSpaceQuestion,
        ShortAnswerQuestion,
    ],
    Field(discriminator="type"),
]


class Question(BaseModel):
    """One question in an exam. `id` is the student-facing question key."""

    model_config = ConfigDict(extra="forbid")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    point: float = Field(default=1.0, ge=0)
    question: QuestionUnion


class SubQuestions(BaseModel):
    """A group of questions that share an optional scenario (reading passage)."""

    model_config = ConfigDict(extra="forbid")

    scenario: str | None = None
    scenario_image_ids: list[str] | None = None
    questions: list[Question] = Field(min_length=1)


class TotalQuestions(BaseModel):
    """Top-level container: full exam question set."""

    model_config = ConfigDict(extra="forbid")

    questions: list[SubQuestions] = Field(min_length=1)


# ==================== Student-Facing Question Schemas ====================
# These mirror the full question models but drop answer keys
# (correct_answer, correct_mapping, correct_answers) so they are never
# leaked to students. `extra="ignore"` lets them sanitize stored question
# dicts that still include the answer fields.


class StudentMCQQuestion(BaseModel):
    model_config = ConfigDict(extra="ignore")

    type: Literal[QuestionType.mcq] = QuestionType.mcq
    question: str = Field(min_length=1)
    options: list[MCQOption] = Field(min_length=2)


class StudentTrueFalseQuestion(BaseModel):
    model_config = ConfigDict(extra="ignore")

    type: Literal[QuestionType.true_false] = QuestionType.true_false
    question: str = Field(min_length=1)


class StudentMatchingQuestion(BaseModel):
    model_config = ConfigDict(extra="ignore")

    type: Literal[QuestionType.matching] = QuestionType.matching
    question: str = Field(min_length=1)
    left_items: list[str] = Field(min_length=1)
    right_items: list[str] = Field(min_length=1)


class StudentBlankSpaceQuestion(BaseModel):
    model_config = ConfigDict(extra="ignore")

    type: Literal[QuestionType.blank_space] = QuestionType.blank_space
    question: str = Field(min_length=1)


class StudentShortAnswerQuestion(BaseModel):
    model_config = ConfigDict(extra="ignore")

    type: Literal[QuestionType.short_answer] = QuestionType.short_answer
    question: str = Field(min_length=1)


StudentQuestionUnion = Annotated[
    Union[
        StudentMCQQuestion,
        StudentMatchingQuestion,
        StudentTrueFalseQuestion,
        StudentBlankSpaceQuestion,
        StudentShortAnswerQuestion,
    ],
    Field(discriminator="type"),
]


class StudentQuestion(BaseModel):
    """One question as seen by a student (no answer key)."""

    model_config = ConfigDict(extra="ignore")

    id: str = Field(min_length=1)
    point: float = Field(default=1.0, ge=0)
    question: StudentQuestionUnion


class StudentSubQuestions(BaseModel):
    """A group of questions sharing an optional scenario, student-facing."""

    model_config = ConfigDict(extra="ignore")

    scenario: str | None = None
    scenario_image_ids: list[str] | None = None
    questions: list[StudentQuestion] = Field(min_length=1)


class StudentTotalQuestions(BaseModel):
    """Top-level student-facing container: full exam question set."""

    model_config = ConfigDict(extra="ignore")

    questions: list[StudentSubQuestions] = Field(min_length=1)


def flatten_questions(total: TotalQuestions) -> list[Question]:
    """Return every question across all sub-groups, in order."""
    return [q for group in total.questions for q in group.questions]


def question_by_id(total: TotalQuestions, question_id: str) -> Question | None:
    for q in flatten_questions(total):
        if q.id == question_id:
            return q
    return None


# ==================== Student Answer / Evaluation ====================


class Correctness(str, Enum):
    correct = "correct"
    partial = "partial"
    incorrect = "incorrect"


class StudentAttempt(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1)
    question_id: str = Field(min_length=1)
    attempt: str | bool | dict[int, int] | list[str]


class StudentAttempts(BaseModel):
    model_config = ConfigDict(extra="forbid")

    attempts: list[StudentAttempt]


class AttemptEvaluation(BaseModel):
    model_config = ConfigDict(extra="forbid")

    student_attempt: StudentAttempt
    score: float = Field(ge=0)
    correctness: Correctness
    feedback: str | None = None


class AttemptEvaluations(BaseModel):
    model_config = ConfigDict(extra="forbid")

    evaluations: list[AttemptEvaluation]


QuestionList = list[Question]

__all__ = [
    "QuestionType",
    "Question",
    "SubQuestions",
    "TotalQuestions",
    "StudentMCQQuestion",
    "StudentTrueFalseQuestion",
    "StudentMatchingQuestion",
    "StudentBlankSpaceQuestion",
    "StudentShortAnswerQuestion",
    "StudentQuestion",
    "StudentSubQuestions",
    "StudentTotalQuestions",
    "MCQOption",
    "MCQQuestion",
    "MatchingQuestion",
    "TrueFalseQuestion",
    "BlankSpaceQuestion",
    "ShortAnswerQuestion",
    "Correctness",
    "StudentAttempt",
    "StudentAttempts",
    "AttemptEvaluation",
    "AttemptEvaluations",
    "QuestionList",
    "flatten_questions",
    "question_by_id",
]