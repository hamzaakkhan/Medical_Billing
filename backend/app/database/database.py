from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from app.config import setting

db_port = (
    int(setting.DATABASE_PORT)
    if setting.DATABASE_PORT and str(setting.DATABASE_PORT).isdigit()
    else 5432
)

DATABASE_URL = URL.create(
    drivername="postgresql+psycopg",
    username=setting.DATABASE_USERNAME,
    password=setting.DATABASE_PASSWORD,
    host=setting.DATABASE_HOST,
    port=db_port,
    database=setting.DATABASE_NAME,
)

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()