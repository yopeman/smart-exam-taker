from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.controllers import invitations as invitations_controller
from app.core.database import get_db
from app.core.security import get_current_user, require_instructor
from app.models import School, User
from app.schemas.instructor_invitation import (
    InvitationCreateRequest,
    InvitationResponse,
    InvitationUpdateRequest,
    InvitationWithSchoolResponse,
)
from app.schemas.user import MessageResponse

router = APIRouter(prefix="/invitations", tags=["invitations"])


@router.post(
    "/schools/{school_id}",
    response_model=InvitationResponse,
    status_code=201,
)
def create_invitation(
    school_id: str,
    payload: InvitationCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return invitations_controller.create_invitation(
        school_id, payload, current_user, db
    )


@router.get("/schools/{school_id}", response_model=list[InvitationResponse])
def list_invitations(
    school_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return invitations_controller.list_invitations(school_id, current_user, db)


@router.get("/me", response_model=list[InvitationResponse])
def my_invitations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return invitations_controller.my_invitations(current_user, db)


@router.get("/created", response_model=list[InvitationWithSchoolResponse])
def created_invitations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_instructor(current_user)
    invitations = invitations_controller.list_created_invitations(
        current_user, db
    )
    schools = {
        s.id: s
        for s in db.scalars(
            select(School).where(
                School.id.in_([i.school_id for i in invitations])
            )
        ).all()
    }
    return [
        InvitationWithSchoolResponse(
            id=i.id,
            school_id=i.school_id,
            school_name=schools[i.school_id].name
            if i.school_id in schools
            else "",
            instructor_email=i.instructor_email,
            max_exams=i.max_exams,
            status=i.status,
            invited_at=i.invited_at,
            expired_at=i.expired_at,
            accepted_at=i.accepted_at,
            rejected_at=i.rejected_at,
            canceled_at=i.canceled_at,
            created_at=i.created_at,
            updated_at=i.updated_at,
        )
        for i in invitations
    ]


@router.get("/{invitation_id}", response_model=InvitationResponse)
def get_invitation(
    invitation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return invitations_controller.get_invitation_detail(
        invitation_id, current_user, db
    )


@router.patch("/{invitation_id}", response_model=InvitationResponse)
def update_invitation(
    invitation_id: str,
    payload: InvitationUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return invitations_controller.update_invitation(
        invitation_id, payload, current_user, db
    )


@router.post("/{invitation_id}/accept", response_model=InvitationResponse)
def accept_invitation(
    invitation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return invitations_controller.accept_invitation(invitation_id, current_user, db)


@router.post("/{invitation_id}/reject", response_model=InvitationResponse)
def reject_invitation(
    invitation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return invitations_controller.reject_invitation(invitation_id, current_user, db)


@router.post("/{invitation_id}/cancel", response_model=InvitationResponse)
def cancel_invitation(
    invitation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return invitations_controller.cancel_invitation(invitation_id, current_user, db)


@router.delete("/{invitation_id}", response_model=MessageResponse)
def delete_invitation(
    invitation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return invitations_controller.delete_invitation(invitation_id, current_user, db)
