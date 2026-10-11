from fastapi import APIRouter, Depends, Path, status
from sqlalchemy.orm import Session

from app.auth.jwt_auth import get_current_user
from app.database.database import get_db
from app.schema.auth import TokenData
from app.schema.users import (
    passwordChangeRequest,
    userProfileResponse,
    userProfileUpdate,
    userResponse,
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

router = APIRouter(prefix="/users", tags=["Users"])


@router.get(
    "/me", status_code=status.HTTP_200_OK, response_model=userProfileResponse
)
def get_current_user_profile(
    db: Session = Depends(get_db),
    user_id: TokenData = Depends(get_current_user),
):
    return get_current_user_profile_logic(db, user_id)


@router.put(
    "/me", status_code=status.HTTP_200_OK, response_model=userProfileResponse
)
def update_current_user_profile(
    profile_data: userProfileUpdate,
    db: Session = Depends(get_db),
    user_id: TokenData = Depends(get_current_user),
):
    return update_current_user_profile_logic(profile_data, db, user_id)


@router.put("/me/password", status_code=status.HTTP_200_OK)
def change_password(
    password_data: passwordChangeRequest,
    db: Session = Depends(get_db),
    user_id: TokenData = Depends(get_current_user),
):
    return change_password_logic(password_data, db, user_id)


@router.get(
    "/", status_code=status.HTTP_200_OK, response_model=list[userResponse]
)
def get_users(
    db: Session = Depends(get_db),
    user_id: TokenData = Depends(get_current_user),
):
    return get_users_logic(db, user_id)


@router.get(
    "/{id}", status_code=status.HTTP_200_OK, response_model=userResponse
)
def get_user(
    id: int = Path(..., gt=0),
    db: Session = Depends(get_db),
    user_id: TokenData = Depends(get_current_user),
):
    return get_user_logic(id, db, user_id)


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_user(
    user: users,
    db: Session = Depends(get_db),
    user_id: TokenData = Depends(get_current_user),
):
    return create_user_logic(user, db, user_id)


@router.put("/{id}", status_code=status.HTTP_200_OK)
def update_user(
    id: int = Path(..., gt=0),
    user: usersUpdate = ...,
    db: Session = Depends(get_db),
    user_id: TokenData = Depends(get_current_user),
):
    return update_user_logic(id, user, db, user_id)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    id: int = Path(..., gt=0),
    db: Session = Depends(get_db),
    user_id: TokenData = Depends(get_current_user),
):
    delete_user_logic(id, db, user_id)
    return None

