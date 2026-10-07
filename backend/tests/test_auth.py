from datetime import timedelta
import pytest
from fastapi import HTTPException
from fastapi.security import OAuth2PasswordRequestForm
import jwt

from app.auth.hash import DUMMY_HASH, hash_password, verify_password
from app.auth.jwt_auth import (
    ALGORITHM,
    SECRET_KEY,
    create_access_token,
    get_current_user,
)
from app.schema.auth import TokenData
from app.services.login import login_user_logic


def test_hash_and_verify():
    pwd = "SecurePassword123!"
    h = hash_password(pwd)
    assert h.startswith("$argon2id$")
    assert verify_password(pwd, h) is True
    assert verify_password("WrongPassword", h) is False


def test_verify_password_safe_with_corrupt_hash():
    assert verify_password("test", "corrupted_non_hash_string") is False
    assert verify_password("test", None) is False
    assert verify_password(None, "$argon2id$something") is False
    assert verify_password("", "") is False


def test_dummy_hash_timing_mitigation():
    assert verify_password("any_password", DUMMY_HASH) is False


def test_create_and_decode_jwt():
    token = create_access_token({"user_id": 42})
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    assert payload["user_id"] == 42
    assert "exp" in payload
    assert "iat" in payload


def test_create_jwt_with_timedelta():
    token = create_access_token({"user_id": 10}, expiry=timedelta(minutes=5))
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    assert payload["user_id"] == 10


def test_expired_jwt_rejected(db_session, root_admin):
    expired_token = create_access_token(
        {"user_id": root_admin.id}, expiry=timedelta(minutes=-10)
    )
    with pytest.raises(HTTPException) as exc:
        get_current_user(token=expired_token, db=db_session)
    assert exc.value.status_code == 401


def test_login_success(db_session, root_admin):
    class FakeForm:
        username = "ROOT@admin.com "
        password = "rootpassword123"

    res = login_user_logic(FakeForm(), db_session)
    assert "access_token" in res
    assert res["token_type"] == "bearer"

    # Verify the returned token identifies root_admin
    token_data = get_current_user(token=res["access_token"], db=db_session)
    assert token_data.id == root_admin.id


def test_login_invalid_password(db_session, root_admin):
    class FakeForm:
        username = "root@admin.com"
        password = "wrongpassword"

    with pytest.raises(HTTPException) as exc:
        login_user_logic(FakeForm(), db_session)
    assert exc.value.status_code == 401
    assert "Invalid credentials" in exc.value.detail


def test_login_deactivated_account(db_session, root_admin):
    root_admin.is_active = False
    db_session.commit()

    class FakeForm:
        username = "root@admin.com"
        password = "rootpassword123"

    with pytest.raises(HTTPException) as exc:
        login_user_logic(FakeForm(), db_session)
    assert exc.value.status_code == 403
    assert "Account is deactivated" in exc.value.detail


def test_get_current_user_deactivated(db_session, root_admin):
    token = create_access_token({"user_id": root_admin.id})
    root_admin.is_active = False
    db_session.commit()

    with pytest.raises(HTTPException) as exc:
        get_current_user(token=token, db=db_session)
    assert exc.value.status_code == 403
