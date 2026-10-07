from datetime import datetime, timedelta, timezone
import jwt
from jwt.exceptions import PyJWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.config import setting
from app.database.database import get_db
from app.models.tables import User
from app.schema.auth import TokenData

oauth = OAuth2PasswordBearer(tokenUrl="/login")

SECRET_KEY = setting.SECRET_KEY
ALGORITHM = setting.ALGORITHM
ACCESS_TOKEN_EXPIRATION = setting.ACCESS_TOKEN_EXPIRY


def create_access_token(
    data: dict, expiry: timedelta | int | None = None
) -> str:
    d = data.copy()

    now = datetime.now(timezone.utc)
    if expiry is None:
        exp = now + timedelta(minutes=int(ACCESS_TOKEN_EXPIRATION))
    elif isinstance(expiry, timedelta):
        exp = now + expiry
    else:
        exp = now + timedelta(minutes=int(expiry))

    d.setdefault("iat", int(now.timestamp()))
    d["exp"] = int(exp.timestamp())

    encode_jwt = jwt.encode(d, SECRET_KEY, algorithm=ALGORITHM)
    return encode_jwt


def get_current_user(
    token: str = Depends(oauth), db: Session = Depends(get_db)
) -> TokenData:
    credential_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not verify credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_val = payload.get("user_id") or payload.get("sub")
        if user_id_val is None:
            raise credential_exception
        user_id = int(user_id_val)
    except (PyJWTError, ValueError, TypeError):
        raise credential_exception

    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise credential_exception
    if not u.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    return TokenData(id=user_id)