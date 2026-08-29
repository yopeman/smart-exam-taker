from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

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
from app.services.email import send_invitation_status_emails


def get_owned_school(school_id: str, user: User, db: Session) -> School:
    school = db.get(School, school_id)
    if school is None or school.is_deleted or school.owner_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found",
        )
    return school


def get_invitation(invitation_id: str, db: Session) -> InstructorInvitation:
    invitation = db.get(InstructorInvitation, invitation_id)
    if invitation is None or invitation.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found",
        )
    return invitation


def require_owner(
    invitation: InstructorInvitation, user: User, db: Session
) -> School:
    return get_owned_school(invitation.school_id, user, db)


def notify_invitation_parties(
    invitation: InstructorInvitation, action: str, db: Session
) -> None:
    school = db.get(School, invitation.school_id)
    if school is None:
        return
    owner = db.get(User, school.owner_id)
    if owner is None:
        return
    instructor = db.scalar(
        select(User).where(User.email == invitation.instructor_email)
    )
    send_invitation_status_emails(
        owner.email,
        invitation,
        school.name,
        action,
        owner_name=owner.name,
        instructor_name=instructor.name if instructor else None,
    )


def require_invitee(invitation: InstructorInvitation, user: User) -> None:
    if user.role == UserRole.admin:
        return
    if user.email != invitation.instructor_email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This invitation is not for your account",
        )


def refresh_expiration(invitation: InstructorInvitation) -> None:
    invitation.invited_at = datetime.now(timezone.utc)
    invitation.expired_at = invitation.invited_at + timedelta(
        days=INVITATION_EXPIRE_DAYS
    )
    invitation.status = InvitationStatus.pending
    invitation.accepted_at = None
    invitation.rejected_at = None
    invitation.canceled_at = None


def create_invitation(
    school_id: str,
    payload: InvitationCreateRequest,
    user: User,
    db: Session,
) -> InstructorInvitation:
    school = get_owned_school(school_id, user, db)

    invitation = InstructorInvitation(
        school_id=school.id,
        instructor_email=str(payload.instructor_email),
        max_exams=payload.max_exams,
    )
    db.add(invitation)
    db.commit()
    db.refresh(invitation)

    notify_invitation_parties(invitation, "created", db)
    return invitation


def list_invitations(school_id: str, user: User, db: Session) -> list:
    get_owned_school(school_id, user, db)
    stmt = (
        select(InstructorInvitation)
        .where(
            InstructorInvitation.school_id == school_id,
            InstructorInvitation.deleted_at.is_(None),
        )
        .order_by(InstructorInvitation.created_at.desc())
    )
    return list(db.scalars(stmt))


def my_invitations(user: User, db: Session) -> list:
    stmt = (
        select(InstructorInvitation)
        .where(
            InstructorInvitation.instructor_email == user.email,
            InstructorInvitation.deleted_at.is_(None),
        )
        .order_by(InstructorInvitation.created_at.desc())
    )
    return list(db.scalars(stmt))


def list_created_invitations(user: User, db: Session) -> list:
    owned_school_ids = select(School.id).where(
        School.owner_id == user.id,
        School.deleted_at.is_(None),
    )
    stmt = (
        select(InstructorInvitation)
        .where(
            InstructorInvitation.school_id.in_(owned_school_ids),
            InstructorInvitation.deleted_at.is_(None),
        )
        .order_by(InstructorInvitation.created_at.desc())
    )
    return list(db.scalars(stmt))


def get_invitation_detail(invitation_id: str, user: User, db: Session) -> InstructorInvitation:
    invitation = get_invitation(invitation_id, db)
    require_owner(invitation, user, db)
    return invitation


def update_invitation(
    invitation_id: str,
    payload: InvitationUpdateRequest,
    user: User,
    db: Session,
) -> InstructorInvitation:
    invitation = get_invitation(invitation_id, db)
    require_owner(invitation, user, db)

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
        refresh_expiration(invitation)
        notify_invitation_parties(invitation, "resent", db)
    else:
        notify_invitation_parties(invitation, "updated", db)

    db.add(invitation)
    db.commit()
    db.refresh(invitation)
    return invitation


def accept_invitation(invitation_id: str, user: User, db: Session) -> InstructorInvitation:
    invitation = get_invitation(invitation_id, db)
    require_invitee(invitation, user)

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
    notify_invitation_parties(invitation, "accepted", db)
    return invitation


def reject_invitation(invitation_id: str, user: User, db: Session) -> InstructorInvitation:
    invitation = get_invitation(invitation_id, db)
    require_invitee(invitation, user)

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
    notify_invitation_parties(invitation, "rejected", db)
    return invitation


def cancel_invitation(invitation_id: str, user: User, db: Session) -> InstructorInvitation:
    invitation = get_invitation(invitation_id, db)
    require_owner(invitation, user, db)

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
    notify_invitation_parties(invitation, "canceled", db)
    return invitation


def delete_invitation(invitation_id: str, user: User, db: Session) -> MessageResponse:
    invitation = get_invitation(invitation_id, db)
    require_owner(invitation, user, db)
    invitation.deleted_at = datetime.now(timezone.utc)
    db.add(invitation)
    db.commit()
    notify_invitation_parties(invitation, "deleted", db)
    return MessageResponse(message="Invitation deleted successfully")
