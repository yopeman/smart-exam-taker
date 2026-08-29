from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session

from app.controllers import attempts as attempts_controller
from app.controllers.exams import get_exam, require_exam_manager
from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User
from app.schemas.attempt import (
    AttemptResponse,
    StartAttemptRequest,
    SubmitAttemptRequest,
)

router = APIRouter(prefix="/attempts", tags=["attempts"])


@router.post("/start", response_model=AttemptResponse, status_code=201)
def start_attempt(
    exam_code: str = Form(..., min_length=1, max_length=32),
    student_first_name: str = Form(..., min_length=1, max_length=150),
    student_last_name: str = Form(..., min_length=1, max_length=150),
    student_id_number: str = Form(..., min_length=1, max_length=100),
    department: str | None = Form(default=None, max_length=150),
    year_of_study: int | None = Form(default=None, ge=1),
    semester: str | None = Form(default=None, max_length=50),
    section: str | None = Form(default=None, max_length=50),
    face: UploadFile | None = File(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    filename = face.filename if face is not None else None
    content = b""
    if face is not None and face.filename is not None:
        content = face.file.read()
    return attempts_controller.start_attempt(
        StartAttemptRequest(
            exam_code=exam_code,
            student_first_name=student_first_name,
            student_last_name=student_last_name,
            student_id_number=student_id_number,
            department=department,
            year_of_study=year_of_study,
            semester=semester,
            section=section,
        ),
        filename,
        content,
        current_user,
        db,
    )


@router.post("/{attempt_id}/submit", response_model=AttemptResponse)
def submit_attempt(
    attempt_id: str,
    payload: SubmitAttemptRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return attempts_controller.submit_attempt(
        attempt_id, payload.answers, current_user, db
    )


@router.get("/{attempt_id}", response_model=AttemptResponse)
def get_attempt(
    attempt_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return attempts_controller.get_attempt(attempt_id, current_user, db)


@router.get("/exams/{exam_id}", response_model=list[AttemptResponse])
def list_exam_attempts(
    exam_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    exam = get_exam(exam_id, db)
    require_exam_manager(exam, current_user, db)
    return attempts_controller.list_exam_attempts(exam_id, current_user, db)
