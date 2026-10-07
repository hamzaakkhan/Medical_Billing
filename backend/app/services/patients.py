from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.tables import Patients


def all_patients_logic(db: Session):
    return db.query(Patients).all()


def get_patient_logic(id: int, db: Session):
    p = db.query(Patients).filter(Patients.id == id).first()
    if p is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No patient with this id",
        )
    return p


def add_patient_logic(patient_data, db: Session):
    data = patient_data.model_dump(exclude={"id"})
    p = Patients(**data)

    try:
        db.add(p)
        db.commit()
        db.refresh(p)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create patient record",
        )

    return "Patient added successfully"


def update_patient_logic(id: int, patient_data, db: Session):
    p = db.query(Patients).filter(Patients.id == id).first()
    if p is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No patient with this id",
        )

    updated_fields = patient_data.model_dump(exclude_unset=True)
    updated_fields.pop("id", None)

    if not updated_fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please enter the data",
        )

    for field, val in updated_fields.items():
        setattr(p, field, val)

    try:
        db.commit()
        db.refresh(p)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update patient record",
        )

    return "Patient updated successfully"


def delete_patients_logic(id: int, db: Session):
    p = db.query(Patients).filter(Patients.id == id).first()
    if p is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No patient with this id",
        )

    try:
        db.delete(p)
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete patient record",
        )

    return None
