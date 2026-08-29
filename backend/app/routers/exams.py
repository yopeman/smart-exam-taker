import uuid
from datetime import datetime, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import Exam, ExamStatus, InstructorInvitation, InvitationStatus, School, User
from app.schemas.exam import ExamResponse, ExamUpdateRequest, ScheduleRequest, questions_adapter
from app.schemas.user import MessageResponse
from app.services import ai, document

router = APIRouter(prefix="/exams", tags=["exams"])


def _require_school_manager(school: School, user: User, db: Session) -> None:
    if school.owner_id == user.id:
        return
    invitation = db.scalar(
        select(InstructorInvitation).where(
            InstructorInvitation.school_id == school.id,
            InstructorInvitation.instructor_email == user.email,
            InstructorInvitation.status == InvitationStatus.accepted,
            InstructorInvitation.deleted_at.is_(None),
        )
    )
    if invitation is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to manage exams for this school",
        )


def _get_school(school_id: str, user: User, db: Session) -> School:
    school = db.get(School, school_id)
    if school is None or school.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="School not found"
        )
    _require_school_manager(school, user, db)
    return school


def _get_exam(exam_id: str, db: Session) -> Exam:
    exam = db.get(Exam, exam_id)
    if exam is None or exam.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found"
        )
    return exam


def _require_exam_manager(exam: Exam, user: User, db: Session) -> None:
    school = db.get(School, exam.school_id)
    if school is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found"
        )
    _require_school_manager(school, user, db)


def _generate_code() -> str:
    return "EXM-" + uuid.uuid4().hex[:8].upper()


@router.post(
    "/schools/{school_id}",
    response_model=ExamResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_exam(
    school_id: str,
    file: UploadFile | None = File(default=None),
    title: str = Form(..., min_length=1, max_length=255),
    description: str | None = Form(default=None, max_length=2000),
    department: str | None = Form(default=None, max_length=150),
    year_of_study: int | None = Form(default=None, ge=1),
    semester: str | None = Form(default=None, max_length=50),
    section: str | None = Form(default=None, max_length=50),
    duration_minutes: int = Form(default=60, ge=1),
    max_students: int | None = Form(default=None, ge=0),
    max_reserved_students: int | None = Form(default=None, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    school = _get_school(school_id, current_user, db)

    if file is None or file.filename is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A document is required to create an exam",
        )

    content = file.file.read()
    try:
        text = document.extract_document_text(file.filename, content)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        )

    try:
        questions = ai.generate_questions(text)
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to generate questions: {exc}",
        )

    exam = Exam(
        school_id=school.id,
        instructor_id=current_user.id,
        code=_generate_code(),
        title=title,
        description=description,
        department=department,
        year_of_study=year_of_study,
        semester=semester,
        section=section,
        document_content=text,
        questions=[q.model_dump() for q in questions],
        duration_minutes=duration_minutes,
        max_students=max_students,
        max_reserved_students=max_reserved_students,
        status=ExamStatus.draft,
    )
    db.add(exam)
    db.commit()
    db.refresh(exam)
    return exam


@router.get("/schools/{school_id}", response_model=list[ExamResponse])
def list_school_exams(
    school_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_school(school_id, current_user, db)
    stmt = (
        select(Exam)
        .where(Exam.school_id == school_id, Exam.deleted_at.is_(None))
        .order_by(Exam.created_at.desc())
    )
    return list(db.scalars(stmt))


@router.get("/me", response_model=list[ExamResponse])
def my_exams(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    stmt = (
        select(Exam)
        .where(
            Exam.instructor_id == current_user.id, Exam.deleted_at.is_(None)
        )
        .order_by(Exam.created_at.desc())
    )
    return list(db.scalars(stmt))


@router.get("/{exam_id}", response_model=ExamResponse)
def get_exam(
    exam_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    exam = _get_exam(exam_id, db)
    _require_exam_manager(exam, current_user, db)
    return exam


@router.patch("/{exam_id}", response_model=ExamResponse)
def update_exam(
    exam_id: str,
    payload: ExamUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    exam = _get_exam(exam_id, db)
    _require_exam_manager(exam, current_user, db)

    if exam.status not in (ExamStatus.draft, ExamStatus.submitted):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only draft or submitted exams can be edited",
        )

    if payload.title is not None:
        exam.title = payload.title
    if payload.description is not None:
        exam.description = payload.description
    if payload.department is not None:
        exam.department = payload.department
    if payload.year_of_study is not None:
        exam.year_of_study = payload.year_of_study
    if payload.semester is not None:
        exam.semester = payload.semester
    if payload.section is not None:
        exam.section = payload.section
    if payload.duration_minutes is not None:
        exam.duration_minutes = payload.duration_minutes
    if payload.max_students is not None:
        exam.max_students = payload.max_students
    if payload.max_reserved_students is not None:
        exam.max_reserved_students = payload.max_reserved_students
    if payload.questions is not None:
        try:
            exam.questions = [
                q.model_dump() for q in questions_adapter.validate_python(payload.questions)
            ]
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid questions payload: {exc}",
            )

    db.add(exam)
    db.commit()
    db.refresh(exam)
    return exam


@router.post("/{exam_id}/submit", response_model=ExamResponse)
def submit_exam(
    exam_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    exam = _get_exam(exam_id, db)
    _require_exam_manager(exam, current_user, db)
    if not exam.questions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot submit an exam without questions",
        )
    if exam.status != ExamStatus.draft:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot submit an exam in '{exam.status.value}' status",
        )
    exam.status = ExamStatus.submitted
    db.add(exam)
    db.commit()
    db.refresh(exam)
    return exam


@router.post("/{exam_id}/schedule", response_model=ExamResponse)
def schedule_exam(
    exam_id: str,
    payload: ScheduleRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    exam = _get_exam(exam_id, db)
    _require_exam_manager(exam, current_user, db)

    if exam.status in (ExamStatus.started, ExamStatus.completed, ExamStatus.cancelled):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot schedule an exam in '{exam.status.value}' status",
        )

    dt = payload.scheduled_at
    try:
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=ZoneInfo(payload.timezone))
        scheduled_at = dt.astimezone(timezone.utc)
    except (ZoneInfoNotFoundError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid timezone: {payload.timezone}",
        )

    if scheduled_at <= datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="scheduled_at must be in the future",
        )

    exam.scheduled_at = scheduled_at
    exam.status = ExamStatus.scheduled
    db.add(exam)
    db.commit()
    db.refresh(exam)
    return exam


@router.post("/{exam_id}/start", response_model=ExamResponse)
def start_exam(
    exam_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    exam = _get_exam(exam_id, db)
    _require_exam_manager(exam, current_user, db)

    if exam.status in (ExamStatus.completed, ExamStatus.cancelled):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot start an exam in '{exam.status.value}' status",
        )

    exam.status = ExamStatus.started
    exam.started_at = datetime.now(timezone.utc)
    exam.started_by = current_user.id
    db.add(exam)
    db.commit()
    db.refresh(exam)
    return exam


@router.post("/{exam_id}/complete", response_model=ExamResponse)
def complete_exam(
    exam_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    exam = _get_exam(exam_id, db)
    _require_exam_manager(exam, current_user, db)

    if exam.status != ExamStatus.started:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only a started exam can be completed",
        )
    exam.status = ExamStatus.completed
    exam.completed_at = datetime.now(timezone.utc)
    db.add(exam)
    db.commit()
    db.refresh(exam)
    return exam


@router.post("/{exam_id}/cancel", response_model=ExamResponse)
def cancel_exam(
    exam_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    exam = _get_exam(exam_id, db)
    _require_exam_manager(exam, current_user, db)

    if exam.status == ExamStatus.completed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A completed exam cannot be canceled",
        )
    if exam.status == ExamStatus.cancelled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Exam is already canceled",
        )

    exam.status = ExamStatus.cancelled
    exam.cancelled_at = datetime.now(timezone.utc)
    db.add(exam)
    db.commit()
    db.refresh(exam)
    return exam


@router.delete("/{exam_id}", response_model=MessageResponse)
def delete_exam(
    exam_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    exam = _get_exam(exam_id, db)
    _require_exam_manager(exam, current_user, db)
    exam.deleted_at = datetime.now(timezone.utc)
    db.add(exam)
    db.commit()
    return MessageResponse(message="Exam deleted successfully")
