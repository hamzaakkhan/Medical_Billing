"""Add database check

Revision ID: de495bdfc269
Revises: c2e7188b40aa
Create Date: 2026-10-15 12:24:22.013970

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'de495bdfc269'
down_revision: Union[str, Sequence[str], None] = 'c2e7188b40aa'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 1. Enforce strict role validation in PostgreSQL
    op.create_check_constraint(
        "check_valid_role_names",
        "roles",
        "role IN ('admin', 'receptionist', 'doctor', 'coder', 'biller')",
    )

    # 2. Normalize/clean up any legacy invalid test rows before applying check constraints
    op.execute(
        sa.text(
            "UPDATE appointments SET status = 'scheduled' "
            "WHERE status NOT IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled')"
        )
    )
    op.execute(
        sa.text(
            "UPDATE appointments SET ends_at = start_at + interval '30 minutes' "
            "WHERE start_at >= ends_at"
        )
    )

    # 3. Appointment check constraints
    op.create_check_constraint(
        "check_appointment_start_before_end",
        "appointments",
        "start_at < ends_at",
    )
    op.create_check_constraint(
        "check_valid_appointment_status",
        "appointments",
        "status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled')",
    )
    op.create_check_constraint(
        "check_appointment_reason_not_empty",
        "appointments",
        "length(trim(reason)) > 0",
    )

    # 4. High-scale composite indexes for doctor schedule and patient history lookups
    op.create_index(
        "ix_appointments_doctor_start",
        "appointments",
        ["doctor_id", "start_at"],
        unique=False,
    )
    op.create_index(
        "ix_appointments_patient_start",
        "appointments",
        ["patient_id", "start_at"],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_appointments_patient_start", table_name="appointments")
    op.drop_index("ix_appointments_doctor_start", table_name="appointments")
    op.drop_constraint("check_appointment_reason_not_empty", "appointments", type_="check")
    op.drop_constraint("check_valid_appointment_status", "appointments", type_="check")
    op.drop_constraint("check_appointment_start_before_end", "appointments", type_="check")
    op.drop_constraint("check_valid_role_names", "roles", type_="check")


