from fastapi import Depends, HTTPException
from app.auth.hash import verify_hash, DUMMY_HASH
from app.auth.jwt_auth import create_access_token
from app.models.tables import User


def login_user_logic(user, db):
    u = db.query(User).filter(User.email == user.username).first()
    
    target_hash = u.password if u else DUMMY_HASH
    is_valid = verify_hash(user.password, target_hash)

    if not u or not is_valid:
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not u.is_active:
        raise HTTPException(
            status_code=403,
            detail="Account is deactivated",
        )

    access_token = create_access_token({"user_id": u.id})


    return {"access_token" : access_token, "token_type" : "bearer"}