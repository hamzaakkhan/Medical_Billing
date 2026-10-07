from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schema.auth import Token
from app.services.login import login_user_logic

router = APIRouter(prefix="/login", tags=["Login"])


@router.post("/", status_code=status.HTTP_200_OK, response_model=Token)
def login_user(
    user: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    return login_user_logic(user, db)