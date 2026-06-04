"""update admin password to Admin@123

Revision ID: 003
Revises: 002
Create Date: 2026-06-04 00:00:00.000000
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    from passlib.context import CryptContext
    new_hash = CryptContext(schemes=["bcrypt"], deprecated="auto").hash("Admin@123")
    op.execute(
        sa.text(
            "UPDATE users SET hashed_password = :h WHERE email = 'admin@admin.in'"
        ).bindparams(h=new_hash)
    )


def downgrade() -> None:
    pass
