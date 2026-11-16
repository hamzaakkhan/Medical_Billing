from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    text,
)
from sqlalchemy.sql import func

from app.database.database import Base


class Roles(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True)
    role = Column(String, nullable=False, unique=True)

    __table_args__ = (
        CheckConstraint(
            "role IN ('admin', 'receptionist', 'doctor', 'coder', 'biller')",
            name="check_valid_role_names",
        ),
    )


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    first_name = Column(String, nullable=False)
    middle_name = Column(String, nullable=True)
    last_name = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True, index=True)
    password = Column(String, nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    is_root_admin = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index(
            "uq_one_root_admin",
            "is_root_admin",
            unique=True,
            postgresql_where=text("is_root_admin = true"),
            sqlite_where=text("is_root_admin = 1"),
        ),
    )




