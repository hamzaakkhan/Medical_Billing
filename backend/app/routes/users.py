from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.schema.users import users, usersUpdate, userResponse
from app.services.users import (
    create_user_logic,
    get_users_logic,
    get_user_logic,
    update_user_logic,
    delete_user_logic,
)
from app.auth.jwt_auth import get_current_user
from app.models.tables import User
from fastapi import HTTPException
from app.schema.auth import TokenData
router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/", status_code=200, response_model=list[userResponse])
def get_users(db: Session = Depends(get_db), user_id:TokenData = Depends(get_current_user)):
    return get_users_logic(db, user_id)


@router.get("/{id}", status_code=200, response_model=userResponse)
def get_user(id: int, db: Session = Depends(get_db), user_id:TokenData = Depends(get_current_user)):
    return get_user_logic(id, db, user_id)


@router.post("/", status_code=201)
def create_user(user: users, db: Session = Depends(get_db), user_id:TokenData = Depends(get_current_user)):
    return create_user_logic(user, db, user_id)


@router.put("/{id}", status_code=200)
def update_user(id: int, user: usersUpdate, db: Session = Depends(get_db), user_id:TokenData = Depends(get_current_user)):
    return update_user_logic(id, user, db, user_id)


@router.delete("/{id}", status_code=204)
def delete_user(id: int, db: Session = Depends(get_db), user_id:TokenData = Depends(get_current_user)):
    return delete_user_logic(id, db, user_id)
