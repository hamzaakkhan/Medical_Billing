from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.utils.name_formatting import format_full_name

VALID_STATUSES = {
    "scheduled",
    "confirmed",
    "in_progress",
    "completed",
    "cancelled",
    "no_show",
    "rescheduled",
}


def _validate_status(v: str | None) -> str | None:
    if v is None:
        return None
    clean = v.strip().lower().replace(" ", "_")
    if clean in VALID_STATUSES:
        return clean
    raise ValueError(f"Invalid status '{v}'. Must be one of: {', '.join(sorted(VALID_STATUSES))}")


def _validate_reason(v: str | None) -> str | None:
    if v is None:
        return None
    clean = v.strip()
    if not clean:
        raise ValueError("Reason cannot be empty or whitespace only")
    return clean


def _validate_duration(start_at: datetime | None, ends_at: datetime | None):
    if start_at and ends_at:
        if ends_at <= start_at:
            raise ValueError("ends_at must be strictly after start_at")
        duration_minutes = (ends_at - start_at).total_seconds() / 60
        if duration_minutes < 5:
            raise ValueError("Appointment duration must be at least 5 minutes")
        if duration_minutes > 1440:
            raise ValueError("Appointment duration cannot exceed 24 hours")


class appointmentCreate(BaseModel):
    patient_id: int = Field(..., gt=0, description="ID of the patient")
    doctor_id: int = Field(..., gt=0, description="ID of the doctor (user)")
    start_at: datetime = Field(..., description="Start timestamp of the appointment")
    ends_at: datetime = Field(..., description="End timestamp of the appointment")
    reason: str = Field(..., min_length=1, max_length=255, description="Reason for visit")
    status: str = Field(default="scheduled", max_length=50, description="Appointment status")
    notes: str | None = Field(default=None, max_length=1000, description="Clinical or scheduling notes")

    @field_validator("status", mode="before")
    @classmethod
    def check_status(cls, v: str) -> str:
        return _validate_status(v)

    @field_validator("reason", mode="before")
    @classmethod
    def check_reason(cls, v: str) -> str:
        return _validate_reason(v)

    @model_validator(mode="after")
    def check_times(self) -> "appointmentCreate":
        _validate_duration(self.start_at, self.ends_at)
        return self


appointments = appointmentCreate


class appointmentUpdate(BaseModel):
    patient_id: int | None = Field(default=None, gt=0)
    doctor_id: int | None = Field(default=None, gt=0)
    start_at: datetime | None = None
    ends_at: datetime | None = None
    reason: str | None = Field(default=None, min_length=1, max_length=255)
    status: str | None = Field(default=None, max_length=50)
    notes: str | None = Field(default=None, max_length=1000)

    @field_validator("status", mode="before")
    @classmethod
    def check_status(cls, v: str | None) -> str | None:
        return _validate_status(v)

    @field_validator("reason", mode="before")
    @classmethod
    def check_reason(cls, v: str | None) -> str | None:
        return _validate_reason(v)

    @model_validator(mode="after")
    def check_times(self) -> "appointmentUpdate":
        _validate_duration(self.start_at, self.ends_at)
        return self


class appointmentResponse(BaseModel):
    id: int
    patient_id: int
    doctor_id: int
    scheduled_by: int
    start_at: datetime
    ends_at: datetime
    reason: str
    status: str
    notes: str | None = None
    created_at: datetime | None = None
    patient_name: str | None = None
    doctor_name: str | None = None

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="before")
    @classmethod
    def populate_relational_names(cls, data):
        if not isinstance(data, dict):
            patient = getattr(data, "patient", None)
            doctor = getattr(data, "doctor", None)
            p_name = format_full_name(patient.first_name, getattr(patient, "middle_name", None), patient.last_name) if patient else None
            d_name = format_full_name(doctor.first_name, getattr(doctor, "middle_name", None), doctor.last_name) if doctor else None
            return {
                "id": data.id,
                "patient_id": data.patient_id,
                "doctor_id": data.doctor_id,
                "scheduled_by": data.scheduled_by,
                "start_at": data.start_at,
                "ends_at": data.ends_at,
                "reason": data.reason,
                "status": data.status,
                "notes": data.notes,
                "created_at": data.created_at,
                "patient_name": getattr(data, "patient_name", None) or p_name,
                "doctor_name": getattr(data, "doctor_name", None) or d_name,
            }
        return data
