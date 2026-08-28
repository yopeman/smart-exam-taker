from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_token(
    subject: str, expires_delta: timedelta, token_type: str = "access"
) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "type": token_type,
        "iat": now,
        "exp": now + expires_delta,
    }
    return jwt.encode(
        payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM
    )


def create_access_token(user_id: str) -> str:
    return create_token(
        user_id, timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )


def create_verify_token(user_id: str) -> str:
    return create_token(
        user_id,
        timedelta(minutes=settings.VERIFY_TOKEN_EXPIRE_MINUTES),
        token_type="verify",
    )


def create_reset_token(user_id: str) -> str:
    return create_token(
        user_id,
        timedelta(minutes=settings.RESET_TOKEN_EXPIRE_MINUTES),
        token_type="reset",
    )


def decode_token(token: str, expected_type: str | None = None) -> str:
    """Decode a JWT and return the subject (user id)."""
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
    except JWTError:
        raise credentials_error

    subject = payload.get("sub")
    if subject is None:
        raise credentials_error

    if expected_type is not None and payload.get("type") != expected_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid token type for this operation",
        )

    return subject


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    user_id = decode_token(credentials.credentials)
    user = db.get(User, user_id)
    if user is None or user.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
    return user
