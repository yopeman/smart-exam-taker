from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    create_reset_token,
    create_verify_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models import User, UserRole
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


def register(payload: RegisterRequest, db: Session) -> User:
    existing = db.scalar(select(User).where(User.email == payload.email.lower()))
    if existing is not None and not existing.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    if payload.role == UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot self-register as admin",
        )
    role = payload.role or UserRole.instructor

    user = User(
        name=payload.name,
        email=payload.email.lower(),
        password=hash_password(payload.password),
        role=role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_verify_token(user.id)
    email.send_verification_email(user.email, token, name=user.name)

    return user


def verify_email(token: str, db: Session) -> tuple[str, str]:
    try:
        user_id = decode_token(token, expected_type="verify")
    except HTTPException:
        return ("failure", "The verification link is invalid or has expired")

    user = db.get(User, user_id)
    if user is None or user.is_deleted:
        return ("failure", "User not found")

    user.is_verified = True
    db.commit()

    return ("success", "Email verified successfully")


def login(payload: LoginRequest, db: Session) -> TokenResponse:
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
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
        access_token=create_access_token(user.id),
        user=UserResponse.model_validate(user),
    )


def forgot_password(payload: ForgotPasswordRequest, db: Session) -> MessageResponse:
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if user is not None and not user.is_deleted:
        token = create_reset_token(user.id)
        email.send_reset_email(user.email, token, name=user.name)

    # Always return the same message to avoid user enumeration.
    return MessageResponse(
        message="If an account exists for that email, a reset link has been sent"
    )


def reset_password(payload: ResetPasswordRequest, db: Session) -> MessageResponse:
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


def get_profile(current_user: User) -> User:
    return current_user


def update_profile(
    payload: UpdateProfileRequest,
    current_user: User,
    db: Session,
) -> User:
    if payload.name is not None:
        current_user.name = payload.name
    if payload.password is not None:
        current_user.password = hash_password(payload.password)

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user


def delete_account(current_user: User, db: Session) -> MessageResponse:
    current_user.deleted_at = datetime.now(timezone.utc)
    db.add(current_user)
    db.commit()

    return MessageResponse(message="Your account has been deleted")
