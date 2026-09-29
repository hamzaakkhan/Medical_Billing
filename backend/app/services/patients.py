from app.models.tables import Patients
from fastapi import HTTPException

def all_patients_logic(db):
    p = db.query(Patients).all()
    
    return p

def get_patient_logic(id, db):
    p = db.query(Patients).filter(Patients.id == id).first()

    if p is None:
        raise HTTPException(status_code=404, detail="No patient with this id")
        
    return p

def add_patient_logic(patients, db):
    p = Patients(**patients.dict())
    
    db.add(p)
    db.commit()

    return "Patient added successfully"

def update_patient_logic(id, patients, db):

    p = db.query(Patients).filter(Patients.id == id).first()
    if p is None:
        raise HTTPException(status_code=404, detail="No patient with this id")

    updated_fields = patients.model_dump(exclude_unset=True)
    print(updated_fields)

    for x , y in updated_fields.items():
        print(x,y)
        setattr(p, x, y)

    db.commit()
    db.refresh(p)
    return "Patient updated successfully"

def delete_patients_logic(id, db):
    p = db.query(Patients).filter(Patients.id == id).first()
    if p is None:
        raise HTTPException(status_code=404, detail="No patient with this id")
    db.delete(p)
    db.commit()
    return 
