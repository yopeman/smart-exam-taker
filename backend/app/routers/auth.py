from fastapi import APIRouter, Depends, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.controllers import auth as auth_controller
from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User
from app.schemas.user import (
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    UpdateProfileRequest,
    UserResponse,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def _form_redirect(status_text: str, detail: str) -> RedirectResponse:
    url = f"{settings.FRONTEND_BASE_URL}/auth/verify-email?status={status_text}&detail={detail}"
    return RedirectResponse(url=url)


@router.post(
    "/register", response_model=UserResponse, status_code=201
)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    return auth_controller.register(payload, db)


@router.get("/verify-email")
def verify_email(
    token: str = Query(...),
    db: Session = Depends(get_db),
):
    status_text, detail = auth_controller.verify_email(token, db)
    return _form_redirect(status_text, detail)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    return auth_controller.login(payload, db)


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    return auth_controller.forgot_password(payload, db)


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    return auth_controller.reset_password(payload, db)


@router.get("/me", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    return auth_controller.get_profile(current_user)


@router.patch("/profile", response_model=UserResponse)
def update_profile(
    payload: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return auth_controller.update_profile(payload, current_user, db)


@router.delete("/account", response_model=MessageResponse)
def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return auth_controller.delete_account(current_user, db)
