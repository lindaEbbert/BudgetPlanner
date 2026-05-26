import enum

from sqlalchemy import null

from src.app.db import db


class TransactionType(enum.Enum):
    INCOME = 'INCOME'
    EXPENSE = 'EXPENSE'
    INITIAL = 'INITIAL'


class Transactions(db.Model):
    id = db.Column(db.Uuid, primary_key=True)
    user_id = db.Column(db.Uuid, db.ForeignKey('user.id'))
    category_id = db.Column(db.Uuid, db.ForeignKey('categories.id'))
    fixed_cost_id = db.Column(db.Uuid, db.ForeignKey('fixed_costs.id'), nullable=True)
    name = db.Column(db.String(100), nullable=False)
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    type = db.Column(db.Enum(TransactionType), name='transaction_type', nullable=False)
    transaction_date = db.Column(db.Date, nullable=False)
    description = db.Column(db.String(120), nullable=True)
    is_voided = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=db.func.now())
    updated_at = db.Column(db.DateTime, default=db.func.now(), onupdate=db.func.now())
