"""category name unique among active categories only, ignoring case

Revision ID: c7d1e4a2b905
Revises: 9b09cd6e63e5
Create Date: 2026-09-24 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c7d1e4a2b905'
down_revision: Union[str, Sequence[str], None] = '9b09cd6e63e5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_constraint('unique_category_name_per_user', 'categories', type_='unique')
    # Unique ignoring case and surrounding whitespace, so "Miete" and "miete" cannot both
    # be active. Fails if such active duplicates already exist.
    op.create_index('unique_active_category_name_per_user', 'categories',
                    ['user_id', sa.text('lower(trim(name))')],
                    unique=True, postgresql_where=sa.text('deleted_at IS NULL'))


def downgrade() -> None:
    """Downgrade schema."""
    # Fails if an active and a deleted category of one user share a name.
    op.drop_index('unique_active_category_name_per_user', table_name='categories',
                  postgresql_where=sa.text('deleted_at IS NULL'))
    op.create_unique_constraint('unique_category_name_per_user', 'categories', ['user_id', 'name'])
