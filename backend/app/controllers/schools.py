from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import InstructorInvitation, InvitationStatus, School, User
from app.schemas.school import (
    MessageResponse,
    SchoolResponse,
    SchoolUpdateRequest,
)


def get_owned_school(school_id: str, user: User, db: Session) -> School:
    school = db.get(School, school_id)
    if school is None or school.is_deleted or school.owner_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found",
        )
    return school


def create_school(
    user: User,
    db: Session,
    name: str,
    location: str | None,
    logo_url: str | None,
    primary_color: str | None,
    secondary_color: str | None,
) -> School:
    school = School(
        owner_id=user.id,
        name=name,
        location=location,
        logo_url=logo_url,
        primary_color=primary_color,
        secondary_color=secondary_color,
    )
    db.add(school)
    db.commit()
    db.refresh(school)
    return school


def list_schools(user: User, db: Session) -> list[School]:
    stmt = select(School).where(
        School.owner_id == user.id,
        School.deleted_at.is_(None),
    )
    return list(db.scalars(stmt))


def list_shared_schools(user: User, db: Session) -> list[School]:
    stmt = (
        select(School)
        .join(
            InstructorInvitation,
            InstructorInvitation.school_id == School.id,
        )
        .where(
            InstructorInvitation.instructor_email == user.email,
            InstructorInvitation.status == InvitationStatus.accepted,
            InstructorInvitation.deleted_at.is_(None),
            School.deleted_at.is_(None),
        )
    )
    return list(db.scalars(stmt))


def get_school(school_id: str, user: User, db: Session) -> School:
    return get_owned_school(school_id, user, db)


def update_school(
    school_id: str,
    payload: SchoolUpdateRequest,
    user: User,
    db: Session,
) -> School:
    school = get_owned_school(school_id, user, db)

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


def delete_school(school_id: str, user: User, db: Session) -> MessageResponse:
    school = get_owned_school(school_id, user, db)
    school.deleted_at = datetime.now(timezone.utc)
    db.add(school)
    db.commit()
    return MessageResponse(message="School deleted successfully")
