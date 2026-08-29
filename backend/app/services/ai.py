import logging

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_groq import ChatGroq

from app.core.config import settings
from app.schemas.question import (
    EssayQuestion,
    Question,
    QuestionList,
    RawQuestion,
    to_question,
)
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class _RawQuestionList(BaseModel):
    questions: list[RawQuestion]

_SYSTEM_PROMPT = """You are an examination authoring assistant. Convert the \
provided document text into a structured list of exam questions.

Supported question types and the fields each requires:
- mcq: "prompt", "options" (list of {text, is_correct}), and "multiple_correct" \
(whether more than one option may be correct). Include at least 2 options and mark \
the correct one(s) with is_correct=true.
- true_false: "prompt" and "correct_answer" (true/false).
- matching: "prompt" and "pairs" (list of {left, right} that must be matched).
- fill_blank: "prompt" (optionally a "text" passage with blanks), and "blanks" \
(a list, one entry per blank, each with "answers" listing acceptable answers).
- essay: "prompt" and a "model_answer" plus an optional "rubric" describing how to grade.

Rules:
- Always include the correct answer/key for every question so it can be auto-graded.
- For essay/short-answer questions, include a "model_answer" and a short "rubric".
- Assign a sensible "points" value (default 1) per question.
- Only output questions that are clearly supported by the document. Do not invent facts.
- Return every question as an object with a "type" field from the allowed set.
"""

_MAX_INPUT_CHARS = 30000


def generate_questions(text: str) -> QuestionList:
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

    questions: list[Question] = []
    for item in getattr(result, "questions", None) or []:
        try:
            questions.append(to_question(item))
        except Exception as exc:  # pragma: no cover - defensive
            logger.warning("Skipping invalid question from LLM: %s", exc)
    if not questions:
        raise ValueError(
            "The AI could not extract any valid questions from the document"
        )
    return questions


class EssayGrade(BaseModel):
    score: int = Field(ge=0)
    feedback: str


_ESSAY_SYSTEM_PROMPT = """You are an examination grader. Grade the student's \
answer to a short-answer/essay question against the provided model answer and \
rubric.

Rules:
- Award an integer score from 0 up to the question's maximum points.
- Be fair and consistent: reward correct ideas, relevant detail, and clear \
reasoning even if wording differs from the model answer.
- Provide a brief, constructive feedback string explaining the score.
- Return ONLY the structured grade (score and feedback).
"""


def grade_essay(question: EssayQuestion, student_answer: str) -> EssayGrade:
    if not settings.GROQ_API_KEY:
        raise RuntimeError(
            "GROQ_API_KEY is not configured; cannot grade essay answers with AI"
        )

    llm = ChatGroq(
        model=settings.GROQ_MODEL,
        api_key=settings.GROQ_API_KEY,
        temperature=0,
    )
    structured = llm.with_structured_output(EssayGrade)

    max_points = question.points
    prompt = (
        f"Maximum points: {max_points}\n"
        f"Question: {question.prompt}\n"
        f"Model answer: {question.model_answer or '(not provided)'}\n"
        f"Rubric: {question.rubric or '(not provided)'}\n"
        f"Student answer: {student_answer or '(blank)'}\n"
    )

    result = structured.invoke(
        [SystemMessage(_ESSAY_SYSTEM_PROMPT), HumanMessage(content=prompt)]
    )
    grade = result
    if grade.score > max_points:
        grade = EssayGrade(score=max_points, feedback=grade.feedback)
    return grade
