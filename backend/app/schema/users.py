from enum import Enum
from pydantic import BaseModel, Field, EmailStr


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


class usersUpdate(BaseModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=50)
    middle_name: str | None = Field(default=None, max_length=50)
    last_name: str | None = Field(default=None, min_length=1, max_length=50)
    email: EmailStr | None = None
    password: str | None = Field(default=None, min_length=8, max_length=100)
    role: role_name | None = None
    is_active: bool | None = None

    model_config = {"extra": "forbid"}


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

