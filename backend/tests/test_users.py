import pytest
from fastapi import HTTPException

from app.auth.hash import verify_password
from app.models.appointments import appointments
from app.models.patients import Patients
from app.models.users import User
from app.schema.auth import TokenData
from app.schema.users import (
    passwordChangeRequest,
    role_name,
    userProfileUpdate,
    users,
    usersUpdate,
)
from app.services.users import (
    change_password_logic,
    create_user_logic,
    delete_user_logic,
    get_current_user_profile_logic,
    get_user_logic,
    get_users_logic,
    update_current_user_profile_logic,
    update_user_logic,
)


def test_non_admin_cannot_list_users(db_session, doctor_user):
    with pytest.raises(HTTPException) as exc:
        get_users_logic(db_session, TokenData(id=doctor_user.id))
    assert exc.value.status_code == 403


def test_regular_admin_cannot_create_admin(db_session, regular_admin):
    new_user_data = users(
        first_name="New",
        last_name="Admin",
        email="newadmin@hospital.com",
        password="securePassword123",
        role=role_name.ADMIN,
        is_active=True,
    )
    with pytest.raises(HTTPException) as exc:
        create_user_logic(
            new_user_data, db_session, TokenData(id=regular_admin.id)
        )
    assert exc.value.status_code == 403
    assert "Only the root admin can create an admin" in exc.value.detail


def test_root_admin_can_create_admin(db_session, root_admin):
    new_user_data = users(
        first_name="Second",
        last_name="Admin",
        email="secondadmin@hospital.com",
        password="securePassword123",
        role=role_name.ADMIN,
        is_active=True,
    )
    res = create_user_logic(
        new_user_data, db_session, TokenData(id=root_admin.id)
    )
    assert res == "User successfully added"

    created = (
        db_session.query(User)
        .filter(User.email == "secondadmin@hospital.com")
        .first()
    )
    assert created is not None
    assert created.role_id == 1
    assert created.is_root_admin is False  # Cannot escalate to root admin
    assert verify_password("securePassword123", created.password) is True


def test_regular_admin_can_create_doctor(db_session, regular_admin):
    new_user_data = users(
        first_name="Jane",
        last_name="Smith",
        email="jane.smith@hospital.com",
        password="doctorPassword123",
        role=role_name.DOCTOR,
        is_active=True,
    )
    res = create_user_logic(
        new_user_data, db_session, TokenData(id=regular_admin.id)
    )
    assert res == "User successfully added"


def test_duplicate_email_rejected(db_session, root_admin):
    new_user_data = users(
        first_name="Dup",
        last_name="User",
        email=root_admin.email,
        password="password12345",
        role=role_name.DOCTOR,
        is_active=True,
    )
    with pytest.raises(HTTPException) as exc:
        create_user_logic(
            new_user_data, db_session, TokenData(id=root_admin.id)
        )
    assert exc.value.status_code == 409


def test_password_is_hashed_on_update(db_session, root_admin):
    update_data = usersUpdate(password="brandNewPassword123")
    res = update_user_logic(
        root_admin.id,
        update_data,
        db_session,
        TokenData(id=root_admin.id),
    )
    assert res == "User updated successfully"

    db_session.refresh(root_admin)
    assert root_admin.password != "brandNewPassword123"
    assert verify_password("brandNewPassword123", root_admin.password) is True


def test_admin_cannot_change_another_user_password(
    db_session, root_admin, regular_admin, doctor_user
):
    update_data = usersUpdate(password="hackedPassword123")
    # Root admin attempting to change doctor's password
    with pytest.raises(HTTPException) as exc:
        update_user_logic(
            doctor_user.id,
            update_data,
            db_session,
            TokenData(id=root_admin.id),
        )
    assert exc.value.status_code == 403
    assert "Only the currently authenticated user can change their own password" in exc.value.detail

    # Regular admin attempting to change doctor's password
    with pytest.raises(HTTPException) as exc2:
        update_user_logic(
            doctor_user.id,
            update_data,
            db_session,
            TokenData(id=regular_admin.id),
        )
    assert exc2.value.status_code == 403
    assert "Only the currently authenticated user can change their own password" in exc2.value.detail


def test_regular_admin_cannot_promote_to_admin(
    db_session, regular_admin, doctor_user
):
    update_data = usersUpdate(role=role_name.ADMIN)
    with pytest.raises(HTTPException) as exc:
        update_user_logic(
            doctor_user.id,
            update_data,
            db_session,
            TokenData(id=regular_admin.id),
        )
    assert exc.value.status_code == 403
    assert "Only the root admin can grant admin role" in exc.value.detail


def test_regular_admin_cannot_modify_another_admin(
    db_session, regular_admin, root_admin
):
    update_data = usersUpdate(first_name="Hacked")
    with pytest.raises(HTTPException) as exc:
        update_user_logic(
            root_admin.id,
            update_data,
            db_session,
            TokenData(id=regular_admin.id),
        )
    assert exc.value.status_code == 403


def test_cannot_deactivate_or_reassign_root_admin(db_session, root_admin):
    # Root admin attempting to deactivate self
    with pytest.raises(HTTPException) as exc:
        update_user_logic(
            root_admin.id,
            usersUpdate(is_active=False),
            db_session,
            TokenData(id=root_admin.id),
        )
    assert exc.value.status_code == 403
    assert "Can't deactivate the root admin" in exc.value.detail

    # Root admin attempting to change role
    with pytest.raises(HTTPException) as exc2:
        update_user_logic(
            root_admin.id,
            usersUpdate(role=role_name.DOCTOR),
            db_session,
            TokenData(id=root_admin.id),
        )
    assert exc2.value.status_code == 403
    assert "Can't change the root admin's role" in exc2.value.detail


def test_cannot_delete_root_admin(db_session, root_admin):
    with pytest.raises(HTTPException) as exc:
        delete_user_logic(
            root_admin.id, db_session, TokenData(id=root_admin.id)
        )
    # Blocked either by self-deletion or root-admin check
    assert exc.value.status_code in (400, 403)


def test_cannot_delete_own_account(db_session, regular_admin):
    with pytest.raises(HTTPException) as exc:
        delete_user_logic(
            regular_admin.id, db_session, TokenData(id=regular_admin.id)
        )
    assert exc.value.status_code == 400
    assert "Cannot delete your own account" in exc.value.detail


def test_regular_admin_cannot_delete_another_admin(
    db_session, regular_admin, root_admin
):
    with pytest.raises(HTTPException) as exc:
        delete_user_logic(
            root_admin.id, db_session, TokenData(id=regular_admin.id)
        )
    assert exc.value.status_code in (403, 400)


def test_root_admin_can_delete_user(db_session, root_admin, doctor_user):
    res = delete_user_logic(
        doctor_user.id, db_session, TokenData(id=root_admin.id)
    )
    assert res == "User deleted successfully"
    assert (
        db_session.query(User).filter(User.id == doctor_user.id).first() is None
    )


def test_cannot_delete_user_with_appointments_as_doctor(
    db_session, root_admin, doctor_user
):
    from datetime import datetime, timezone, timedelta
    patient = Patients(
        first_name="Jane",
        last_name="Doe",
        dob=datetime(1995, 5, 5).date(),
        address="100 Hospital Way",
        city="HealthCity",
        state="CA",
        postal_code="90210",
        email="jane.doe@example.com",
        phone="+1987654321",
    )
    db_session.add(patient)
    db_session.commit()

    now = datetime.now(timezone.utc)
    appt = appointments(
        patient_id=patient.id,
        doctor_id=doctor_user.id,
        scheduled_by=root_admin.id,
        start_at=now,
        ends_at=now + timedelta(minutes=30),
        reason="Consultation",
        status="scheduled",
    )
    db_session.add(appt)
    db_session.commit()

    with pytest.raises(HTTPException) as exc:
        delete_user_logic(
            doctor_user.id, db_session, TokenData(id=root_admin.id)
        )
    assert exc.value.status_code == 409
    assert "associated with existing appointment records" in exc.value.detail
    assert "Deactivate" in exc.value.detail


def test_cannot_delete_user_with_appointments_as_scheduler(
    db_session, root_admin, regular_admin, doctor_user
):
    from datetime import datetime, timezone, timedelta
    patient = Patients(
        first_name="Bob",
        last_name="Smith",
        dob=datetime(1980, 2, 2).date(),
        address="200 Main St",
        city="HealthCity",
        state="CA",
        postal_code="90210",
        email="bob.smith@example.com",
        phone="+1234567800",
    )
    db_session.add(patient)
    db_session.commit()

    now = datetime.now(timezone.utc)
    appt = appointments(
        patient_id=patient.id,
        doctor_id=doctor_user.id,
        scheduled_by=regular_admin.id,
        start_at=now,
        ends_at=now + timedelta(minutes=30),
        reason="Follow up",
        status="scheduled",
    )
    db_session.add(appt)
    db_session.commit()

    with pytest.raises(HTTPException) as exc:
        delete_user_logic(
            regular_admin.id, db_session, TokenData(id=root_admin.id)
        )
    assert exc.value.status_code == 409
    assert "associated with existing appointment records" in exc.value.detail


def test_get_current_user_profile(db_session, doctor_user, root_admin):
    # Non-admin user can fetch their own profile
    doc_profile = get_current_user_profile_logic(
        db_session, TokenData(id=doctor_user.id)
    )
    assert doc_profile["id"] == doctor_user.id
    assert doc_profile["email"] == doctor_user.email
    assert doc_profile["role"] == "doctor"
    assert doc_profile["is_active"] is True
    assert doc_profile["is_root_admin"] is False

    # Root admin can fetch their own profile
    admin_profile = get_current_user_profile_logic(
        db_session, TokenData(id=root_admin.id)
    )
    assert admin_profile["id"] == root_admin.id
    assert admin_profile["role"] == "admin"
    assert admin_profile["is_root_admin"] is True


def test_update_current_user_profile_success(db_session, doctor_user):
    update_data = userProfileUpdate(
        first_name="Gregory",
        middle_name="V",
        last_name="House",
        email="greg.house@clinic.com",
    )
    res = update_current_user_profile_logic(
        update_data, db_session, TokenData(id=doctor_user.id)
    )
    assert res["first_name"] == "Gregory"
    assert res["middle_name"] == "V"
    assert res["last_name"] == "House"
    assert res["email"] == "greg.house@clinic.com"

    db_session.refresh(doctor_user)
    assert doctor_user.first_name == "Gregory"
    assert doctor_user.email == "greg.house@clinic.com"


def test_update_current_user_profile_duplicate_email(
    db_session, doctor_user, root_admin
):
    update_data = userProfileUpdate(
        first_name="Gregory",
        last_name="House",
        email=root_admin.email,  # already taken by root_admin
    )
    with pytest.raises(HTTPException) as exc:
        update_current_user_profile_logic(
            update_data, db_session, TokenData(id=doctor_user.id)
        )
    assert exc.value.status_code == 409
    assert "User with this email already exists" in exc.value.detail


def test_change_password_success(db_session, doctor_user):
    pw_data = passwordChangeRequest(
        current_password="doctorpassword123",
        new_password="NewSecureDoctorPassword99!",
    )
    res = change_password_logic(
        pw_data, db_session, TokenData(id=doctor_user.id)
    )
    assert res["message"] == "Password updated successfully"

    db_session.refresh(doctor_user)
    assert verify_password("NewSecureDoctorPassword99!", doctor_user.password) is True


def test_change_password_wrong_current_password(db_session, doctor_user):
    pw_data = passwordChangeRequest(
        current_password="completelyWrongPassword",
        new_password="NewSecureDoctorPassword99!",
    )
    with pytest.raises(HTTPException) as exc:
        change_password_logic(
            pw_data, db_session, TokenData(id=doctor_user.id)
        )
    assert exc.value.status_code == 400
    assert "Current password is incorrect" in exc.value.detail


def test_change_password_same_as_old(db_session, doctor_user):
    pw_data = passwordChangeRequest(
        current_password="doctorpassword123",
        new_password="doctorpassword123",
    )
    with pytest.raises(HTTPException) as exc:
        change_password_logic(
            pw_data, db_session, TokenData(id=doctor_user.id)
        )
    assert exc.value.status_code == 400
    assert "New password must be different from current password" in exc.value.detail


def test_profile_update_schema_rejects_forbidden_fields():
    from pydantic import ValidationError

    # Attempting to tamper with role or is_root_admin fails schema validation
    with pytest.raises(ValidationError):
        userProfileUpdate(
            first_name="Stephen",
            last_name="Strange",
            email="dr.strange@clinic.com",
            role="admin",
        )

    with pytest.raises(ValidationError):
        userProfileUpdate(
            first_name="Stephen",
            last_name="Strange",
            email="dr.strange@clinic.com",
            is_root_admin=True,
        )

    with pytest.raises(ValidationError):
        userProfileUpdate(
            first_name="Stephen",
            last_name="Strange",
            email="dr.strange@clinic.com",
            is_active=True,
        )

