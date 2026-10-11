from app.database.database import Base
from sqlalchemy import Column, Integer, String, ForeignKey, TIMESTAMP, DateTime
from sqlalchemy.sql import func

class appointments(Base):
    __tablename__ = "appointments"

    id = Column(Integer, nullable=False, primary_key=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    scheduled_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    start_at = Column(TIMESTAMP, nullable=False)
    ends_at = Column(TIMESTAMP, nullable=False)
    reason = Column(String, nullable=False)
    status = Column(String, nullable=False)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())