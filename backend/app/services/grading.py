import logging
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models import AttemptStatus, Exam, ExamAttempt
from app.schemas.question import (
    BlankSpaceQuestion,
    Correctness,
    MCQQuestion,
    MatchingQuestion,
    Question,
    ShortAnswerQuestion,
    TotalQuestions,
    TrueFalseQuestion,
    flatten_questions,
)
from app.services import ai

logger = logging.getLogger(__name__)


def _normalize(value: str) -> str:
    return value.strip().lower()


def _grade_mcq(
    question: MCQQuestion, answer: object, point: float
) -> tuple[float, Correctness, str | None]:
    if not isinstance(answer, str):
        return 0.0, Correctness.incorrect, None
    selected = answer.strip().upper()
    if selected == question.correct_answer.upper():
        return point, Correctness.correct, None
    return 0.0, Correctness.incorrect, None


def _grade_true_false(
    question: TrueFalseQuestion, answer: object, point: float
) -> tuple[float, Correctness, str | None]:
    if isinstance(answer, bool) and answer == question.correct_answer:
        return point, Correctness.correct, None
    return 0.0, Correctness.incorrect, None


def _grade_matching(
    question: MatchingQuestion, answer: object, point: float
) -> tuple[float, Correctness, str | None]:
    if not isinstance(answer, dict):
        return 0.0, Correctness.incorrect, None

    left_keys = [int(k) for k in answer.keys()]
    if set(left_keys) != set(range(len(question.left_items))):
        return 0.0, Correctness.incorrect, None

    correct = 0
    for left_idx, right_idx in answer.items():
        expected = question.correct_mapping.get(int(left_idx))
        given = int(right_idx)
        if expected == given:
            correct += 1

    ratio = correct / len(question.left_items) if question.left_items else 0.0
    score = point * ratio
    if ratio >= 1.0:
        correctness = Correctness.correct
    elif ratio > 0.0:
        correctness = Correctness.partial
    else:
        correctness = Correctness.incorrect
    feedback = None if correctness == Correctness.correct else "Partial credit awarded."
    return score, correctness, feedback


def _grade_blank_space(
    question: BlankSpaceQuestion, answer: object, point: float
) -> tuple[float, Correctness, str | None]:
    if not isinstance(answer, list) or len(answer) != len(question.correct_answers):
        return 0.0, Correctness.incorrect, None

    correct = 0
    for expected, given in zip(question.correct_answers, answer):
        if _normalize(str(given)) == _normalize(expected):
            correct += 1

    ratio = correct / len(question.correct_answers)
    score = point * ratio
    if ratio >= 1.0:
        correctness = Correctness.correct
    elif ratio > 0.0:
        correctness = Correctness.partial
    else:
        correctness = Correctness.incorrect
    feedback = None if correctness == Correctness.correct else "Partial credit awarded."
    return score, correctness, feedback


def _grade_short_answer(
    question: ShortAnswerQuestion,
    answer: object,
    point: float,
    scenario: str | None,
) -> tuple[float, Correctness, str | None]:
    try:
        grade = ai.grade_short_answer(
            question,
            str(answer or ""),
            max_points=point,
            scenario=scenario,
        )
        score = float(grade.score)
        if score <= 0:
            correctness = Correctness.incorrect
        elif score >= point * 0.99:
            correctness = Correctness.correct
        else:
            correctness = Correctness.partial
        return score, correctness, grade.feedback
    except Exception as exc:  # pragma: no cover - defensive
        logger.exception("AI short-answer grading failed: %s", exc)
        return 0.0, Correctness.incorrect, "AI grading failed; manual review required."


def _objective_grade(
    question: Question, answer: object
) -> tuple[float, Correctness, str | None]:
    inner = question.question
    if isinstance(inner, MCQQuestion):
        return _grade_mcq(inner, answer, question.point)
    if isinstance(inner, TrueFalseQuestion):
        return _grade_true_false(inner, answer, question.point)
    if isinstance(inner, MatchingQuestion):
        return _grade_matching(inner, answer, question.point)
    if isinstance(inner, BlankSpaceQuestion):
        return _grade_blank_space(inner, answer, question.point)
    return 0.0, Correctness.incorrect, None


def grade_attempt(attempt_id: str, db: Session | None = None) -> ExamAttempt | None:
    own_db = db is None
    if own_db:
        from app.core.database import SessionLocal

        db = SessionLocal()

    attempt = db.get(ExamAttempt, attempt_id)
    try:
        if attempt is None or attempt.is_deleted:
            return None
        if attempt.status not in (AttemptStatus.submitted, AttemptStatus.processing):
            return attempt

        attempt.status = AttemptStatus.processing
        db.add(attempt)
        db.commit()

        exam = db.get(Exam, attempt.exam_id)
        if exam is None or not exam.questions:
            attempt.status = AttemptStatus.graded
            attempt.graded_at = datetime.now(timezone.utc)
            db.add(attempt)
            db.commit()
            return attempt

        try:
            total = TotalQuestions(**exam.questions)
        except Exception as exc:  # pragma: no cover - defensive
            logger.warning("Invalid stored question payload: %s", exc)
            attempt.status = AttemptStatus.graded
            attempt.graded_at = datetime.now(timezone.utc)
            db.add(attempt)
            db.commit()
            return attempt

        scenario_by_id: dict[str, str | None] = {}
        for group in total.questions:
            for q in group.questions:
                scenario_by_id[q.id] = group.scenario

        answers = attempt.answers or {}
        grading_details: list[dict] = []
        objective_score = 0.0
        ai_score = 0.0

        for question in flatten_questions(total):
            key = question.id
            answer = answers.get(key)
            scenario = scenario_by_id.get(key)
            detail: dict = {
                "question_id": key,
                "type": question.question.type.value,
                "point": question.point,
                "answer": answer,
            }

            if isinstance(question.question, ShortAnswerQuestion):
                score, correctness, feedback = _grade_short_answer(
                    question.question, answer, question.point, scenario
                )
                detail["correctness"] = correctness.value
                detail["score"] = round(score, 2)
                detail["feedback"] = feedback
                ai_score += score
            else:
                score, correctness, feedback = _objective_grade(question, answer)
                detail["correctness"] = correctness.value
                detail["score"] = round(score, 2)
                detail["feedback"] = feedback
                objective_score += score

            grading_details.append(detail)

        attempt.grading_details = grading_details
        attempt.objective_score = round(objective_score, 2)
        attempt.ai_score = round(ai_score, 2)
        attempt.total_score = round(objective_score + ai_score, 2)
        attempt.graded_at = datetime.now(timezone.utc)
        attempt.status = AttemptStatus.graded
        db.add(attempt)
        db.commit()
        db.refresh(attempt)
        return attempt
    finally:
        if own_db:
            db.close()