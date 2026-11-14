"""Create appointments table

Revision ID: c2e7188b40aa
Revises: f8fa644a7c6b
Create Date: 2026-10-11 21:55:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c2e7188b40aa'
down_revision: Union[str, Sequence[str], None] = 'f8fa644a7c6b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema to include appointments table."""
    op.create_table(
        'appointments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('doctor_id', sa.Integer(), nullable=False),
        sa.Column('scheduled_by', sa.Integer(), nullable=False),
        sa.Column('start_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('ends_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('reason', sa.String(length=255), nullable=False),
        sa.Column('status', sa.String(length=50), server_default='scheduled', nullable=False),
        sa.Column('notes', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['doctor_id'], ['users.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['scheduled_by'], ['users.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_appointments_patient_id'), 'appointments', ['patient_id'], unique=False)
    op.create_index(op.f('ix_appointments_doctor_id'), 'appointments', ['doctor_id'], unique=False)
    op.create_index(op.f('ix_appointments_start_at'), 'appointments', ['start_at'], unique=False)
    op.create_index(op.f('ix_appointments_status'), 'appointments', ['status'], unique=False)


def downgrade() -> None:
    """Downgrade schema to remove appointments table."""
    op.drop_index(op.f('ix_appointments_status'), table_name='appointments')
    op.drop_index(op.f('ix_appointments_start_at'), table_name='appointments')
    op.drop_index(op.f('ix_appointments_doctor_id'), table_name='appointments')
    op.drop_index(op.f('ix_appointments_patient_id'), table_name='appointments')
    op.drop_table('appointments')

