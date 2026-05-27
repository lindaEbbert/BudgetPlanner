import uuid

from src.app.repositories.base_repository import BaseRepository
from src.app.db import db
from src.app.models.user import User


class UserRepository(BaseRepository):
    def __init__(self):
        super().__init__(User)


    def get_by_email(self, email: str):
        return User.query.filter_by(email=email).first()

    def create_user(self, name: str, email: str, hashed_password: str) -> User:
        user = User(
            id=uuid.uuid4(),
            name=name,
            email=email,
            hashed_password=hashed_password
        )
        db.session.add(user)
        db.session.commit()
        return user