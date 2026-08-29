from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models import InvitationStatus
from app.schemas.user import MessageResponse


class InvitationCreateRequest(BaseModel):
    instructor_email: EmailStr
    max_exams: int = Field(default=1, ge=1)


class InvitationUpdateRequest(BaseModel):
    instructor_email: EmailStr | None = None
    max_exams: int | None = Field(default=None, ge=1)
    resend: bool = Field(default=False)


class InvitationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    school_id: str
    instructor_email: str
    max_exams: int
    status: InvitationStatus
    invited_at: datetime
    expired_at: datetime
    accepted_at: datetime | None
    rejected_at: datetime | None
    canceled_at: datetime | None
    created_at: datetime
    updated_at: datetime


class InvitationWithSchoolResponse(BaseModel):
    id: str
    school_id: str
    school_name: str
    instructor_email: str
    max_exams: int
    status: InvitationStatus
    invited_at: datetime
    expired_at: datetime
    accepted_at: datetime | None
    rejected_at: datetime | None
    canceled_at: datetime | None
    created_at: datetime
    updated_at: datetime
