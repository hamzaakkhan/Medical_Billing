from pydantic import BaseModel, Field, EmailStr

class patients(BaseModel):
    id: int | None = None

    first_name: str = Field(max_length=30)
    middle_name: str | None = Field(default=None, max_length=30)
    last_name: str = Field(max_length=30)

    dob: str = Field(max_length=10)

    address: str = Field(max_length=100)
    city: str = Field(max_length=50)
    state: str = Field(max_length=50)
    postal_code: str = Field(max_length=10)

    email: EmailStr

    emergency_phone: str | None = None
    phone: str = Field(min_length=9, max_length=11)

    #Insurance:Insurance
    
class patientUpdate(BaseModel):
    first_name: str | None = Field(default=None, max_length=30)
    middle_name: str | None = Field(default=None, max_length=30)
    last_name: str | None = Field(default=None, max_length=30)

    dob: str | None = Field(default=None, max_length=10)

    address: str | None = Field(default=None, max_length=100)
    city: str | None = Field(default=None, max_length=50)
    state: str | None = Field(default=None, max_length=50)
    postal_code: str | None = Field(default=None, max_length=10)

    email: EmailStr | None = None

    emergency_phone: str | None = None
    phone: str | None = Field(default=None, min_length=9, max_length=11)