from src.app.db import db
from src.app.models import User


def add_user(user):
    db.session.add(user)
    db.session.commit()
    return user

def get_user(user_id):
    return db.session.get(User, user_id)

def get_all_users():
    return User.query.all()

def delete_user(user_id):
    user = get_user(user_id)
    if user:
        db.session.delete(user)
        db.session.commit()
        return True
    else:
        return False

def update_user(user_id, data):
    user = get_user(user_id)
    if user:
        for key, value in data.items():
            setattr(user, key, value)
        db.session.commit()
        return user
    else:
        return None