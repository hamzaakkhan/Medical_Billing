from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.tables import User, Roles
from app.schema.users import users, usersUpdate


def create_user_logic(user: users, db: Session):
    u = db.query(User).filter(User.email == user.email).first()
    if u:
        raise HTTPException(status_code=409, detail="User with this email already exists")

    role_val = user.role.value if hasattr(user.role, "value") else user.role
    role = db.query(Roles).filter(Roles.role == role_val).first()
    if not role:
        raise HTTPException(status_code=404, detail="Invalid Role")

    data = user.model_dump(exclude={"role"})
    data["role_id"] = role.id
    new_user = User(**data)

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return "User successfully added"


def get_users_logic(db: Session):
    return db.query(User).all()


def get_user_logic(id: int, db: Session):
    u = db.query(User).filter(User.id == id).first()
    if not u:
        raise HTTPException(status_code=404, detail="No user with this id exists")
    return u


def update_user_logic(id: int, user: usersUpdate, db: Session):
    u = db.query(User).filter(User.id == id).first()
    if not u:
        raise HTTPException(status_code=404, detail="No user with this id exists")

    us = user.model_dump(exclude_unset=True)
    if not us:
        raise HTTPException(status_code=400, detail="Please enter the data")

    if "email" in us and us["email"] != u.email:
        existing_email = db.query(User).filter(User.email == us["email"], User.id != id).first()
        if existing_email:
            raise HTTPException(status_code=409, detail="User with this email already exists")

    if "role" in us:
        role_val = us.pop("role")
        role_str = role_val.value if hasattr(role_val, "value") else role_val
        role_obj = db.query(Roles).filter(Roles.role == role_str).first()
        if not role_obj:
            raise HTTPException(status_code=404, detail="Invalid Role")
        u.role_id = role_obj.id

    for key, val in us.items():
        setattr(u, key, val)

    db.commit()
    db.refresh(u)
    return "User updated successfully"


def delete_user_logic(id: int, db: Session):
    u = db.query(User).filter(User.id == id).first()
    if not u:
        raise HTTPException(status_code=404, detail="No user with this id exists")

    db.delete(u)
    db.commit()
    return
