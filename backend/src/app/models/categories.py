from src.app.db import db
from sqlalchemy import Index, func


def normalized_category_name(name):
    """A category name ignoring case and surrounding whitespace, as SQL expression."""
    return func.lower(func.trim(name))


class Categories(db.Model):

    id = db.Column(db.Uuid, primary_key=True)
    user_id = db.Column(db.Uuid, db.ForeignKey('user.id'))
    name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.now())
    updated_at = db.Column(db.DateTime, default=db.func.now(), onupdate=db.func.now())
    deleted_at = db.Column(db.DateTime)


# Names are unique per user among active categories only, ignoring case and surrounding
# whitespace, so "Miete" and "miete" cannot both be active, while the name of a deleted
# category can be used again.
Index("unique_active_category_name_per_user",
      Categories.user_id,
      normalized_category_name(Categories.name),
      unique=True,
      postgresql_where=Categories.deleted_at.is_(None))
