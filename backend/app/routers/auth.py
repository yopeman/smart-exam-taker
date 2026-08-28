from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    create_reset_token,
    create_verify_token,
    decode_token,
    get_current_user,
    hash_password,
    verify_password,
)
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
from app.services import email

router = APIRouter(prefix="/auth", tags=["auth"])


def _form_redirect(status_text: str, detail: str) -> RedirectResponse:
    url = f"{settings.FRONTEND_BASE_URL}/auth/verify-email?status={status_text}&detail={detail}"
    return RedirectResponse(url=url)


@router.post(
    "/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED
)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.scalar(
        select(User).where(User.email == payload.email.lower())
    )
    if existing is not None and not existing.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    user = User(
        name=payload.name,
        email=payload.email.lower(),
        password=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_verify_token(user.id)
    email.send_verification_email(user.email, token)

    return user


@router.get("/verify-email")
def verify_email(
    token: str = Query(...),
    db: Session = Depends(get_db),
):
    try:
        user_id = decode_token(token, expected_type="verify")
    except HTTPException:
        return _form_redirect(
            "failure", "The verification link is invalid or has expired"
        )

    user = db.get(User, user_id)
    if user is None or user.is_deleted:
        return _form_redirect("failure", "User not found")

    user.is_verified = True
    db.commit()

    return _form_redirect("success", "Email verified successfully")


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.scalar(
        select(User).where(User.email == payload.email.lower())
    )
    if (
        user is None
        or user.is_deleted
        or not verify_password(payload.password, user.password)
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email before logging in",
        )

    return TokenResponse(
        access_token=create_access_token(user.id), user=UserResponse.model_validate(user)
    )


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.scalar(
        select(User).where(User.email == payload.email.lower())
    )
    if user is not None and not user.is_deleted:
        token = create_reset_token(user.id)
        email.send_reset_email(user.email, token)

    # Always return the same message to avoid user enumeration.
    return MessageResponse(
        message="If an account exists for that email, a reset link has been sent"
    )


@router.get("/reset-password")
def reset_password_form(
    token: str = Query(...),
):
    # The reset password flow needs a fresh password, so this route displays
    # the new-password form on the frontend. The backend applies the change
    # via the POST endpoint below.
    url = f"{settings.FRONTEND_BASE_URL}/auth/reset-password?token={token}"
    return RedirectResponse(url=url)


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    try:
        user_id = decode_token(payload.token, expected_type="reset")
    except HTTPException:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The reset link is invalid or has expired",
        )

    user = db.get(User, user_id)
    if user is None or user.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The reset link is invalid or has expired",
        )

    user.password = hash_password(payload.new_password)
    db.commit()

    return MessageResponse(message="Your password has been reset successfully")


@router.get("/me", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/profile", response_model=UserResponse)
def update_profile(
    payload: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.name is not None:
        current_user.name = payload.name
    if payload.password is not None:
        current_user.password = hash_password(payload.password)

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.delete("/account", response_model=MessageResponse)
def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user.deleted_at = datetime.now(timezone.utc)
    db.add(current_user)
    db.commit()

    return MessageResponse(message="Your account has been deleted")
