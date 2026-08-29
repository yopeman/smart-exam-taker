import logging
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models import AttemptStatus, Exam, ExamAttempt
from app.schemas.question import (
    EssayQuestion,
    FillBlankQuestion,
    MCQQuestion,
    MatchingQuestion,
    QuestionType,
    TrueFalseQuestion,
    to_question,
)
from app.services import ai

logger = logging.getLogger(__name__)


def _normalize(value: str) -> str:
    return value.strip().lower()


def _grade_mcq(question: MCQQuestion, answer: object) -> tuple[bool, float]:
    correct_indices = [
        i for i, opt in enumerate(question.options) if opt.is_correct
    ]
    selected = answer if isinstance(answer, list) else [answer]

    try:
        selected_indices = [int(s) for s in selected]
    except (TypeError, ValueError):
        return False, 0.0

    if question.multiple_correct:
        correct = set(selected_indices) == set(correct_indices)
    else:
        correct = len(selected_indices) == 1 and selected_indices[0] == correct_indices[0]
    return correct, float(question.points) if correct else 0.0


def _grade_true_false(question: TrueFalseQuestion, answer: object) -> tuple[bool, float]:
    correct = isinstance(answer, bool) and answer == question.correct_answer
    return correct, float(question.points) if correct else 0.0


def _grade_matching(question: MatchingQuestion, answer: object) -> tuple[bool, float]:
    if not isinstance(answer, list) or len(answer) != len(question.pairs):
        return False, 0.0
    correct = 0
    for expected, given in zip(question.pairs, answer):
        if _normalize(str(given)) == _normalize(expected.right):
            correct += 1
    ratio = correct / len(question.pairs) if question.pairs else 0.0
    return correct == len(question.pairs), float(question.points) * ratio


def _grade_fill_blank(question: FillBlankQuestion, answer: object) -> tuple[bool, float]:
    if not isinstance(answer, list) or len(answer) != len(question.blanks):
        return False, 0.0
    correct = 0
    for blank, given in zip(question.blanks, answer):
        acceptable = {_normalize(a) for a in blank.answers}
        if _normalize(str(given)) in acceptable:
            correct += 1
    ratio = correct / len(question.blanks) if question.blanks else 0.0
    return correct == len(question.blanks), float(question.points) * ratio


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

        questions = []
        for raw in exam.questions:
            try:
                questions.append(to_question(_raw_question(raw)))
            except Exception as exc:  # pragma: no cover - defensive
                logger.warning("Skipping invalid stored question: %s", exc)

        answers = attempt.answers or {}
        grading_details: list[dict] = []
        objective_score = 0.0
        ai_score = 0.0

        for index, question in enumerate(questions):
            key = str(index)
            answer = answers.get(key)
            detail: dict = {
                "index": index,
                "type": question.type.value,
                "points": question.points,
                "answer": answer,
            }

            if question.type in (
                QuestionType.mcq,
                QuestionType.true_false,
                QuestionType.matching,
                QuestionType.fill_blank,
            ):
                correct, score = _grade_objective(question, answer)
                detail["correct"] = correct
                detail["score"] = round(score, 2)
                objective_score += score
            elif question.type == QuestionType.essay:
                score, feedback = _grade_essay(question, answer)
                detail["score"] = round(score, 2)
                detail["feedback"] = feedback
                ai_score += score
            else:
                detail["score"] = 0.0

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


def _raw_question(raw: dict):
    from app.schemas.question import RawQuestion

    return RawQuestion(**raw)


def _grade_objective(question, answer) -> tuple[bool, float]:
    if question.type == QuestionType.mcq:
        return _grade_mcq(question, answer)
    if question.type == QuestionType.true_false:
        return _grade_true_false(question, answer)
    if question.type == QuestionType.matching:
        return _grade_matching(question, answer)
    if question.type == QuestionType.fill_blank:
        return _grade_fill_blank(question, answer)
    return False, 0.0


def _grade_essay(question: EssayQuestion, answer: object) -> tuple[float, str]:
    try:
        grade = ai.grade_essay(question, str(answer or ""))
        return float(grade.score), grade.feedback
    except Exception as exc:  # pragma: no cover - defensive
        logger.exception("AI essay grading failed: %s", exc)
        return 0.0, "AI grading failed; manual review required."
