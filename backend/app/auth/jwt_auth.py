import jwt
from jwt.exceptions import InvalidTokenError
from app.config import setting
from datetime import datetime, timezone, timedelta
from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends, HTTPException
from app.schema.auth import TokenData

oauth = OAuth2PasswordBearer(tokenUrl="/login")

SECRET_KEY = setting.SECRET_KEY
ALGORITHM = setting.ALGORITHM
ACCESS_TOKEN_EXPIRATION = setting.ACCESS_TOKEN_EXPIRY

def create_access_token(data:dict , expiry : timedelta = ACCESS_TOKEN_EXPIRATION):
    d = data.copy()

    exp = datetime.now(timezone.utc) + timedelta(minutes=expiry)
    d.update({"exp" : exp})

    encode_jwt = jwt.encode(d, SECRET_KEY, algorithm=ALGORITHM)

    return encode_jwt

def get_current_user(token:str = Depends(oauth)):
    credential_exception = HTTPException(status_code=401, detail="Could not verify credentials", headers={"WWW-Authenticate": "Bearer"})
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise credential_exception
        print(user_id)
        return TokenData(id=user_id)
    except InvalidTokenError:
        raise credential_exception