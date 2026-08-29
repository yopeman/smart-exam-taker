from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.controllers import invitations as invitations_controller
from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User
from app.schemas.instructor_invitation import (
    InvitationCreateRequest,
    InvitationResponse,
    InvitationUpdateRequest,
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
