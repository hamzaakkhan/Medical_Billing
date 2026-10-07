from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth.hash import hash
from app.models.tables import Roles, User
from app.schema.users import role_name, users, usersUpdate


def _get_admin_user_and_role(db: Session, user_id):
    """Helper to authenticate current user and verify admin permission."""
    current_user = db.query(User).filter(User.id == user_id.id).first()
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Current user not found",
        )

    current_role = (
        db.query(Roles).filter(Roles.id == current_user.role_id).first()
    )
    if not current_role or current_role.role != role_name.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This feature is only accessible to admin",
        )

    return current_user, current_role


def create_user_logic(user: users, db: Session, user_id):
    current_user, _ = _get_admin_user_and_role(db, user_id)

    role_str = (
        user.role.value if hasattr(user.role, "value") else str(user.role)
    )

    if role_str == role_name.ADMIN and not current_user.is_root_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the root admin can create an admin",
        )

    clean_email = user.email.strip().lower()

    existing_user = db.query(User).filter(User.email == clean_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email already exists",
        )

    role = db.query(Roles).filter(Roles.role == role_str).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid Role",
        )

    data = user.model_dump(exclude={"role"})
    data["email"] = clean_email
    data["password"] = hash(user.password)
    data["role_id"] = role.id
    data["is_root_admin"] = False

    new_user = User(**data)

    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email already exists",
        )
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user",
        )

    return "User successfully added"


def get_users_logic(db: Session, user_id):
    _get_admin_user_and_role(db, user_id)
    return db.query(User).all()


def get_user_logic(id: int, db: Session, user_id):
    _get_admin_user_and_role(db, user_id)

    target_user = db.query(User).filter(User.id == id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No user with this id exists",
        )
    return target_user


def update_user_logic(
    id: int,
    user: usersUpdate,
    db: Session,
    user_id,
):
    current_user, _ = _get_admin_user_and_role(db, user_id)

    target_user = db.query(User).filter(User.id == id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No user with this id exists",
        )

    target_role = (
        db.query(Roles).filter(Roles.id == target_user.role_id).first()
    )

    us = user.model_dump(exclude_unset=True)
    if not us:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please enter the data",
        )

    # Disallow tampering with is_root_admin flag
    us.pop("is_root_admin", None)

    # Normal admin cannot modify another admin
    if (
        target_user.id != current_user.id
        and target_role
        and target_role.role == role_name.ADMIN
        and not current_user.is_root_admin
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the root admin can modify an admin",
        )

    # Root admin protection
    if target_user.is_root_admin:
        if "is_active" in us and us["is_active"] is False:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Can't deactivate the root admin",
            )

        if "role" in us:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Can't change the root admin's role",
            )

    # Email uniqueness & normalization
    if "email" in us and us["email"] is not None:
        clean_email = us["email"].strip().lower()
        if clean_email != target_user.email:
            existing_email = (
                db.query(User)
                .filter(User.email == clean_email, User.id != id)
                .first()
            )
            if existing_email:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="User with this email already exists",
                )
        us["email"] = clean_email

    # Hash password if provided
    if "password" in us and us["password"]:
        us["password"] = hash(us["password"])

    # Role update & escalation check
    if "role" in us:
        role_val = us.pop("role")
        role_str = (
            role_val.value if hasattr(role_val, "value") else str(role_val)
        )

        # Only root admin can grant admin role
        if role_str == role_name.ADMIN and not current_user.is_root_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the root admin can grant admin role",
            )

        role_obj = db.query(Roles).filter(Roles.role == role_str).first()
        if not role_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invalid Role",
            )

        target_user.role_id = role_obj.id

    for key, val in us.items():
        setattr(target_user, key, val)

    try:
        db.commit()
        db.refresh(target_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email already exists",
        )
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user",
        )

    return "User updated successfully"


def delete_user_logic(id: int, db: Session, user_id):
    current_user, _ = _get_admin_user_and_role(db, user_id)

    target_user = db.query(User).filter(User.id == id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No user with this id exists",
        )

    # Prevent accidental self-deletion
    if target_user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account",
        )

    # Root admin can never be deleted
    if target_user.is_root_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can't delete the root admin",
        )

    target_role = (
        db.query(Roles).filter(Roles.id == target_user.role_id).first()
    )

    # Normal admin cannot delete another admin
    if (
        target_role
        and target_role.role == role_name.ADMIN
        and not current_user.is_root_admin
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the root admin can delete an admin",
        )

    try:
        db.delete(target_user)
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete user",
        )

    return "User deleted successfully"
