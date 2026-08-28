from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import (
    INVITATION_EXPIRE_DAYS,
    InstructorInvitation,
    InvitationStatus,
    School,
    User,
    UserRole,
)
from app.schemas.instructor_invitation import (
    InvitationCreateRequest,
    InvitationResponse,
    InvitationUpdateRequest,
)
from app.schemas.user import MessageResponse
from app.services.email import send_invitation_email

router = APIRouter(prefix="/invitations", tags=["invitations"])


def _get_owned_school(school_id: str, user: User, db: Session) -> School:
    school = db.get(School, school_id)
    if school is None or school.is_deleted or school.owner_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found",
        )
    return school


def _get_invitation(invitation_id: str, db: Session) -> InstructorInvitation:
    invitation = db.get(InstructorInvitation, invitation_id)
    if invitation is None or invitation.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found",
        )
    return invitation


def _require_owner(invitation: InstructorInvitation, user: User, db: Session) -> School:
    school = _get_owned_school(invitation.school_id, user, db)
    return school


def _require_invitee(invitation: InstructorInvitation, user: User) -> None:
    if user.role == UserRole.admin:
        return
    if user.email != invitation.instructor_email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This invitation is not for your account",
        )


def _refresh_expiration(invitation: InstructorInvitation) -> None:
    invitation.invited_at = datetime.now(timezone.utc)
    invitation.expired_at = invitation.invited_at + timedelta(days=INVITATION_EXPIRE_DAYS)
    invitation.status = InvitationStatus.pending
    invitation.accepted_at = None
    invitation.rejected_at = None
    invitation.canceled_at = None


@router.post(
    "/schools/{school_id}",
    response_model=InvitationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_invitation(
    school_id: str,
    payload: InvitationCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    school = _get_owned_school(school_id, current_user, db)

    invitation = InstructorInvitation(
        school_id=school.id,
        instructor_email=str(payload.instructor_email),
        max_exams=payload.max_exams,
    )
    db.add(invitation)
    db.commit()
    db.refresh(invitation)

    send_invitation_email(
        invitation.instructor_email, school.name, INVITATION_EXPIRE_DAYS
    )
    return invitation


@router.get("/schools/{school_id}", response_model=list[InvitationResponse])
def list_invitations(
    school_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_owned_school(school_id, current_user, db)
    stmt = (
        select(InstructorInvitation)
        .where(
            InstructorInvitation.school_id == school_id,
            InstructorInvitation.deleted_at.is_(None),
        )
        .order_by(InstructorInvitation.created_at.desc())
    )
    return list(db.scalars(stmt))


@router.get("/me", response_model=list[InvitationResponse])
def my_invitations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    stmt = (
        select(InstructorInvitation)
        .where(
            InstructorInvitation.instructor_email == current_user.email,
            InstructorInvitation.deleted_at.is_(None),
        )
        .order_by(InstructorInvitation.created_at.desc())
    )
    return list(db.scalars(stmt))


@router.get("/{invitation_id}", response_model=InvitationResponse)
def get_invitation(
    invitation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    invitation = _get_invitation(invitation_id, db)
    _require_owner(invitation, current_user, db)
    return invitation


@router.patch("/{invitation_id}", response_model=InvitationResponse)
def update_invitation(
    invitation_id: str,
    payload: InvitationUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    invitation = _get_invitation(invitation_id, db)
    _require_owner(invitation, current_user, db)

    if invitation.status not in (
        InvitationStatus.pending,
        InvitationStatus.accepted,
        InvitationStatus.rejected,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Canceled or expired invitations cannot be updated",
        )

    if payload.instructor_email is not None:
        invitation.instructor_email = str(payload.instructor_email)
    if payload.max_exams is not None:
        invitation.max_exams = payload.max_exams

    if payload.resend:
        _refresh_expiration(invitation)
        school = db.get(School, invitation.school_id)
        send_invitation_email(
            invitation.instructor_email, school.name, INVITATION_EXPIRE_DAYS
        )

    db.add(invitation)
    db.commit()
    db.refresh(invitation)
    return invitation


@router.post("/{invitation_id}/accept", response_model=InvitationResponse)
def accept_invitation(
    invitation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    invitation = _get_invitation(invitation_id, db)
    _require_invitee(invitation, current_user)

    if invitation.status == InvitationStatus.canceled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This invitation has been canceled",
        )

    if invitation.is_expired:
        invitation.mark_expired()
        db.add(invitation)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="This invitation has expired",
        )

    if invitation.status != InvitationStatus.pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invitation is already {invitation.status.value}",
        )

    invitation.status = InvitationStatus.accepted
    invitation.accepted_at = datetime.now(timezone.utc)
    db.add(invitation)
    db.commit()
    db.refresh(invitation)
    return invitation


@router.post("/{invitation_id}/reject", response_model=InvitationResponse)
def reject_invitation(
    invitation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    invitation = _get_invitation(invitation_id, db)
    _require_invitee(invitation, current_user)

    if invitation.status == InvitationStatus.canceled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This invitation has been canceled",
        )

    if invitation.is_expired:
        invitation.mark_expired()
        db.add(invitation)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="This invitation has expired",
        )

    if invitation.status != InvitationStatus.pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invitation is already {invitation.status.value}",
        )

    invitation.status = InvitationStatus.rejected
    invitation.rejected_at = datetime.now(timezone.utc)
    db.add(invitation)
    db.commit()
    db.refresh(invitation)
    return invitation


@router.post("/{invitation_id}/cancel", response_model=InvitationResponse)
def cancel_invitation(
    invitation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    invitation = _get_invitation(invitation_id, db)
    _require_owner(invitation, current_user, db)

    if invitation.status == InvitationStatus.accepted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Accepted invitations cannot be canceled",
        )
    if invitation.status == InvitationStatus.canceled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation is already canceled",
        )

    invitation.status = InvitationStatus.canceled
    invitation.canceled_at = datetime.now(timezone.utc)
    db.add(invitation)
    db.commit()
    db.refresh(invitation)
    return invitation


@router.delete("/{invitation_id}", response_model=MessageResponse)
def delete_invitation(
    invitation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    invitation = _get_invitation(invitation_id, db)
    _require_owner(invitation, current_user, db)
    invitation.deleted_at = datetime.now(timezone.utc)
    db.add(invitation)
    db.commit()
    return MessageResponse(message="Invitation deleted successfully")
