from fastapi import APIRouter, Depends, Path, status
from sqlalchemy.orm import Session

from app.auth.jwt_auth import get_current_user
from app.database.database import get_db
from app.schema.auth import TokenData
from app.schema.patients import patientUpdate, patients
from app.services.patients import (
    add_patient_logic,
    all_patients_logic,
    delete_patients_logic,
    get_patient_logic,
    update_patient_logic,
)

router = APIRouter(prefix="/patients", tags=["Patients"])


@router.get("/", status_code=status.HTTP_200_OK)
def all_patients(
    db: Session = Depends(get_db),
    user_id: TokenData = Depends(get_current_user),
):
    return all_patients_logic(db)


@router.get("/{id}", status_code=status.HTTP_200_OK)
def get_patient(
    id: int = Path(..., gt=0),
    db: Session = Depends(get_db),
    user_id: TokenData = Depends(get_current_user),
):
    return get_patient_logic(id, db)


@router.post("/", status_code=status.HTTP_201_CREATED)
def add_patient(
    patient: patients,
    db: Session = Depends(get_db),
    user_id: TokenData = Depends(get_current_user),
):
    return add_patient_logic(patient, db)


@router.put("/{id}", status_code=status.HTTP_200_OK)
def update_patients(
    id: int = Path(..., gt=0),
    patient: patientUpdate = ...,
    db: Session = Depends(get_db),
    user_id: TokenData = Depends(get_current_user),
):
    return update_patient_logic(id, patient, db)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_patient(
    id: int = Path(..., gt=0),
    db: Session = Depends(get_db),
    user_id: TokenData = Depends(get_current_user),
):
    delete_patients_logic(id, db)
    return None
