from fastapi import APIRouter, Depends, Path, Query, status
from sqlalchemy.orm import Session

from app.auth.jwt_auth import get_current_user
from app.database.database import get_db
from app.models.users import Roles, User
from app.schema.appointments import (
    appointmentCreate,
    appointmentResponse,
    appointmentUpdate,
)
from app.schema.auth import TokenData
from app.schema.users import role_name, userResponse
from app.services.appointments import (
    add_appointment_logic,
    all_appointments_logic,
    delete_appointment_logic,
    get_appointment_logic,
    update_appointment_logic,
)

router = APIRouter(prefix="/appointments", tags=["Appointments"])


@router.get("/doctors", response_model=list[userResponse], status_code=status.HTTP_200_OK)
def get_eligible_doctors(
    db: Session = Depends(get_db),
    user_id: TokenData = Depends(get_current_user),
):
    """Retrieve all active doctors for appointment scheduling and filtering."""
    doc_role = db.query(Roles).filter(Roles.role == role_name.DOCTOR.value).first()
    if not doc_role:
        return []
    return (
        db.query(User)
        .filter(User.role_id == doc_role.id, User.is_active == True)
        .order_by(User.first_name.asc(), User.last_name.asc())
        .all()
    )


@router.get("/", response_model=list[appointmentResponse], status_code=status.HTTP_200_OK)
def all_appointments(
    patient_id: int | None = Query(default=None, gt=0, description="Filter by patient ID"),
    doctor_id: int | None = Query(default=None, gt=0, description="Filter by doctor ID"),
    status_filter: str | None = Query(default=None, alias="status", description="Filter by status"),
    db: Session = Depends(get_db),
    user_id: TokenData = Depends(get_current_user),
):
    """List all appointments with optional filters for patient, doctor, or status."""
    return all_appointments_logic(
        db=db,
        user_id=user_id.id,
        patient_id=patient_id,
        doctor_id=doctor_id,
        status_filter=status_filter,
    )


@router.get("/{id}", response_model=appointmentResponse, status_code=status.HTTP_200_OK)
def get_appointment(
    id: int = Path(..., gt=0, description="Appointment ID"),
    db: Session = Depends(get_db),
    user_id: TokenData = Depends(get_current_user),
):
    """Retrieve details for a specific appointment."""
    return get_appointment_logic(id, db, user_id.id)


@router.post("/", response_model=appointmentResponse, status_code=status.HTTP_201_CREATED)
def add_appointment(
    appointment: appointmentCreate,
    db: Session = Depends(get_db),
    user_id: TokenData = Depends(get_current_user),
):
    """Schedule a new appointment."""
    return add_appointment_logic(appointment, db, user_id.id)


@router.put("/{id}", response_model=appointmentResponse, status_code=status.HTTP_200_OK)
def update_appointment(
    id: int = Path(..., gt=0, description="Appointment ID"),
    appointment: appointmentUpdate = ...,
    db: Session = Depends(get_db),
    user_id: TokenData = Depends(get_current_user),
):
    """Update details or status of an existing appointment."""
    return update_appointment_logic(id, appointment, db, user_id.id)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_appointment(
    id: int = Path(..., gt=0, description="Appointment ID"),
    db: Session = Depends(get_db),
    user_id: TokenData = Depends(get_current_user),
):
    """Cancel / remove an appointment record."""
    #delete_appointment_logic(id, db, user_id.id)
    return None
