import enum
from sqlalchemy import CheckConstraint
from src.app.db import db


class IntervalUnitEnum(enum.Enum):
    DAY = 'day'
    WEEK = 'week'
    MONTH = 'month'
    YEAR = 'year'


class FixedCosts(db.Model):

    __table_args__ = (
        CheckConstraint(
            "interval_value > 0",
            name="check_interval_value_positive"
        ),
    )

    id = db.Column(db.Uuid, primary_key=True)
    category_id = db.Column(db.Uuid, db.ForeignKey('categories.id'))
    user_id = db.Column(db.Uuid, db.ForeignKey('user.id'))
    name = db.Column(db.String(100))
    description = db.Column(db.String(120))
    amount = db.Column(db.Numeric(12, 2))
    interval_unit = db.Column(db.Enum(IntervalUnitEnum), name='interval_unit')
    interval_value = db.Column(db.Integer)
    next_due_date = db.Column(db.DateTime, nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=db.func.now())
    updated_at = db.Column(db.DateTime, default=db.func.now(), onupdate=db.func.now())
    deleted_at = db.Column(db.DateTime)


    def to_dict(self): # QUESTION: Welche Kategorien ergeben hier Sinn?
        return {"id": self.id,
                "category_id": self.category_id,
                "name": self.name,
                "description": self.description,
                "amount": self.amount,
                "interval_unit": self.interval_unit,
                "interval_value": self.interval_value,
                "next_due_date": self.next_due_date
                }
