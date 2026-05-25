from src.app.db import db


class User(db.Model):
    id = db.Column(db.Uuid, primary_key=True)
    name = db.Column(db.String(100))
    email = db.Column(db.String(120))
    hashed_password = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=db.func.now())
    updated_at = db.Column(db.DateTime, default=db.func.now(), onupdate=db.func.now())
    fixed_costs = db.relationship('FixedCosts', backref='user')  #, secondary='user_fixed_costs')

    def to_dict(self):
        return {"id": self.id,
                "name": self.name,
                "email": self.email,
                }