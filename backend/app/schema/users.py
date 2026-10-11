from datetime import datetime
from enum import Enum
from pydantic import BaseModel, EmailStr, Field, field_validator

from app.utils.name_formatting import normalize_name


class role_name(str, Enum):
    ADMIN = "admin"
    RECEPTIONIST = "receptionist"
    DOCTOR = "doctor"
    CODER = "coder"
    BILLER = "biller"


class users(BaseModel):
    first_name: str = Field(min_length=1, max_length=50)
    middle_name: str | None = Field(default=None, max_length=50)
    last_name: str = Field(min_length=1, max_length=50)
    email: EmailStr
    password: str = Field(min_length=8, max_length=100)
    role: role_name
    is_active: bool = True

    @field_validator("first_name", "last_name", mode="before")
    @classmethod
    def normalize_required_names(cls, v: str) -> str:
        if isinstance(v, str):
            norm = normalize_name(v)
            return norm if norm is not None else v
        return v

    @field_validator("middle_name", mode="before")
    @classmethod
    def normalize_middle_name(cls, v: str | None) -> str | None:
        if v is None:
            return None
        if isinstance(v, str):
            norm = normalize_name(v)
            return norm if norm else None
        return v


class usersUpdate(BaseModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=50)
    middle_name: str | None = Field(default=None, max_length=50)
    last_name: str | None = Field(default=None, min_length=1, max_length=50)
    email: EmailStr | None = None
    password: str | None = Field(default=None, min_length=8, max_length=100)
    role: role_name | None = None
    is_active: bool | None = None

    model_config = {"extra": "forbid"}

    @field_validator("first_name", "last_name", mode="before")
    @classmethod
    def normalize_optional_names(cls, v: str | None) -> str | None:
        if v is None:
            return None
        if isinstance(v, str):
            norm = normalize_name(v)
            return norm if norm is not None else v
        return v

    @field_validator("middle_name", mode="before")
    @classmethod
    def normalize_middle_name(cls, v: str | None) -> str | None:
        if v is None:
            return None
        if isinstance(v, str):
            norm = normalize_name(v)
            return norm if norm else None
        return v


class userResponse(BaseModel):
    id: int
    first_name: str
    middle_name: str | None = None
    last_name: str
    email: EmailStr
    role_id: int
    is_active: bool
    is_root_admin: bool = False

    model_config = {"from_attributes": True}

    @field_validator("first_name", "last_name", mode="after")
    @classmethod
    def format_resp_names(cls, v: str) -> str:
        return normalize_name(v) or v

    @field_validator("middle_name", mode="after")
    @classmethod
    def format_resp_middle_name(cls, v: str | None) -> str | None:
        if not v:
            return None
        return normalize_name(v) or None


class userProfileResponse(BaseModel):
    id: int
    first_name: str
    middle_name: str | None = None
    last_name: str
    email: EmailStr
    role_id: int
    role: str
    is_active: bool
    is_root_admin: bool = False
    created_at: datetime | None = None

    model_config = {"from_attributes": True}

    @field_validator("first_name", "last_name", mode="after")
    @classmethod
    def format_profile_resp_names(cls, v: str) -> str:
        return normalize_name(v) or v

    @field_validator("middle_name", mode="after")
    @classmethod
    def format_profile_resp_middle_name(cls, v: str | None) -> str | None:
        if not v:
            return None
        return normalize_name(v) or None


class userProfileUpdate(BaseModel):
    first_name: str = Field(min_length=1, max_length=50)
    middle_name: str | None = Field(default=None, max_length=50)
    last_name: str = Field(min_length=1, max_length=50)
    email: EmailStr

    model_config = {"extra": "forbid"}

    @field_validator("first_name", "last_name", mode="before")
    @classmethod
    def normalize_profile_update_names(cls, v: str) -> str:
        if isinstance(v, str):
            norm = normalize_name(v)
            return norm if norm is not None else v
        return v

    @field_validator("middle_name", mode="before")
    @classmethod
    def normalize_profile_update_middle_name(cls, v: str | None) -> str | None:
        if v is None:
            return None
        if isinstance(v, str):
            norm = normalize_name(v)
            return norm if norm else None
        return v


class passwordChangeRequest(BaseModel):
    current_password: str = Field(min_length=1, max_length=100)
    new_password: str = Field(min_length=8, max_length=100)

    model_config = {"extra": "forbid"}


