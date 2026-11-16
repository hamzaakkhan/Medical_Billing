import logging
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import text, update
from sqlalchemy.orm import Session

from app.database.database import SessionLocal
from app.models.appointments import Appointment, appointments
from app.models.patients import Patients
from app.models.users import Roles, User
from app.schema.appointments import appointmentCreate, appointmentUpdate
from app.schema.users import role_name

logger = logging.getLogger(__name__)

# PostgreSQL advisory lock key (arbitrary 64-bit signed int) to prevent concurrent runs across workers
NOSHOW_ADVISORY_LOCK_ID = 847291047

INACTIVE_STATUSES = {"cancelled", "no_show"}


def _get_user_and_role(db: Session, user_id):
    """Retrieve user and role name for authorization."""
    uid = user_id.id if hasattr(user_id, "id") else user_id
    user = db.query(User).filter(User.id == uid).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found or deactivated",
        )
    role_obj = db.query(Roles).filter(Roles.id == user.role_id).first()
    role_str = role_obj.role.lower() if role_obj else ""
    return user, role_str


def _verify_doctor(db: Session, doctor_id: int, for_update: bool = False):
    """Ensure doctor exists, is active, and possesses the doctor role."""
    query = db.query(User).filter(User.id == doctor_id)
    bind = db.get_bind() if hasattr(db, "get_bind") else db.bind
    if for_update and bind and bind.dialect.name != "sqlite":
        query = query.with_for_update()
    doctor = query.first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Doctor with id {doctor_id} does not exist",
        )
    if not doctor.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assigned doctor account is deactivated",
        )
    doctor_role = db.query(Roles).filter(Roles.id == doctor.role_id).first()
    if not doctor_role or doctor_role.role.lower() != role_name.DOCTOR.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with id {doctor_id} does not have the doctor role",
        )
    return doctor



def _check_conflicts(
    db: Session,
    doctor_id: int,
    patient_id: int,
    start_at: datetime,
    ends_at: datetime,
    exclude_id: int | None = None,
):
    """Ensure doctor and patient have no overlapping active appointments."""
    # Doctor overlap
    doc_q = db.query(appointments).filter(
        appointments.doctor_id == doctor_id,
        appointments.status.notin_(INACTIVE_STATUSES),
        appointments.start_at < ends_at,
        appointments.ends_at > start_at,
    )
    if exclude_id is not None:
        doc_q = doc_q.filter(appointments.id != exclude_id)
    if doc_q.first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Doctor already has an overlapping appointment during this time window",
        )

    # Patient overlap
    pat_q = db.query(appointments).filter(
        appointments.patient_id == patient_id,
        appointments.status.notin_(INACTIVE_STATUSES),
        appointments.start_at < ends_at,
        appointments.ends_at > start_at,
    )
    if exclude_id is not None:
        pat_q = pat_q.filter(appointments.id != exclude_id)
    if pat_q.first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Patient already has an active appointment during this time window",
        )


def all_appointments_logic(
    db: Session,
    user_id=None,
    patient_id: int | None = None,
    doctor_id: int | None = None,
    status_filter: str | None = None,
):
    """Retrieve appointments with doctor isolation and optional filters."""
    query = db.query(appointments)

    if user_id is not None:
        user, role = _get_user_and_role(db, user_id)
        if role == role_name.DOCTOR.value:
            query = query.filter(appointments.doctor_id == user.id)
        elif doctor_id is not None:
            query = query.filter(appointments.doctor_id == doctor_id)
    elif doctor_id is not None:
        query = query.filter(appointments.doctor_id == doctor_id)

    if patient_id is not None:
        query = query.filter(appointments.patient_id == patient_id)

    if status_filter:
        query = query.filter(appointments.status == status_filter.strip().lower())

    return query.order_by(appointments.start_at.asc()).all()


def get_appointment_logic(id: int, db: Session, user_id=None):
    """Retrieve appointment by ID with doctor authorization check."""
    appt = db.query(appointments).filter(appointments.id == id).first()
    if not appt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No appointment with this id",
        )

    if user_id is not None:
        user, role = _get_user_and_role(db, user_id)
        if role == role_name.DOCTOR.value and appt.doctor_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Doctors can only view their own appointments",
            )

    return appt


def add_appointment_logic(appointment_data: appointmentCreate, db: Session, user_id):
    """Schedule a new appointment with role authorization and conflict checks."""
    if isinstance(user_id, Session) and not isinstance(db, Session):
        db, user_id = user_id, db

    user, role = _get_user_and_role(db, user_id)

    allowed = {role_name.RECEPTIONIST.value, role_name.DOCTOR.value}
    if role not in allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors and receptionists can schedule appointments",
        )

    if role == role_name.DOCTOR.value and appointment_data.doctor_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Doctors can only schedule appointments for themselves",
        )

    patient = db.query(Patients).filter(Patients.id == appointment_data.patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with id {appointment_data.patient_id} does not exist",
        )

    now = datetime.now(timezone.utc)

    if appointment_data.start_at < now:
        raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail="Cannot schedule appointments in the past",
    )

    _verify_doctor(db, appointment_data.doctor_id, for_update=True)
    _check_conflicts(
        db,
        appointment_data.doctor_id,
        appointment_data.patient_id,
        appointment_data.start_at,
        appointment_data.ends_at,
    )

    data = appointment_data.model_dump()
    data["scheduled_by"] = user.id

    appt = appointments(**data)
    try:
        db.add(appt)
        db.commit()
        db.refresh(appt)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to schedule appointment",
        )

    return appt


def update_appointment_logic(id: int, appointment_data: appointmentUpdate, db: Session, user_id=None):
    """Update appointment details, notes, or status with authorization."""
    appt = db.query(appointments).filter(appointments.id == id).first()
    if not appt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No appointment with this id",
        )

    if user_id is not None:
        user, role = _get_user_and_role(db, user_id)
        if role == role_name.DOCTOR.value:
            if appt.doctor_id != user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: Doctors can only update their own appointments",
                )
            if appointment_data.doctor_id is not None and appointment_data.doctor_id != user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Doctors cannot reassign appointment doctor",
                )
            if appointment_data.patient_id is not None and appointment_data.patient_id != appt.patient_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Doctors cannot reassign appointment patient",
                )
        elif role not in {role_name.RECEPTIONIST.value}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to modify appointments",
            )

    updated_fields = appointment_data.model_dump(exclude_unset=True)
    if not updated_fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide at least one field to update",
        )

    if updated_fields.get("patient_id") is not None:
        patient = db.query(Patients).filter(Patients.id == updated_fields["patient_id"]).first()
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Patient with id {updated_fields['patient_id']} does not exist",
            )

    if updated_fields.get("doctor_id") is not None:
        _verify_doctor(db, updated_fields["doctor_id"])

    new_start = updated_fields.get("start_at", appt.start_at)
    new_ends = updated_fields.get("ends_at", appt.ends_at)
    new_doctor = updated_fields.get("doctor_id", appt.doctor_id)
    new_patient = updated_fields.get("patient_id", appt.patient_id)

    if any(k in updated_fields for k in ("start_at", "ends_at", "doctor_id", "patient_id")):
        if new_ends <= new_start:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ends_at must be strictly after start_at",
            )
        _check_conflicts(db, new_doctor, new_patient, new_start, new_ends, exclude_id=appt.id)

    for field, val in updated_fields.items():
        setattr(appt, field, val)

    try:
        db.commit()
        db.refresh(appt)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update appointment record",
        )

    return appt


def delete_appointment_logic(id: int, db: Session, user_id=None):
    """Delete an appointment record (receptionists only)."""
    appt = db.query(appointments).filter(appointments.id == id).first()
    if not appt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No appointment with this id",
        )

    if user_id is not None:
        user, role = _get_user_and_role(db, user_id)
        if role not in {role_name.RECEPTIONIST.value}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only receptionists can delete appointment records. Doctors may cancel appointments by updating status to 'cancelled'.",
            )

    try:
        db.delete(appt)
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete appointment record",
        )

    return None

# NO SHOW FUNCTIONALITY FOR APPOINTMENTS
def change_to_noshow(db: Session | None = None, as_of: datetime | None = None) -> int:

    target_time = as_of if as_of is not None else datetime.now(timezone.utc)
    if target_time.tzinfo is None:
        target_time = target_time.replace(tzinfo=timezone.utc)

    manage_session = db is None
    session: Session = SessionLocal() if manage_session else db

    try:
        bind = session.get_bind() if hasattr(session, "get_bind") else session.bind
        # If running on PostgreSQL with multiple workers, acquire advisory transaction lock
        if bind and bind.dialect.name == "postgresql":
            lock_acquired = session.execute(
                text("SELECT pg_try_advisory_xact_lock(:lock_id)"),
                {"lock_id": NOSHOW_ADVISORY_LOCK_ID},
            ).scalar()
            if not lock_acquired:
                logger.info("change_to_noshow: another worker is executing this job; skipping.")
                return 0

        up = (
            update(Appointment)
            .where(
                Appointment.ends_at < target_time,
                Appointment.status.in_(["scheduled", "confirmed"]),
            )
            .values(status="no_show")
            .execution_options(synchronize_session=False)
        )

        result = session.execute(up)
        count = (
            result.rowcount
            if hasattr(result, "rowcount") and result.rowcount is not None
            else 0
        )
        session.commit()
        if count > 0:
            logger.info(
                f"Marked {count} missed appointment(s) as no_show as of {target_time.isoformat()}"
            )
        return count
    except Exception as exc:
        session.rollback()
        logger.exception(f"Error during change_to_noshow execution: {exc}")
        raise
    finally:
        if manage_session:
            session.close()

