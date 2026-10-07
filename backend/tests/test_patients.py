from datetime import date
import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from app.models.tables import Patients
from app.schema.patients import patientUpdate, patients
from app.services.patients import (
    add_patient_logic,
    all_patients_logic,
    delete_patients_logic,
    get_patient_logic,
    update_patient_logic,
)


def test_patient_schema_valid():
    p = patients(
        first_name="Alice",
        last_name="Johnson",
        dob=date(1995, 4, 12),
        address="100 Main St",
        city="Springfield",
        state="IL",
        postal_code="62701",
        email="alice@example.com",
        phone="1234567890",
    )
    assert p.first_name == "Alice"
    assert p.dob == date(1995, 4, 12)


def test_patient_schema_rejects_empty_strings():
    with pytest.raises(ValidationError):
        patients(
            first_name="",  # min_length=1
            last_name="Johnson",
            dob="1995-04-12",
            address="100 Main St",
            city="Springfield",
            state="IL",
            postal_code="62701",
            email="alice@example.com",
            phone="1234567890",
        )


def test_patient_schema_rejects_invalid_date():
    with pytest.raises(ValidationError):
        patients(
            first_name="Alice",
            last_name="Johnson",
            dob="not-a-date",  # Invalid date format
            address="100 Main St",
            city="Springfield",
            state="IL",
            postal_code="62701",
            email="alice@example.com",
            phone="1234567890",
        )


def test_patient_crud(db_session):
    # Create
    p_data = patients(
        first_name="Bob",
        last_name="Marley",
        dob=date(1980, 2, 6),
        address="42 Island Way",
        city="Kingston",
        state="JM",
        postal_code="00000",
        email="bob@marley.com",
        phone="5551234567",
    )
    res = add_patient_logic(p_data, db_session)
    assert res == "Patient added successfully"

    # List
    all_p = all_patients_logic(db_session)
    assert len(all_p) == 1
    p_id = all_p[0].id

    # Read single
    single = get_patient_logic(p_id, db_session)
    assert single.first_name == "Bob"

    # Update
    update_data = patientUpdate(first_name="Robert", city="Nine Mile")
    update_res = update_patient_logic(p_id, update_data, db_session)
    assert update_res == "Patient updated successfully"

    updated = get_patient_logic(p_id, db_session)
    assert updated.first_name == "Robert"
    assert updated.city == "Nine Mile"

    # Empty update rejected
    with pytest.raises(HTTPException) as exc:
        update_patient_logic(p_id, patientUpdate(), db_session)
    assert exc.value.status_code == 400

    # Delete
    delete_patients_logic(p_id, db_session)
    assert len(all_patients_logic(db_session)) == 0

    # Read non-existent
    with pytest.raises(HTTPException) as exc2:
        get_patient_logic(p_id, db_session)
    assert exc2.value.status_code == 404
