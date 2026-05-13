from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def add_user(user):
    db.session.add(user)
    db.session.commit()
    return user