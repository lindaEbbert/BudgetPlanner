"""drop category_type left behind by 9b09cd6e63e5

Revision ID: 4e8b2f61d0a7
Revises: c7d1e4a2b905
Create Date: 2026-09-24 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '4e8b2f61d0a7'
down_revision: Union[str, Sequence[str], None] = 'c7d1e4a2b905'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 9b09cd6e63e5 was meant to drop the column but does not, so a database built from
    # the migrations still requires it. Existing databases may have lost it by hand,
    # hence IF EXISTS.
    op.execute('ALTER TABLE categories DROP COLUMN IF EXISTS category_type')
    op.execute('DROP TYPE IF EXISTS categorytype')


def downgrade() -> None:
    """Downgrade schema."""
    # Comes back nullable, as the removed values cannot be restored.
    category_type = postgresql.ENUM('INCOME', 'EXPENSE', name='categorytype')
    category_type.create(op.get_bind())
    op.add_column('categories', sa.Column('category_type', category_type, nullable=True))
