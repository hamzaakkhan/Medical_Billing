"""Add root admin

Revision ID: f8fa644a7c6b
Revises: 45faab776cf9
Create Date: 2026-10-05 19:22:00.031823

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f8fa644a7c6b'
down_revision: Union[str, Sequence[str], None] = '45faab776cf9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "users",
        sa.Column(
            "is_root_admin",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false()
        )
    )

    op.create_index(
        "uq_one_root_admin",
        "users",
        ["is_root_admin"],
        unique=True,
        postgresql_where=sa.text("is_root_admin = true")
    )

    op.execute(
        sa.text(
            "UPDATE users SET is_root_admin = True WHERE id = 1"
        )
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(
        "uq_one_root_admin",
        table_name="users"
    )

    op.drop_column(
        "users",
        "is_root_admin"
    )