import enum

from src.app.db import db

class BudgetMonth(enum.Enum):
    JANUARY = 'January'
    FEBUARY = 'February'
    MARCH = 'March'
    APRIL = 'April'
    MAY = 'May'
    JUNE = 'June'
    JULY = 'July'
    AUGUST = 'August'
    SEPTEMBER = 'September'
    OCTOBER = 'October'
    NOVEMBER = 'November'
    DECEMBER = 'December'

class Budgets(db.Model):
    id = db.Column(db.Uuid, primary_key=True)
    user_id = db.Column(db.Uuid, db.ForeignKey('user.id'))
    category_id = db.Column(db.Uuid, db.ForeignKey('categories.id'))
    month = db.Column(db.Enum(BudgetMonth), name='budget_month')
    year = db.Column(db.Integer)
    limit_amount = db.Column(db.Numeric(12, 2))
    created_at = db.Column(db.DateTime, default=db.func.now())
    updated_at = db.Column(db.DateTime, default=db.func.now(), onupdate=db.func.now())