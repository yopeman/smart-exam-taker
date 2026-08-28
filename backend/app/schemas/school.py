from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, HttpUrl

from app.schemas.user import MessageResponse


class SchoolCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    location: str | None = Field(default=None, max_length=255)
    logo_url: HttpUrl | None = None
    primary_color: str | None = Field(default=None, max_length=7)
    secondary_color: str | None = Field(default=None, max_length=7)


class SchoolUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    location: str | None = Field(default=None, max_length=255)
    logo_url: HttpUrl | None = None
    primary_color: str | None = Field(default=None, max_length=7)
    secondary_color: str | None = Field(default=None, max_length=7)


class SchoolResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    owner_id: str
    name: str
    location: str | None
    logo_url: str | None
    primary_color: str | None
    secondary_color: str | None
    created_at: datetime
    updated_at: datetime
