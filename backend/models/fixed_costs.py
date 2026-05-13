from db import db

class FixedCosts(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    description = db.Column(db.String(120))
    money_amount = db.Column(db.String(100))
    unit = db.Column(db.String(100))
    unit_amount = db.Column(db.String(100))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))

    #user = db.relationship('User', backref='fixed_costs')  #, secondary='fixed_costs_users')

    def to_dict(self):
        return {"id": self.id,
                "name": self.name,
                "description": self.description,
                "money_amount": self.money_amount,
                "unit": self.unit,
                "unit_amount": self.unit_amount}
