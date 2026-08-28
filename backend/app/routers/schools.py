from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import School, User
from app.schemas.school import (
    MessageResponse,
    SchoolCreateRequest,
    SchoolResponse,
    SchoolUpdateRequest,
)

router = APIRouter(prefix="/schools", tags=["schools"])


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
    payload: SchoolCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    school = School(
        owner_id=current_user.id,
        name=payload.name,
        location=payload.location,
        logo_url=str(payload.logo_url) if payload.logo_url else None,
        primary_color=payload.primary_color,
        secondary_color=payload.secondary_color,
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
