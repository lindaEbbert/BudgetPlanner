import enum

from src.app.db import db

class CategoryType(enum.Enum):
    INCOME = 'income'
    EXPENSE = 'expense'

class Categories(db.Model):
    id = db.Column(db.Uuid, primary_key=True)
    user_id = db.Column(db.Uuid, db.ForeignKey('user.id'))
    name = db.Column(db.String(100))
    type = db.Column(db.Enum(CategoryType), name='category_type')
    created_at = db.Column(db.DateTime, default=db.func.now())
    updated_at = db.Column(db.DateTime, default=db.func.now(), onupdate=db.func.now())
    deleted_at = db.Column(db.DateTime)

