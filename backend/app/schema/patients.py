from datetime import date
from pydantic import BaseModel, EmailStr, Field


class patients(BaseModel):
    id: int | None = None

    first_name: str = Field(min_length=1, max_length=30)
    middle_name: str | None = Field(default=None, max_length=30)
    last_name: str = Field(min_length=1, max_length=30)

    dob: date

    address: str = Field(min_length=1, max_length=100)
    city: str = Field(min_length=1, max_length=50)
    state: str = Field(min_length=1, max_length=50)
    postal_code: str = Field(min_length=1, max_length=10)

    email: EmailStr

    emergency_phone: str | None = Field(default=None, max_length=20)
    phone: str = Field(min_length=9, max_length=15)


class patientUpdate(BaseModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=30)
    middle_name: str | None = Field(default=None, max_length=30)
    last_name: str | None = Field(default=None, min_length=1, max_length=30)

    dob: date | None = None

    address: str | None = Field(default=None, min_length=1, max_length=100)
    city: str | None = Field(default=None, min_length=1, max_length=50)
    state: str | None = Field(default=None, min_length=1, max_length=50)
    postal_code: str | None = Field(default=None, min_length=1, max_length=10)

    email: EmailStr | None = None

    emergency_phone: str | None = Field(default=None, max_length=20)
    phone: str | None = Field(default=None, min_length=9, max_length=15)

    model_config = {"extra": "forbid"}