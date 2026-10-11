from app.database.database import Base
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func


class appointments(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    doctor_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    scheduled_by = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    start_at = Column(DateTime(timezone=True), nullable=False, index=True)
    ends_at = Column(DateTime(timezone=True), nullable=False)
    reason = Column(String(255), nullable=False)
    status = Column(String(50), nullable=False, default="scheduled", index=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Joined relationships for easy relational access
    patient = relationship("Patients", foreign_keys=[patient_id], lazy="joined")
    doctor = relationship("User", foreign_keys=[doctor_id], lazy="joined")
    scheduler = relationship("User", foreign_keys=[scheduled_by], lazy="joined")


# Canonical model alias
Appointment = appointments