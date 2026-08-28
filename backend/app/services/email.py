import logging
import smtplib
from email.message import EmailMessage

from app.core.config import settings

logger = logging.getLogger(__name__)


def _build_message(to_email: str, subject: str, body: str) -> EmailMessage:
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = settings.EMAIL_FROM
    msg["To"] = to_email
    msg.set_content(body)
    return msg


def send_email(to_email: str, subject: str, body: str) -> None:
    msg = _build_message(to_email, subject, body)
    with smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT) as server:
        server.starttls()
        server.login(settings.EMAIL_USER, settings.EMAIL_PASS)
        server.send_message(msg)


def send_invitation_email(to_email: str, school_name: str, expires_in_days: int) -> None:
    link = f"{settings.FRONTEND_BASE_URL}/invitations"
    subject = f"You've been invited to {school_name} on Smart Exam Taker"
    body = (
        f"Hi,\n\n"
        f"You have been invited to join {school_name} as an instructor "
        f"on Smart Exam Taker.\n"
        f"Sign in with this email to accept or reject the invitation.\n\n"
        f"Invitation link: {link}\n\n"
        f"This invitation expires in {expires_in_days} days.\n\n"
        f"Smart Exam Taker"
    )
    try:
        send_email(to_email, subject, body)
    except Exception as exc:  # pragma: no cover - email is best effort
        logger.warning("Failed to send instructor invitation email: %s", exc)


def send_verification_email(to_email: str, token: str) -> None:
    link = f"{settings.FRONTEND_BASE_URL}/auth/verify-email?token={token}"
    subject = "Verify your email"
    body = (
        f"Hi,\n\n"
        f"Please verify your email by clicking the link below:\n{link}\n\n"
        f"This link is valid for "
        f"{settings.VERIFY_TOKEN_EXPIRE_MINUTES} minutes.\n\n"
        f"If you did not register, you can ignore this email.\n"
        f"Smart Exam Taker"
    )
    send_email(to_email, subject, body)


def send_reset_email(to_email: str, token: str) -> None:
    link = f"{settings.FRONTEND_BASE_URL}/auth/reset-password?token={token}"
    subject = "Reset your password"
    body = (
        f"Hi,\n\n"
        f"We received a request to reset your password.\n"
        f"Click the link below to choose a new password:\n{link}\n\n"
        f"This link is valid for {settings.RESET_TOKEN_EXPIRE_MINUTES} minutes.\n"
        f"If you did not request this, you can ignore this email.\n"
        f"Smart Exam Taker"
    )
    send_email(to_email, subject, body)
