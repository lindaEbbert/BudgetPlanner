import enum

from db import db


class IntervalUnitEnum(enum.Enum):
    DAY = 'day'
    WEEK = 'week'
    MONTH = 'month'
    YEAR = 'year'


class FixedCosts(db.Model):
    id = db.Column(db.Uuid, primary_key=True)
    category_id = db.Column(db.Uuid, db.ForeignKey('categories.id'))
    user_id = db.Column(db.Uuid, db.ForeignKey('user.id'))
    name = db.Column(db.String(100))
    description = db.Column(db.String(120))
    money_amount = db.Column(db.Numeric(12, 2))
    interval_unit = db.Column(db.Enum(IntervalUnitEnum), name='interval_unit')
    interval_value = db.Column(db.Integer)
    next_due_date = db.Column(db.DateTime, nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=db.func.now())
    updated_at = db.Column(db.DateTime, default=db.func.now(), onupdate=db.func.now())
    deleted_at = db.Column(db.DateTime)


    #user = db.relationship('User', backref='fixed_costs')  #, secondary='fixed_costs_users')

    def to_dict(self):
        return {"id": self.id,
                "name": self.name,
                "description": self.description,
                "money_amount": self.money_amount,
                "unit": self.unit,
                "unit_amount": self.unit_amount}
