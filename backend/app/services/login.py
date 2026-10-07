from fastapi import HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.auth.hash import DUMMY_HASH, verify_hash
from app.auth.jwt_auth import create_access_token
from app.models.tables import User


def login_user_logic(user: OAuth2PasswordRequestForm, db: Session):
    clean_username = (user.username or "").strip().lower()
    u = db.query(User).filter(User.email == clean_username).first()

    target_hash = u.password if u else DUMMY_HASH
    is_valid = verify_hash(user.password, target_hash)

    if not u or not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not u.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    access_token = create_access_token({"user_id": u.id, "sub": str(u.id)})

    return {"access_token": access_token, "token_type": "bearer"}