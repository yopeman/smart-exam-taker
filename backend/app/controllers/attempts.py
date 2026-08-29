from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import AttemptStatus, Exam, ExamAttempt, ExamStatus, User, UserRole
from app.schemas.attempt import StartAttemptRequest, UpdateAttemptScoresRequest
from app.services import face
from app.services.grading_queue import enqueue_attempt_grading


def get_exam_by_code(code: str, db: Session) -> Exam:
    exam = db.scalar(select(Exam).where(Exam.code == code))
    if exam is None or exam.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found"
        )
    return exam


def start_attempt(
    payload: StartAttemptRequest,
    face_filename: str | None,
    face_content: bytes,
    user: User,
    db: Session,
) -> ExamAttempt:
    if user.role != UserRole.student:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can start an exam attempt",
        )

    exam = get_exam_by_code(payload.exam_code, db)

    if exam.status != ExamStatus.started:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This exam is not currently open for attempts",
        )

    if not exam.questions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This exam has no questions yet",
        )

    capacity = (exam.max_students or 0) + (exam.max_reserved_students or 0)
    if capacity > 0:
        students_count = db.scalar(
            select(func.count(func.distinct(ExamAttempt.student_id)))
            .select_from(ExamAttempt)
            .where(
                ExamAttempt.exam_id == exam.id,
                ExamAttempt.deleted_at.is_(None),
            )
        )
        if students_count is not None and students_count >= capacity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This exam has reached its maximum number of students",
            )

    if face_content:
        student_face_url = face.encode_image_data_url(face_filename, face_content)
        face_captured_at = datetime.now(timezone.utc)
    else:
        student_face_url = None
        face_captured_at = None

    attempt = ExamAttempt(
        exam_id=exam.id,
        student_id=user.id,
        student_first_name=payload.student_first_name,
        student_last_name=payload.student_last_name,
        student_id_number=payload.student_id_number,
        student_face_url=student_face_url,
        face_captured_at=face_captured_at,
        department=payload.department if payload.department is not None else exam.department,
        year_of_study=payload.year_of_study
        if payload.year_of_study is not None
        else exam.year_of_study,
        semester=payload.semester if payload.semester is not None else exam.semester,
        section=payload.section if payload.section is not None else exam.section,
        answers={},
        status=AttemptStatus.in_progress,
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    return attempt


def submit_attempt(
    attempt_id: str, answers: dict, user: User, db: Session
) -> ExamAttempt:
    attempt = db.get(ExamAttempt, attempt_id)
    if attempt is None or attempt.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Exam attempt not found"
        )

    if user.role != UserRole.student or attempt.student_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to submit this attempt",
        )

    if attempt.status not in (AttemptStatus.in_progress, AttemptStatus.submitted):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot submit an attempt in '{attempt.status.value}' status",
        )

    attempt.answers = answers
    attempt.submitted_at = datetime.now(timezone.utc)
    attempt.status = AttemptStatus.submitted
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    enqueue_attempt_grading(attempt.id)
    return attempt


def update_attempt_scores(
    attempt_id: str, payload: UpdateAttemptScoresRequest, user: User, db: Session
) -> ExamAttempt:
    from app.controllers.exams import get_exam, require_exam_manager

    attempt = db.get(ExamAttempt, attempt_id)
    if attempt is None or attempt.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Exam attempt not found"
        )

    if user.role != UserRole.instructor:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only instructors can adjust attempt scores",
        )

    exam = get_exam(attempt.exam_id, db)
    require_exam_manager(exam, user, db)

    if payload.grading_details is not None:
        attempt.grading_details = payload.grading_details
    if payload.objective_score is not None:
        attempt.objective_score = payload.objective_score
    if payload.ai_score is not None:
        attempt.ai_score = payload.ai_score
    if payload.total_score is not None:
        attempt.total_score = payload.total_score

    attempt.updated_at = datetime.now(timezone.utc)
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    return attempt


def get_attempt(attempt_id: str, user: User, db: Session) -> ExamAttempt:
    attempt = db.get(ExamAttempt, attempt_id)
    if attempt is None or attempt.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Exam attempt not found"
        )

    if user.role == UserRole.student:
        if attempt.student_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not allowed to view this attempt",
            )
    elif user.role == UserRole.instructor:
        from app.controllers.exams import get_exam, require_exam_manager

        exam = get_exam(attempt.exam_id, db)
        require_exam_manager(exam, user, db)
    return attempt


def list_exam_attempts(exam_id: str, user: User, db: Session) -> list:
    exam = db.get(Exam, exam_id)
    if exam is None or exam.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found"
        )
    stmt = (
        select(ExamAttempt)
        .where(ExamAttempt.exam_id == exam_id, ExamAttempt.deleted_at.is_(None))
        .order_by(ExamAttempt.created_at.desc())
    )
    return list(db.scalars(stmt))


def list_my_attempts(user: User, db: Session) -> list:
    if user.role != UserRole.student:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can view their attempts",
        )
    stmt = (
        select(ExamAttempt)
        .where(
            ExamAttempt.student_id == user.id,
            ExamAttempt.deleted_at.is_(None),
        )
        .order_by(ExamAttempt.created_at.desc())
    )
    return list(db.scalars(stmt))


def list_reachable_attempts(user: User, db: Session) -> list:
    from app.controllers.exams import list_reachable_exams

    exams = list_reachable_exams(user, db)
    exam_ids = [exam.id for exam in exams]
    if not exam_ids:
        return []
    stmt = (
        select(ExamAttempt)
        .where(
            ExamAttempt.exam_id.in_(exam_ids),
            ExamAttempt.deleted_at.is_(None),
        )
        .order_by(ExamAttempt.created_at.desc())
    )
    return list(db.scalars(stmt))
