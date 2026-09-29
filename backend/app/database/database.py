from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.orm import DeclarativeBase
from fastapi import Depends
from app.config import setting

DATABASE_URL = f"postgresql+psycopg://{setting.DATABASE_USERNAME}:{setting.DATABASE_PASSWORD}@{setting.DATABASE_HOST}/{setting.DATABASE_NAME}"

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(bind=engine)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()