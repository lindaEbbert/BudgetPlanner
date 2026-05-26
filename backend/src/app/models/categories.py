import enum

from src.app.db import db
from sqlalchemy import UniqueConstraint

class CategoryType(enum.Enum):
    INCOME = 'INCOME'
    EXPENSE = 'EXPENSE'

class Categories(db.Model):

    __table_args__ = (UniqueConstraint("user_id",
                                       "name",
                                       name="unique_category_name_per_user"),)

    id = db.Column(db.Uuid, primary_key=True)
    user_id = db.Column(db.Uuid, db.ForeignKey('user.id'))
    name = db.Column(db.String(100), nullable=False)
    type = db.Column(db.Enum(CategoryType), name='category_type', nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.now())
    updated_at = db.Column(db.DateTime, default=db.func.now(), onupdate=db.func.now())
    deleted_at = db.Column(db.DateTime)

