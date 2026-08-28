import base64
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import School, User
from app.schemas.school import (
    MessageResponse,
    SchoolResponse,
    SchoolUpdateRequest,
)

_ALLOWED_LOGO_TYPES = {
    "image/png": "png",
    "image/jpeg": "jpeg",
    "image/jpg": "jpg",
    "image/gif": "gif",
    "image/webp": "webp",
}
_MAX_LOGO_BYTES = 5 * 1024 * 1024

router = APIRouter(prefix="/schools", tags=["schools"])


def _resolve_logo_url(
    logo_url: str | None, logo: UploadFile | None
) -> str | None:
    if logo is not None and logo.filename:
        if logo.content_type not in _ALLOWED_LOGO_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Logo must be a PNG, JPEG, GIF, or WEBP image",
            )
        data = logo.file.read()
        if len(data) > _MAX_LOGO_BYTES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Logo image must be 5 MB or smaller",
            )
        encoded = base64.b64encode(data).decode("utf-8")
        return f"data:{logo.content_type};base64,{encoded}"

    if logo_url:
        return logo_url

    return None


def _get_owned_school(school_id: str, user: User, db: Session) -> School:
    school = db.get(School, school_id)
    if school is None or school.is_deleted or school.owner_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found",
        )
    return school


@router.post("", response_model=SchoolResponse, status_code=status.HTTP_201_CREATED)
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
    school = School(
        owner_id=current_user.id,
        name=name,
        location=location,
        logo_url=resolved_logo,
        primary_color=primary_color,
        secondary_color=secondary_color,
    )
    db.add(school)
    db.commit()
    db.refresh(school)
    return school



@router.get("", response_model=list[SchoolResponse])
def list_schools(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    stmt = select(School).where(
        School.owner_id == current_user.id,
        School.deleted_at.is_(None),
    )
    return list(db.scalars(stmt))


@router.get("/{school_id}", response_model=SchoolResponse)
def get_school(
    school_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _get_owned_school(school_id, current_user, db)


@router.patch("/{school_id}", response_model=SchoolResponse)
def update_school(
    school_id: str,
    payload: SchoolUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    school = _get_owned_school(school_id, current_user, db)

    if payload.name is not None:
        school.name = payload.name
    if payload.location is not None:
        school.location = payload.location
    if payload.logo_url is not None:
        school.logo_url = str(payload.logo_url)
    if payload.primary_color is not None:
        school.primary_color = payload.primary_color
    if payload.secondary_color is not None:
        school.secondary_color = payload.secondary_color

    db.add(school)
    db.commit()
    db.refresh(school)
    return school


@router.delete("/{school_id}", response_model=MessageResponse)
def delete_school(
    school_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    school = _get_owned_school(school_id, current_user, db)
    school.deleted_at = datetime.now(timezone.utc)
    db.add(school)
    db.commit()
    return MessageResponse(message="School deleted successfully")
