from fastapi import APIRouter, Depends
from app.services.patients import all_patients_logic, get_patient_logic, add_patient_logic, update_patient_logic, delete_patients_logic
from sqlalchemy.orm import Session
from app.database.database import get_db

from app.models.tables import Patients
from fastapi import HTTPException

from app.schema.patients import patients, patientUpdate
from app.auth.jwt_auth import get_current_user

router = APIRouter(prefix="/patients" , tags={"Patients"})

@router.get("/", status_code=200)
def all_patients(db:Session = Depends(get_db), user_id:int = Depends(get_current_user)):
    return all_patients_logic(db)

    
@router.get("/{id}" , status_code=200)
def get_patient(id:int = id, db:Session = Depends(get_db)):
    return get_patient_logic(id, db)


@router.post("/" , status_code=201)
def add_patient(patients:patients, db:Session = Depends(get_db)):
   return add_patient_logic(patients, db)


@router.put("/{id}", status_code=200)
def update_patients(id:int, patients:patientUpdate,db:Session = Depends(get_db)):
    return update_patient_logic(id, patients, db)


@router.delete("/{id}", status_code=204)
def delete_patient(id:int, db:Session = Depends(get_db)):
   return delete_patients_logic(id, db)
