import uuid
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token
from datetime import timedelta
from src.app.db import db
from src.app.models.user import User

bcrypt = Bcrypt()


def hash_password(password: str) -> str:
    return bcrypt.generate_password_hash(password).decode('utf-8')


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.check_password_hash(hashed, password)


def register_user(email: str, name: str, password: str):
    if User.query.filter_by(email=email).first():
        return None, "E-Mail bereits vergeben"

    user = User(
        id=uuid.uuid4(),
        name=name,
        email=email,
        hashed_password=hash_password(password)
    )
    db.session.add(user)
    db.session.commit()
    return user, None


def login_user(email: str, password: str):
    user = User.query.filter_by(email=email).first()
    if not user or not verify_password(password, user.hashed_password):
        return None, "Ungültige Anmeldedaten"

    token = create_access_token(
        identity=str(user.id),
        expires_delta=timedelta(days=7)
    )
    return token, None