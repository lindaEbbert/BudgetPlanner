import enum

from src.app.db import db


class TransactionType(enum.Enum):
    INCOME = 'income'
    EXPENSE = 'expense'
    INITIAL = 'initial_balance'


class Transactions(db.Model):
    id = db.Column(db.Uuid, primary_key=True)
    user_id = db.Column(db.Uuid, db.ForeignKey('user.id'))
    category_id = db.Column(db.Uuid, db.ForeignKey('categories.id'))
    fixed_cost_id = db.Column(db.Uuid, db.ForeignKey('fixed_costs.id'), nullable=True)
    name = db.Column(db.String(100))
    amount = db.Column(db.Numeric(12, 2))
    type = db.Column(db.Enum(TransactionType), name='transaction_type')
    transaction_date = db.Column(db.DateTime)
    description = db.Column(db.String(120))
    is_voided = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=db.func.now())
    updated_at = db.Column(db.DateTime, default=db.func.now(), onupdate=db.func.now())
