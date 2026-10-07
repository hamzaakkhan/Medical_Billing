import pytest
from fastapi import HTTPException

from app.auth.hash import verify_password
from app.models.tables import User
from app.schema.auth import TokenData
from app.schema.users import role_name, users, usersUpdate
from app.services.users import (
    create_user_logic,
    delete_user_logic,
    get_user_logic,
    get_users_logic,
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


def test_password_is_hashed_on_update(db_session, root_admin, doctor_user):
    update_data = usersUpdate(password="brandNewPassword123")
    res = update_user_logic(
        doctor_user.id,
        update_data,
        db_session,
        TokenData(id=root_admin.id),
    )
    assert res == "User updated successfully"

    db_session.refresh(doctor_user)
    assert doctor_user.password != "brandNewPassword123"
    assert verify_password("brandNewPassword123", doctor_user.password) is True


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
