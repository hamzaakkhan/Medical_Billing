from datetime import date
from pydantic import BaseModel, EmailStr, Field, field_validator

from app.utils.name_formatting import normalize_name


class patients(BaseModel):
    id: int | None = None

    first_name: str = Field(min_length=1, max_length=50)
    middle_name: str | None = Field(default=None, max_length=50)
    last_name: str = Field(min_length=1, max_length=50)

    dob: date

    address: str = Field(min_length=1, max_length=100)
    city: str = Field(min_length=1, max_length=50)
    state: str = Field(min_length=1, max_length=50)
    postal_code: str = Field(min_length=1, max_length=10)

    email: EmailStr

    emergency_phone: str | None = Field(default=None, max_length=20)
    phone: str = Field(min_length=9, max_length=15)

    @field_validator("first_name", "last_name", mode="before")
    @classmethod
    def normalize_patient_names(cls, v: str) -> str:
        if isinstance(v, str):
            norm = normalize_name(v)
            return norm if norm is not None else v
        return v

    @field_validator("middle_name", mode="before")
    @classmethod
    def normalize_patient_middle_name(cls, v: str | None) -> str | None:
        if v is None:
            return None
        if isinstance(v, str):
            norm = normalize_name(v)
            return norm if norm else None
        return v


class patientUpdate(BaseModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=50)
    middle_name: str | None = Field(default=None, max_length=50)
    last_name: str | None = Field(default=None, min_length=1, max_length=50)

    dob: date | None = None

    address: str | None = Field(default=None, min_length=1, max_length=100)
    city: str | None = Field(default=None, min_length=1, max_length=50)
    state: str | None = Field(default=None, min_length=1, max_length=50)
    postal_code: str | None = Field(default=None, min_length=1, max_length=10)

    email: EmailStr | None = None

    emergency_phone: str | None = Field(default=None, max_length=20)
    phone: str | None = Field(default=None, min_length=9, max_length=15)

    model_config = {"extra": "forbid"}

    @field_validator("first_name", "last_name", mode="before")
    @classmethod
    def normalize_update_patient_names(cls, v: str | None) -> str | None:
        if v is None:
            return None
        if isinstance(v, str):
            norm = normalize_name(v)
            return norm if norm is not None else v
        return v

    @field_validator("middle_name", mode="before")
    @classmethod
    def normalize_update_patient_middle_name(cls, v: str | None) -> str | None:
        if v is None:
            return None
        if isinstance(v, str):
            norm = normalize_name(v)
            return norm if norm else None
        return v