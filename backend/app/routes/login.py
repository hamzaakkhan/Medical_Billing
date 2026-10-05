from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from app.database.database import get_db
from app.models.tables import User
from app.auth.hash import verify_hash, DUMMY_HASH
from app.auth.jwt_auth import create_access_token
from app.schema.auth import Token

router = APIRouter(prefix="/login", tags=["Login"])


@router.post("/", status_code=status.HTTP_200_OK, response_model=Token)
def login_user(user: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    u = db.query(User).filter(User.email == user.username).first()

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

    access_token = create_access_token({"user_id": u.id})


    return {"access_token" : access_token, "token_type" : "bearer"}