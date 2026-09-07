import base64

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session

from app.controllers import schools as schools_controller
from app.core.database import get_db
from app.core.security import get_current_user, require_instructor
from app.models import User
from app.schemas.school import (
    MessageResponse,
    SchoolResponse,
)

router = APIRouter(prefix="/schools", tags=["schools"])

_ALLOWED_LOGO_TYPES = {
    "image/png": "png",
    "image/jpeg": "jpeg",
    "image/jpg": "jpg",
    "image/gif": "gif",
    "image/webp": "webp",
}
_MAX_LOGO_BYTES = 5 * 1024 * 1024


def _resolve_logo_url(logo_url: str | None, logo: UploadFile | None) -> str | None:
    if logo is not None and logo.filename:
        if logo.content_type not in _ALLOWED_LOGO_TYPES:
            from fastapi import HTTPException, status

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Logo must be a PNG, JPEG, GIF, or WEBP image",
            )
        data = logo.file.read()
        if len(data) > _MAX_LOGO_BYTES:
            from fastapi import HTTPException, status

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Logo image must be 5 MB or smaller",
            )
        encoded = base64.b64encode(data).decode("utf-8")
        return f"data:{logo.content_type};base64,{encoded}"

    if logo_url:
        return logo_url

    return None


@router.post("", response_model=SchoolResponse, status_code=201)
def create_school(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    name: str = Form(..., min_length=1, max_length=150),
    location: str | None = Form(default=None, max_length=255),
    logo_url: str | None = Form(default=None),
    primary_color: str | None = Form(default=None, max_length=7),
    secondary_color: str | None = Form(default=None, max_length=7),
    logo: UploadFile | None = File(default=None),
):
    resolved_logo = _resolve_logo_url(logo_url, logo)
    return schools_controller.create_school(
        current_user,
        db,
        name,
        location,
        resolved_logo,
        primary_color,
        secondary_color,
    )


@router.get("", response_model=list[SchoolResponse])
def list_schools(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return schools_controller.list_schools(current_user, db)


@router.get("/shared", response_model=list[SchoolResponse])
def list_shared_schools(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_instructor(current_user)
    return schools_controller.list_shared_schools(current_user, db)


@router.get("/{school_id}", response_model=SchoolResponse)
def get_school(
    school_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return schools_controller.get_school(school_id, current_user, db)


@router.patch("/{school_id}", response_model=SchoolResponse)
def update_school(
    school_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    name: str | None = Form(default=None, min_length=1, max_length=150),
    location: str | None = Form(default=None, max_length=255),
    logo_url: str | None = Form(default=None),
    primary_color: str | None = Form(default=None, max_length=7),
    secondary_color: str | None = Form(default=None, max_length=7),
    logo: UploadFile | None = File(default=None),
):
    resolved_logo = _resolve_logo_url(logo_url, logo)
    return schools_controller.update_school(
        school_id,
        current_user,
        db,
        name,
        location,
        resolved_logo,
        primary_color,
        secondary_color,
    )


@router.delete("/{school_id}", response_model=MessageResponse)
def delete_school(
    school_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return schools_controller.delete_school(school_id, current_user, db)
