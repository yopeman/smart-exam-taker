from enum import Enum
from typing import Annotated, Literal, Union

from pydantic import BaseModel, ConfigDict, Field, model_validator


class QuestionType(str, Enum):
    mcq = "mcq"
    true_false = "true_false"
    matching = "matching"
    fill_blank = "fill_blank"
    essay = "essay"


class BaseQuestion(BaseModel):
    model_config = ConfigDict(extra="forbid")

    type: QuestionType
    prompt: str = Field(min_length=1)
    points: int = Field(default=1, ge=0)


class MCQOption(BaseModel):
    model_config = ConfigDict(extra="forbid")

    text: str = Field(min_length=1)
    is_correct: bool


class MCQQuestion(BaseQuestion):
    type: Literal[QuestionType.mcq] = QuestionType.mcq
    options: list[MCQOption] = Field(min_length=2)
    multiple_correct: bool = False

    @model_validator(mode="after")
    def _check_correct(self) -> "MCQQuestion":
        correct = [o for o in self.options if o.is_correct]
        if not correct:
            raise ValueError("MCQ must have at least one correct option")
        if not self.multiple_correct and len(correct) > 1:
            raise ValueError(
                "multiple_correct must be true when more than one option is correct"
            )
        return self


class TrueFalseQuestion(BaseQuestion):
    type: Literal[QuestionType.true_false] = QuestionType.true_false
    correct_answer: bool


class MatchPair(BaseModel):
    model_config = ConfigDict(extra="forbid")

    left: str = Field(min_length=1)
    right: str = Field(min_length=1)


class MatchingQuestion(BaseQuestion):
    type: Literal[QuestionType.matching] = QuestionType.matching
    pairs: list[MatchPair] = Field(min_length=1)


class FillBlankAnswer(BaseModel):
    model_config = ConfigDict(extra="forbid")

    answers: list[str] = Field(min_length=1)


class FillBlankQuestion(BaseQuestion):
    type: Literal[QuestionType.fill_blank] = QuestionType.fill_blank
    text: str | None = None
    blanks: list[FillBlankAnswer] = Field(min_length=1)


class EssayQuestion(BaseQuestion):
    type: Literal[QuestionType.essay] = QuestionType.essay
    model_answer: str | None = None
    rubric: str | None = None


Question = Annotated[
    Union[
        MCQQuestion,
        TrueFalseQuestion,
        MatchingQuestion,
        FillBlankQuestion,
        EssayQuestion,
    ],
    Field(discriminator="type"),
]

QuestionList = list[Question]

_QUESTION_MODELS: dict = {
    QuestionType.mcq: MCQQuestion,
    QuestionType.true_false: TrueFalseQuestion,
    QuestionType.matching: MatchingQuestion,
    QuestionType.fill_blank: FillBlankQuestion,
    QuestionType.essay: EssayQuestion,
}


class RawQuestion(BaseModel):
    """Flat shape used for LLM structured output before validation."""

    model_config = ConfigDict(extra="ignore")

    type: QuestionType
    prompt: str
    points: int = 1
    options: list[MCQOption] | None = None
    multiple_correct: bool = False
    correct_answer: bool | None = None
    pairs: list[MatchPair] | None = None
    text: str | None = None
    blanks: list[FillBlankAnswer] | None = None
    model_answer: str | None = None
    rubric: str | None = None


def to_question(raw: RawQuestion) -> Question:
    """Build a validated discriminated-union Question from a flat RawQuestion."""
    qtype = raw.type
    target = _QUESTION_MODELS.get(qtype)
    if target is None:
        raise ValueError(f"Unknown question type: {qtype}")
    allowed = set(target.model_fields)
    data = {k: v for k, v in raw.model_dump(exclude_none=True).items() if k in allowed}
    return target(**data)
