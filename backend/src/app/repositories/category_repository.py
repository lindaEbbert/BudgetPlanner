import uuid
from datetime import datetime, timezone
from src.app.repositories.base_repository import BaseRepository
from src.app.models.categories import Categories
from src.app.db import db


class CategoryRepository(BaseRepository):
    def __init__(self):
        super().__init__(Categories)


        def get_all_by_user(self, user_id):
            return Categories.query.filter_by(
                user_id=user_id, deleted_at=None
            ).all()


        def name_exists_for_user(self, user_id, name: str) -> bool:
            return Categories.query.filter_by(
                user_id=user_id, name=name, deleted_at=None
            ).first() is not None


        def create_category(self, user_id, name: str, category_type: str) -> Categories:
            category = Categories(
                id=uuid.uuid4(),
                user_id=user_id,
                name=name,
                type=category_type,
            )
            db.session.add(category)
            db.session.commit()
            return category


        def soft_delete(self, category_id) -> bool:
            category = self.get(category_id)
            if not category:
                return False
            category.deleted_at = datetime.now(timezone.utc)
            db.session.commit()
            return True