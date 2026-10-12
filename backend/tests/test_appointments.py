from datetime import datetime, timedelta, timezone
import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from app.models.patients import Patients
from app.models.users import User
from app.schema.appointments import appointmentCreate, appointmentResponse, appointmentUpdate
from app.schema.auth import TokenData
from app.services.appointments import (
    add_appointment_logic,
    all_appointments_logic,
    delete_appointment_logic,
    get_appointment_logic,
    update_appointment_logic,
)


@pytest.fixture
def sample_patient(db_session):
    p = Patients(
        first_name="John",
        last_name="Doe",
        dob=datetime(1990, 1, 1).date(),
        address="123 Main St",
        city="Metropolis",
        state="NY",
        postal_code="10001",
        email="john.doe@example.com",
        phone="+1234567890",
    )
    db_session.add(p)
    db_session.commit()
    db_session.refresh(p)
    return p


@pytest.fixture
def sample_doctor(db_session):
    doc = User(
        first_name="Gregory",
        last_name="House",
        email="house@hospital.org",
        password="hashedpassword123",
        role_id=3,  # doctor
        is_active=True,
    )
    db_session.add(doc)
    db_session.commit()
    db_session.refresh(doc)
    return doc


@pytest.fixture
def sample_receptionist(db_session):
    recep = User(
        first_name="Pam",
        last_name="Beesly",
        email="pam@hospital.org",
        password="hashedpassword123",
        role_id=2,  # receptionist
        is_active=True,
    )
    db_session.add(recep)
    db_session.commit()
    db_session.refresh(recep)
    return recep


def test_appointment_schema_validation():
    now = datetime.now(timezone.utc)
    valid = appointmentCreate(
        patient_id=1,
        doctor_id=2,
        start_at=now,
        ends_at=now + timedelta(minutes=30),
        reason="Annual checkup",
        status="Scheduled",
    )
    assert valid.status == "scheduled"
    assert valid.reason == "Annual checkup"

    # ends_at <= start_at should fail
    with pytest.raises(ValidationError):
        appointmentCreate(
            patient_id=1,
            doctor_id=2,
            start_at=now,
            ends_at=now - timedelta(minutes=10),
            reason="Backwards time",
        )


def test_create_and_get_appointment(db_session, sample_patient, sample_doctor, sample_receptionist):
    now = datetime.now(timezone.utc)
    create_dto = appointmentCreate(
        patient_id=sample_patient.id,
        doctor_id=sample_doctor.id,
        start_at=now + timedelta(hours=1),
        ends_at=now + timedelta(hours=1, minutes=30),
        reason="Follow up on knee surgery",
        status="scheduled",
        notes="Patient requested morning slot",
    )

    appt = add_appointment_logic(
        appointment_data=create_dto,
        db=db_session,
        user_id=sample_receptionist.id,
    )
    assert appt.id is not None
    assert appt.scheduled_by == sample_receptionist.id
    assert appt.reason == "Follow up on knee surgery"

    # Retrieve single
    fetched = get_appointment_logic(appt.id, db_session)
    assert fetched.id == appt.id
    assert fetched.patient_id == sample_patient.id


def test_create_appointment_nonexistent_patient(db_session, sample_doctor, sample_receptionist):
    now = datetime.now(timezone.utc)
    dto = appointmentCreate(
        patient_id=99999,
        doctor_id=sample_doctor.id,
        start_at=now + timedelta(hours=1),
        ends_at=now + timedelta(hours=2),
        reason="Checkup",
    )
    with pytest.raises(HTTPException) as exc:
        add_appointment_logic(dto, db_session, sample_receptionist.id)
    assert exc.value.status_code == 404
    assert "Patient" in exc.value.detail


def test_create_appointment_nonexistent_doctor(db_session, sample_patient, sample_receptionist):
    now = datetime.now(timezone.utc)
    dto = appointmentCreate(
        patient_id=sample_patient.id,
        doctor_id=99999,
        start_at=now + timedelta(hours=1),
        ends_at=now + timedelta(hours=2),
        reason="Checkup",
    )
    with pytest.raises(HTTPException) as exc:
        add_appointment_logic(dto, db_session, sample_receptionist.id)
    assert exc.value.status_code == 404
    assert "Doctor" in exc.value.detail


def test_create_appointment_deactivated_doctor(db_session, sample_patient, sample_receptionist):
    inactive_doc = User(
        first_name="Inactive",
        last_name="Doctor",
        email="inactive.doc@hospital.org",
        password="hashedpassword123",
        role_id=3,
        is_active=False,
    )
    db_session.add(inactive_doc)
    db_session.commit()
    db_session.refresh(inactive_doc)

    now = datetime.now(timezone.utc)
    dto = appointmentCreate(
        patient_id=sample_patient.id,
        doctor_id=inactive_doc.id,
        start_at=now + timedelta(hours=1),
        ends_at=now + timedelta(hours=2),
        reason="Checkup",
    )
    with pytest.raises(HTTPException) as exc:
        add_appointment_logic(dto, db_session, sample_receptionist.id)
    assert exc.value.status_code == 400
    assert "deactivated" in exc.value.detail


def test_filter_appointments(db_session, sample_patient, sample_doctor, sample_receptionist):
    now = datetime.now(timezone.utc)
    add_appointment_logic(
        appointmentCreate(
            patient_id=sample_patient.id,
            doctor_id=sample_doctor.id,
            start_at=now + timedelta(days=1),
            ends_at=now + timedelta(days=1, minutes=30),
            reason="Checkup 1",
            status="scheduled",
        ),
        db_session,
        sample_receptionist.id,
    )
    add_appointment_logic(
        appointmentCreate(
            patient_id=sample_patient.id,
            doctor_id=sample_doctor.id,
            start_at=now + timedelta(days=2),
            ends_at=now + timedelta(days=2, minutes=30),
            reason="Checkup 2",
            status="completed",
        ),
        db_session,
        sample_receptionist.id,
    )

    all_list = all_appointments_logic(db_session)
    assert len(all_list) == 2

    scheduled_only = all_appointments_logic(db_session, status_filter="scheduled")
    assert len(scheduled_only) == 1
    assert scheduled_only[0].reason == "Checkup 1"


def test_update_appointment(db_session, sample_patient, sample_doctor, sample_receptionist):
    now = datetime.now(timezone.utc)
    appt = add_appointment_logic(
        appointmentCreate(
            patient_id=sample_patient.id,
            doctor_id=sample_doctor.id,
            start_at=now + timedelta(hours=1),
            ends_at=now + timedelta(hours=2),
            reason="Consultation",
            status="scheduled",
        ),
        db_session,
        sample_receptionist.id,
    )

    update_dto = appointmentUpdate(
        status="confirmed",
        notes="Confirmed by patient via SMS",
    )
    updated = update_appointment_logic(appt.id, update_dto, db_session)
    assert updated.status == "confirmed"
    assert updated.notes == "Confirmed by patient via SMS"


def test_delete_appointment(db_session, sample_patient, sample_doctor, sample_receptionist):
    now = datetime.now(timezone.utc)
    appt = add_appointment_logic(
        appointmentCreate(
            patient_id=sample_patient.id,
            doctor_id=sample_doctor.id,
            start_at=now + timedelta(hours=1),
            ends_at=now + timedelta(hours=2),
            reason="Consultation",
        ),
        db_session,
        sample_receptionist.id,
    )

    delete_appointment_logic(appt.id, db_session)

    with pytest.raises(HTTPException) as exc:
        get_appointment_logic(appt.id, db_session)
    assert exc.value.status_code == 404


def test_appointment_route_handlers(db_session, sample_patient, sample_doctor, sample_receptionist):
    from app.routes.appointments import (
        all_appointments,
        get_appointment,
        add_appointment,
        update_appointment,
        delete_appointment,
    )

    user_token = TokenData(id=sample_receptionist.id)
    now = datetime.now(timezone.utc)
    dto = appointmentCreate(
        patient_id=sample_patient.id,
        doctor_id=sample_doctor.id,
        start_at=now + timedelta(hours=3),
        ends_at=now + timedelta(hours=3, minutes=45),
        reason="Route handler test",
        status="scheduled",
    )
    # POST
    created = add_appointment(appointment=dto, db=db_session, user_id=user_token)
    assert created.id is not None
    assert created.reason == "Route handler test"
    assert created.scheduled_by == sample_receptionist.id

    # GET ALL
    all_res = all_appointments(
        patient_id=None,
        doctor_id=None,
        status_filter=None,
        db=db_session,
        user_id=user_token,
    )
    assert len(all_res) >= 1

    # GET ONE
    single = get_appointment(id=created.id, db=db_session, user_id=user_token)
    assert single.id == created.id

    # PUT
    updated = update_appointment(
        id=created.id,
        appointment=appointmentUpdate(status="confirmed"),
        db=db_session,
        user_id=user_token,
    )
    assert updated.status == "confirmed"

    # DELETE
    delete_res = delete_appointment(id=created.id, db=db_session, user_id=user_token)
    assert delete_res is None

    # Verify 404 after deletion
    with pytest.raises(HTTPException) as exc:
        get_appointment(id=created.id, db=db_session, user_id=user_token)
    assert exc.value.status_code == 404


def test_doctor_access_control_and_isolation(db_session, sample_patient, sample_doctor):
    # Create second doctor
    doc2 = User(
        first_name="Allison",
        last_name="Cameron",
        email="cameron@hospital.org",
        password="hashedpassword123",
        role_id=3,  # doctor
        is_active=True,
    )
    db_session.add(doc2)
    db_session.commit()
    db_session.refresh(doc2)

    now = datetime.now(timezone.utc)
    # Doctor 1 schedules an appointment for themselves
    appt1 = add_appointment_logic(
        appointmentCreate(
            patient_id=sample_patient.id,
            doctor_id=sample_doctor.id,
            start_at=now + timedelta(hours=1),
            ends_at=now + timedelta(hours=2),
            reason="Doctor 1 consult",
        ),
        db_session,
        sample_doctor.id,
    )

    # Doctor 2 schedules an appointment for themselves
    appt2 = add_appointment_logic(
        appointmentCreate(
            patient_id=sample_patient.id,
            doctor_id=doc2.id,
            start_at=now + timedelta(hours=3),
            ends_at=now + timedelta(hours=4),
            reason="Doctor 2 consult",
        ),
        db_session,
        doc2.id,
    )

    # Doctor 1 cannot schedule for Doctor 2
    with pytest.raises(HTTPException) as exc:
        add_appointment_logic(
            appointmentCreate(
                patient_id=sample_patient.id,
                doctor_id=doc2.id,
                start_at=now + timedelta(hours=5),
                ends_at=now + timedelta(hours=6),
                reason="Doctor 1 trying to schedule for doc2",
            ),
            db_session,
            sample_doctor.id,
        )
    assert exc.value.status_code == 403

    # Doctor 1 cannot view Doctor 2's appointment
    with pytest.raises(HTTPException) as exc:
        get_appointment_logic(appt2.id, db_session, sample_doctor.id)
    assert exc.value.status_code == 403

    # Doctor 1 can view their own appointment
    fetched = get_appointment_logic(appt1.id, db_session, sample_doctor.id)
    assert fetched.id == appt1.id

    # Doctor 1 filtering returns only Doctor 1's appointments
    doc1_list = all_appointments_logic(db_session, sample_doctor.id)
    assert len(doc1_list) == 1
    assert doc1_list[0].id == appt1.id

    # Doctor 1 cannot update Doctor 2's appointment
    with pytest.raises(HTTPException) as exc:
        update_appointment_logic(
            appt2.id,
            appointmentUpdate(notes="Unauthorized update"),
            db_session,
            sample_doctor.id,
        )
    assert exc.value.status_code == 403

    # Doctor 1 cannot reassign their appointment to Doctor 2
    with pytest.raises(HTTPException) as exc:
        update_appointment_logic(
            appt1.id,
            appointmentUpdate(doctor_id=doc2.id),
            db_session,
            sample_doctor.id,
        )
    assert exc.value.status_code == 403

    # Doctor 1 cannot delete their appointment (must cancel via status instead)
    with pytest.raises(HTTPException) as exc:
        delete_appointment_logic(appt1.id, db_session, sample_doctor.id)
    assert exc.value.status_code == 403


def test_scheduling_conflicts(db_session, sample_patient, sample_doctor, sample_receptionist):
    # Create second patient
    patient2 = Patients(
        first_name="Jane",
        last_name="Smith",
        dob=datetime(1992, 5, 10).date(),
        address="456 Elm St",
        city="Metropolis",
        state="NY",
        postal_code="10002",
        email="jane.smith@example.com",
        phone="+1987654321",
    )
    db_session.add(patient2)
    db_session.commit()
    db_session.refresh(patient2)

    now = datetime.now(timezone.utc)
    base_start = now + timedelta(days=5, hours=10)
    base_ends = base_start + timedelta(minutes=45)

    # Initial appointment
    appt1 = add_appointment_logic(
        appointmentCreate(
            patient_id=sample_patient.id,
            doctor_id=sample_doctor.id,
            start_at=base_start,
            ends_at=base_ends,
            reason="Primary booking",
        ),
        db_session,
        sample_receptionist.id,
    )
    assert appt1.id is not None

    # Conflict 1: Doctor double-booking with different patient
    with pytest.raises(HTTPException) as exc:
        add_appointment_logic(
            appointmentCreate(
                patient_id=patient2.id,
                doctor_id=sample_doctor.id,
                start_at=base_start + timedelta(minutes=15),
                ends_at=base_ends + timedelta(minutes=15),
                reason="Doctor overlap booking",
            ),
            db_session,
            sample_receptionist.id,
        )
    assert exc.value.status_code == 409
    assert "Doctor already has an overlapping appointment" in exc.value.detail

    # Conflict 2: Patient double-booking with different doctor
    doc2 = User(
        first_name="James",
        last_name="Wilson",
        email="wilson@hospital.org",
        password="hashedpassword123",
        role_id=3,
        is_active=True,
    )
    db_session.add(doc2)
    db_session.commit()
    db_session.refresh(doc2)

    with pytest.raises(HTTPException) as exc:
        add_appointment_logic(
            appointmentCreate(
                patient_id=sample_patient.id,
                doctor_id=doc2.id,
                start_at=base_start + timedelta(minutes=15),
                ends_at=base_ends + timedelta(minutes=15),
                reason="Patient overlap booking",
            ),
            db_session,
            sample_receptionist.id,
        )
    assert exc.value.status_code == 409
    assert "Patient already has an active appointment" in exc.value.detail

    # Cancelled appointments do NOT block scheduling
    update_appointment_logic(
        appt1.id,
        appointmentUpdate(status="cancelled"),
        db_session,
        sample_receptionist.id,
    )

    # Now the same time slot can be booked
    appt_rebooked = add_appointment_logic(
        appointmentCreate(
            patient_id=patient2.id,
            doctor_id=sample_doctor.id,
            start_at=base_start,
            ends_at=base_ends,
            reason="Rebooked slot after cancellation",
        ),
        db_session,
        sample_receptionist.id,
    )
    assert appt_rebooked.id is not None


def test_role_enforcement_and_unauthorized_scheduling(db_session, sample_patient, sample_doctor):
    # Create coder user (role_id=4)
    coder = User(
        first_name="Ada",
        last_name="Lovelace",
        email="ada@hospital.org",
        password="hashedpassword123",
        role_id=4,  # coder
        is_active=True,
    )
    db_session.add(coder)
    db_session.commit()
    db_session.refresh(coder)

    now = datetime.now(timezone.utc)
    # 1. Coder cannot schedule appointments (403)
    with pytest.raises(HTTPException) as exc:
        add_appointment_logic(
            appointmentCreate(
                patient_id=sample_patient.id,
                doctor_id=sample_doctor.id,
                start_at=now + timedelta(days=2),
                ends_at=now + timedelta(days=2, minutes=30),
                reason="Coder attempting to schedule",
            ),
            db_session,
            coder.id,
        )
    assert exc.value.status_code == 403
    assert "Only doctors and receptionists" in exc.value.detail

    # 2. Cannot assign coder as appointment doctor (400)
    with pytest.raises(HTTPException) as exc2:
        add_appointment_logic(
            appointmentCreate(
                patient_id=sample_patient.id,
                doctor_id=coder.id,  # not a doctor
                start_at=now + timedelta(days=2),
                ends_at=now + timedelta(days=2, minutes=30),
                reason="Invalid doctor role assignment",
            ),
            db_session,
            sample_doctor.id,
        )
    assert exc2.value.status_code == 403 or exc2.value.status_code == 400
    assert "doctor" in exc2.value.detail.lower()


def test_admin_appointment_view_only(db_session, sample_patient, sample_doctor, sample_receptionist, regular_admin):
    now = datetime.now(timezone.utc)
    # 1. Receptionist creates an appointment
    appt = add_appointment_logic(
        appointmentCreate(
            patient_id=sample_patient.id,
            doctor_id=sample_doctor.id,
            start_at=now + timedelta(days=1),
            ends_at=now + timedelta(days=1, minutes=30),
            reason="Cardiology review",
        ),
        db_session,
        sample_receptionist.id,
    )
    assert appt.id is not None

    # 2. Admin CAN VIEW all appointments
    admin_list = all_appointments_logic(db_session, regular_admin.id)
    assert len(admin_list) >= 1
    assert any(a.id == appt.id for a in admin_list)

    # 3. Admin CAN VIEW specific appointment
    fetched = get_appointment_logic(appt.id, db_session, regular_admin.id)
    assert fetched.id == appt.id

    # 4. Admin CANNOT CREATE appointment (403)
    with pytest.raises(HTTPException) as exc_create:
        add_appointment_logic(
            appointmentCreate(
                patient_id=sample_patient.id,
                doctor_id=sample_doctor.id,
                start_at=now + timedelta(days=2),
                ends_at=now + timedelta(days=2, minutes=30),
                reason="Admin attempting to create",
            ),
            db_session,
            regular_admin.id,
        )
    assert exc_create.value.status_code == 403
    assert "Only doctors and receptionists can schedule appointments" in exc_create.value.detail

    # 5. Admin CANNOT UPDATE appointment (403)
    with pytest.raises(HTTPException) as exc_update:
        update_appointment_logic(
            appt.id,
            appointmentUpdate(notes="Admin edit attempt"),
            db_session,
            regular_admin.id,
        )
    assert exc_update.value.status_code == 403
    assert "You do not have permission to modify appointments" in exc_update.value.detail

    # 6. Admin CANNOT DELETE appointment (403)
    with pytest.raises(HTTPException) as exc_delete:
        delete_appointment_logic(appt.id, db_session, regular_admin.id)
    assert exc_delete.value.status_code == 403
    assert "Only receptionists can delete appointment records" in exc_delete.value.detail

