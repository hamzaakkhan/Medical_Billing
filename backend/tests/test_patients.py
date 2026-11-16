from datetime import date

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from app.models.patients import Patients
from app.schema.patients import patients, patientUpdate
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
        health_card="HC12345678",
    )
    assert p.first_name == "Alice"
    assert p.dob == date(1995, 4, 12)
    assert p.health_card == "HC12345678"


def test_patient_schema_health_card_normalization():
    # Tests trimming, hyphen removal, and uppercase normalization
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
        health_card=" hc-1234-567-ab ",
    )
    assert p.health_card == "HC1234567AB"


def test_patient_schema_rejects_future_dob():
    from datetime import timedelta
    tomorrow = date.today() + timedelta(days=1)
    with pytest.raises(ValidationError) as exc:
        patients(
            first_name="Baby",
            last_name="Doe",
            dob=tomorrow,
            address="100 Main St",
            city="Springfield",
            state="IL",
            postal_code="62701",
            email="baby@example.com",
            phone="1234567890",
            health_card="HC99999999",
        )
    assert "Date of birth cannot be in the future" in str(exc.value)


def test_patient_schema_rejects_invalid_health_card():
    # Too short (< 7)
    with pytest.raises(ValidationError):
        patients(
            first_name="Alice",
            last_name="Johnson",
            dob=date(1995, 4, 12),
            address="100 Main St",
            city="Springfield",
            state="IL",
            postal_code="62701",
            email="alice@example.com",
            phone="1234567890",
            health_card="12345",
        )

    # Invalid characters (symbols)
    with pytest.raises(ValidationError):
        patients(
            first_name="Alice",
            last_name="Johnson",
            dob=date(1995, 4, 12),
            address="100 Main St",
            city="Springfield",
            state="IL",
            postal_code="62701",
            email="alice@example.com",
            phone="1234567890",
            health_card="HC123$!56",
        )


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
            health_card="HC12345678",
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
            health_card="HC12345678",
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
        health_card="JM80020612",
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
    assert single.health_card == "JM80020612"

    # Update (including own health card unchanged should NOT raise 409)
    update_data = patientUpdate(first_name="Robert", city="Nine Mile", health_card="JM80020612")
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


def test_health_card_duplicate_detection(db_session):
    p1 = patients(
        first_name="Jane",
        last_name="Doe",
        dob=date(1990, 1, 1),
        address="100 First St",
        city="Springfield",
        state="IL",
        postal_code="62701",
        email="jane@example.com",
        phone="1234567890",
        health_card="CARD123456",
    )
    add_patient_logic(p1, db_session)

    # Trying to register another patient with same health card (even different casing/spacing)
    p2 = patients(
        first_name="John",
        last_name="Doe",
        dob=date(1988, 3, 15),
        address="200 Second St",
        city="Springfield",
        state="IL",
        postal_code="62701",
        email="john.different@example.com",
        phone="9876543210",
        health_card="card-123456",
    )
    with pytest.raises(HTTPException) as exc:
        add_patient_logic(p2, db_session)
    assert exc.value.status_code == 409
    assert "Patient with this health card already exists" in exc.value.detail


def test_health_card_duplicate_on_update(db_session):
    p1 = patients(
        first_name="Patient",
        last_name="One",
        dob=date(1990, 1, 1),
        address="100 First St",
        city="Springfield",
        state="IL",
        postal_code="62701",
        email="pone@example.com",
        phone="1234567890",
        health_card="CARD000001",
    )
    add_patient_logic(p1, db_session)

    p2 = patients(
        first_name="Patient",
        last_name="Two",
        dob=date(1992, 2, 2),
        address="200 Second St",
        city="Springfield",
        state="IL",
        postal_code="62701",
        email="ptwo@example.com",
        phone="9876543210",
        health_card="CARD000002",
    )
    add_patient_logic(p2, db_session)

    all_p = all_patients_logic(db_session)
    p2_id = [p.id for p in all_p if p.health_card == "CARD000002"][0]

    # Updating p2 to have p1's health card must raise 409
    with pytest.raises(HTTPException) as exc:
        update_patient_logic(p2_id, patientUpdate(health_card="CARD000001"), db_session)
    assert exc.value.status_code == 409
    assert "health card already exists" in exc.value.detail

    # Updating p2 to have its own health card should succeed
    res = update_patient_logic(p2_id, patientUpdate(health_card="CARD000002"), db_session)
    assert res == "Patient updated successfully"


def test_patient_cannot_be_deleted_with_appointments(db_session):
    from datetime import datetime, timedelta, timezone

    from app.models.appointments import appointments
    from app.models.users import Roles, User

    # Setup doctor & scheduler user
    doc_role = db_session.query(Roles).filter(Roles.role == "doctor").first()
    if not doc_role:
        doc_role = Roles(role="doctor")
        db_session.add(doc_role)
        db_session.commit()

    doctor = User(
        first_name="Dr",
        last_name="Who",
        email="doctor.who@example.com",
        password="pw",
        role_id=doc_role.id,
        is_active=True,
    )
    db_session.add(doctor)
    db_session.commit()

    p_data = patients(
        first_name="Clinical",
        last_name="Record",
        dob=date(1985, 5, 5),
        address="55 Health Blvd",
        city="Springfield",
        state="IL",
        postal_code="62701",
        email="clinical.record@example.com",
        phone="5559991122",
        health_card="CLINICAL01",
    )
    add_patient_logic(p_data, db_session)
    patient = db_session.query(Patients).filter(Patients.health_card == "CLINICAL01").first()

    now = datetime.now(timezone.utc)
    appt = appointments(
        patient_id=patient.id,
        doctor_id=doctor.id,
        scheduled_by=doctor.id,
        start_at=now,
        ends_at=now + timedelta(minutes=30),
        reason="Annual checkup",
        status="scheduled",
    )
    db_session.add(appt)
    db_session.commit()

    # Attempting to delete patient with appointments must be blocked
    with pytest.raises(HTTPException) as exc:
        delete_patients_logic(patient.id, db_session)
    assert exc.value.status_code == 409
    assert "existing clinical appointment records" in exc.value.detail
