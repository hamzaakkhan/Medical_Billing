from app.database.database import Base
from sqlalchemy import Column, Integer, String, ForeignKey, Date

class Patients(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True)
    first_name = Column(String, nullable=False)
    middle_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    dob = Column(Date, nullable=False)
    address = Column(String, nullable=False)
    city = Column(String, nullable=False)
    state = Column(String, nullable=False)
    postal_code = Column(String, nullable=False)
    email = Column(String, nullable=False)
    emergency_phone = Column(String, nullable=True)
    phone = Column(String, nullable=False)
    #insurance = Column(Integer, ForeignKey(insurance.id), nullable=True)

