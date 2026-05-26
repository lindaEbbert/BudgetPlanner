import enum

from src.app.db import db
from sqlalchemy import UniqueConstraint

class BudgetMonth(enum.Enum):
    JANUARY = 'JANUARY'
    FEBRUARY = 'FEBRUARY'
    MARCH = 'MARCH'
    APRIL = 'APRIL'
    MAY = 'MAY'
    JUNE = 'JUNE'
    JULY = 'JULY'
    AUGUST = 'AUGUST'
    SEPTEMBER = 'SEPTEMBER'
    OCTOBER = 'OCTOBER'
    NOVEMBER = 'NOVEMBER'
    DECEMBER = 'DECEMBER'

class Budgets(db.Model):

    __table_args__ = (UniqueConstraint("user_id",
        "category_id",
        "budget_month",
        "year",
        name="unique_budget_per_month"),)

    id = db.Column(db.Uuid, primary_key=True)
    user_id = db.Column(db.Uuid, db.ForeignKey('user.id'))
    category_id = db.Column(db.Uuid, db.ForeignKey('categories.id'))
    month = db.Column(db.Enum(BudgetMonth), name='budget_month', nullable=False)
    year = db.Column(db.Integer, nullable=False)
    limit_amount = db.Column(db.Numeric(12, 2), nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.now())
    updated_at = db.Column(db.DateTime, default=db.func.now(), onupdate=db.func.now())