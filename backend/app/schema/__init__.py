"""Schema package."""
from app.schema.appointments import (
    appointmentCreate,
    appointmentResponse,
    appointmentUpdate,
    appointments,
)
from app.schema.auth import Token, TokenData
from app.schema.patients import patientUpdate, patients
from app.schema.users import (
    passwordChangeRequest,
    userProfileResponse,
    userProfileUpdate,
    userResponse,
    users,
    usersUpdate,
)

__all__ = [
    "Token",
    "TokenData",
    "patients",
    "patientUpdate",
    "users",
    "usersUpdate",
    "userResponse",
    "userProfileUpdate",
    "userProfileResponse",
    "passwordChangeRequest",
    "appointments",
    "appointmentCreate",
    "appointmentUpdate",
    "appointmentResponse",
]
