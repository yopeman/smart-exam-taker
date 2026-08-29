from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session

from app.controllers import exams as exams_controller
from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User
from app.schemas.exam import ExamResponse, ExamUpdateRequest, ScheduleRequest
from app.schemas.user import MessageResponse

router = APIRouter(prefix="/exams", tags=["exams"])


@router.post(
    "/schools/{school_id}",
    response_model=ExamResponse,
    status_code=201,
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
    filename = file.filename if file is not None else None
    content = b""
    if file is not None and file.filename is not None:
        content = file.file.read()
    return exams_controller.create_exam(
        school_id,
        current_user,
        db,
        filename,
        content,
        title,
        description,
        department,
        year_of_study,
        semester,
        section,
        duration_minutes,
        max_students,
        max_reserved_students,
    )


@router.get("/schools/{school_id}", response_model=list[ExamResponse])
def list_school_exams(
    school_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return exams_controller.list_school_exams(school_id, current_user, db)


@router.get("/me", response_model=list[ExamResponse])
def my_exams(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return exams_controller.my_exams(current_user, db)


@router.get("/{exam_id}", response_model=ExamResponse)
def get_exam(
    exam_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return exams_controller.get_exam_detail(exam_id, current_user, db)


@router.patch("/{exam_id}", response_model=ExamResponse)
def update_exam(
    exam_id: str,
    payload: ExamUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return exams_controller.update_exam(exam_id, payload, current_user, db)


@router.post("/{exam_id}/submit", response_model=ExamResponse)
def submit_exam(
    exam_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return exams_controller.submit_exam(exam_id, current_user, db)


@router.post("/{exam_id}/schedule", response_model=ExamResponse)
def schedule_exam(
    exam_id: str,
    payload: ScheduleRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return exams_controller.schedule_exam(exam_id, payload, current_user, db)


@router.post("/{exam_id}/start", response_model=ExamResponse)
def start_exam(
    exam_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return exams_controller.start_exam(exam_id, current_user, db)


@router.post("/{exam_id}/complete", response_model=ExamResponse)
def complete_exam(
    exam_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return exams_controller.complete_exam(exam_id, current_user, db)


@router.post("/{exam_id}/cancel", response_model=ExamResponse)
def cancel_exam(
    exam_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return exams_controller.cancel_exam(exam_id, current_user, db)


@router.delete("/{exam_id}", response_model=MessageResponse)
def delete_exam(
    exam_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return exams_controller.delete_exam(exam_id, current_user, db)
