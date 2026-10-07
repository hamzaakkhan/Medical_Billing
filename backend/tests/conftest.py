import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.auth.hash import hash_password
from app.models.tables import Base, Roles, User


@pytest.fixture(scope="function")
def db_session():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(
        autocommit=False, autoflush=False, bind=engine
    )
    session = TestingSessionLocal()

    # Seed roles
    roles = [
        Roles(id=1, role="admin"),
        Roles(id=2, role="receptionist"),
        Roles(id=3, role="doctor"),
        Roles(id=4, role="coder"),
        Roles(id=5, role="biller"),
    ]
    session.add_all(roles)
    session.commit()

    yield session

    session.close()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def root_admin(db_session):
    user = User(
        first_name="Root",
        last_name="Admin",
        email="root@admin.com",
        password=hash_password("rootpassword123"),
        role_id=1,
        is_active=True,
        is_root_admin=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def regular_admin(db_session):
    user = User(
        first_name="Regular",
        last_name="Admin",
        email="admin@hospital.com",
        password=hash_password("adminpassword123"),
        role_id=1,
        is_active=True,
        is_root_admin=False,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def doctor_user(db_session):
    user = User(
        first_name="Doctor",
        last_name="Who",
        email="doctor@hospital.com",
        password=hash_password("doctorpassword123"),
        role_id=3,
        is_active=True,
        is_root_admin=False,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user
