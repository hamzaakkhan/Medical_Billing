"""add_unique_constraint_to_health_card

Revision ID: be268d2119b9
Revises: 421692bf24b5
Create Date: 2026-10-15 14:16:59.968344

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'be268d2119b9'
down_revision: Union[str, Sequence[str], None] = '421692bf24b5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_unique_constraint('uq_patients_health_card', 'patients', ['health_card'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('uq_patients_health_card', 'patients', type_='unique')
