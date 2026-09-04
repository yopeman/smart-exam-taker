import logging
import uuid

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_groq import ChatGroq
from pydantic import BaseModel, Field

from app.core.config import settings
from app.schemas.question import (
    BlankSpaceQuestion,
    MCQQuestion,
    MatchingQuestion,
    Question,
    ShortAnswerQuestion,
    SubQuestions,
    TotalQuestions,
    TrueFalseQuestion,
)

logger = logging.getLogger(__name__)


class _RawQuestion(BaseModel):
    type: str
    question: str
    scenario: str | None = None
    point: float = 1.0
    options: list[dict] | None = None
    correct_answer: str | bool | None = None
    left_items: list[str] | None = None
    right_items: list[str] | None = None
    correct_mapping: dict[int, int] | None = None
    correct_answers: list[str] | None = None


class _RawQuestionList(BaseModel):
    questions: list[_RawQuestion]


_SYSTEM_PROMPT = """You are an examination authoring assistant. Convert the \
provided document text into a structured list of exam questions.

Supported question types and the fields each requires:
- mcq: "question" (the prompt), "options" (list of {"letter", "option"}), and \
"correct_answer" (the letter of the correct option). Include at least 2 options; \
use distinct letters (A, B, C, ...) and set "correct_answer" to the matching letter.
- matching: "question", "left_items" (list of items to match), "right_items" \
(list of options each left item is matched to), and "correct_mapping" mapping each \
left index (0-based) to a valid right index (0-based). Every right item is used once.
- true_false: "question" and "correct_answer" (true/false).
- blank_space: "question" (using _____ or {blank} placeholders) and "correct_answers" \
(ordered list, one per blank).
- short_answer: "question" and "correct_answer" (expected answer; graders accept \
reasonable variants).

Rules:
- Always include the correct answer/key for every question so it can be auto-graded.
- Assign a sensible "point" value (default 1) per question.
- If the document contains a shared context (a reading passage, a case study, a \
figure description) with several questions based on it, set "scenario" to that \
shared context on each question that depends on it. Questions without a shared \
context should set "scenario" to null.
- Only output questions that are clearly supported by the document. Do not invent facts.
- Return every question as an object with a "type" field from the allowed set.
"""

_MAX_INPUT_CHARS = 30000


def _build_question(raw: _RawQuestion) -> Question:
    """Build a validated Question from a flat raw LLM output."""
    qtype = raw.type

    if qtype == "mcq":
        data = {
            "type": "mcq",
            "question": raw.question,
            "options": raw.options or [],
            "correct_answer": raw.correct_answer or "",
        }
        inner = MCQQuestion(**data)
    elif qtype == "matching":
        inner = MatchingQuestion(
            type="matching",
            question=raw.question,
            left_items=raw.left_items or [],
            right_items=raw.right_items or [],
            correct_mapping=raw.correct_mapping or {},
        )
    elif qtype == "true_false":
        inner = TrueFalseQuestion(
            type="true_false",
            question=raw.question,
            correct_answer=bool(raw.correct_answer),
        )
    elif qtype == "blank_space":
        inner = BlankSpaceQuestion(
            type="blank_space",
            question=raw.question,
            correct_answers=raw.correct_answers or [],
        )
    elif qtype == "short_answer":
        inner = ShortAnswerQuestion(
            type="short_answer",
            question=raw.question,
            correct_answer=str(raw.correct_answer or ""),
        )
    else:
        raise ValueError(f"Unknown question type: {qtype}")

    return Question(id=str(uuid.uuid4()), point=raw.point, question=inner)


def generate_questions(text: str) -> TotalQuestions:
    if not settings.GROQ_API_KEY:
        raise RuntimeError(
            "GROQ_API_KEY is not configured; cannot generate questions from the document"
        )

    llm = ChatGroq(
        model=settings.GROQ_MODEL,
        api_key=settings.GROQ_API_KEY,
        temperature=0,
    )
    structured = llm.with_structured_output(_RawQuestionList)

    truncated = text[:_MAX_INPUT_CHARS]
    result = structured.invoke(
        [SystemMessage(_SYSTEM_PROMPT), HumanMessage(content=truncated)]
    )

    questions: list[tuple[str | None, Question]] = []
    for item in getattr(result, "questions", None) or []:
        try:
            questions.append((item.scenario, _build_question(item)))
        except Exception as exc:  # pragma: no cover - defensive
            logger.warning("Skipping invalid question from LLM: %s", exc)

    if not questions:
        raise ValueError(
            "The AI could not extract any valid questions from the document"
        )

    groups: list[tuple[str | None, list[Question]]] = []
    for scenario, question in questions:
        key = (scenario or "").strip() or None
        if groups and groups[-1][0] == key:
            groups[-1][1].append(question)
        else:
            groups.append((key, [question]))

    return TotalQuestions(
        questions=[
            SubQuestions(scenario=scenario, questions=group)
            for scenario, group in groups
        ]
    )


class ShortAnswerGrade(BaseModel):
    score: int = Field(ge=0)
    feedback: str


_SHORT_ANSWER_SYSTEM_PROMPT = """You are an examination grader. Grade the student's \
answer to a short-answer question against the provided model answer and any shared \
context.

Rules:
- Award an integer score from 0 up to the question's maximum points.
- Be fair and consistent: reward correct ideas, relevant detail, and clear \
reasoning even if wording differs from the model answer.
- Provide a brief, constructive feedback string explaining the score.
- Return ONLY the structured grade (score and feedback).
"""


def grade_short_answer(
    question: ShortAnswerQuestion,
    student_answer: str,
    max_points: float = 1.0,
    scenario: str | None = None,
) -> ShortAnswerGrade:
    if not settings.GROQ_API_KEY:
        raise RuntimeError(
            "GROQ_API_KEY is not configured; cannot grade short answers with AI"
        )

    llm = ChatGroq(
        model=settings.GROQ_MODEL,
        api_key=settings.GROQ_API_KEY,
        temperature=0,
    )
    structured = llm.with_structured_output(ShortAnswerGrade)

    prompt = (
        f"Maximum points: {max_points}\n"
        f"Question: {question.question}\n"
        f"Model answer: {question.correct_answer}\n"
        f"Shared context: {scenario or '(none)'}\n"
        f"Student answer: {student_answer or '(blank)'}\n"
    )

    result = structured.invoke(
        [SystemMessage(_SHORT_ANSWER_SYSTEM_PROMPT), HumanMessage(content=prompt)]
    )
    if result.score > max_points:
        result = ShortAnswerGrade(score=max_points, feedback=result.feedback)
    return result