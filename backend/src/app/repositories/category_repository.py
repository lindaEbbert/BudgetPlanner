import uuid
from datetime import datetime, timezone
from sqlalchemy import func
from src.app.repositories.base_repository import BaseRepository
from src.app.models.categories import Categories, normalized_category_name
from src.app.db import db


def _same_name_as(name: str):
    # Compare like the unique index does: ignoring case and surrounding whitespace
    return normalized_category_name(Categories.name) == normalized_category_name(name)


class CategoryRepository(BaseRepository):
    def __init__(self):
        super().__init__(Categories)

    def get_all_by_user(self, user_id):
        return Categories.query.filter_by(
            user_id=user_id, deleted_at=None
        ).all()

    def name_exists_for_user(self, user_id, name: str, except_category_id=None) -> bool:
        query = Categories.query.filter(
            Categories.user_id == user_id,
            Categories.deleted_at.is_(None),
            _same_name_as(name),
        )
        if except_category_id:
            query = query.filter(Categories.id != except_category_id)
        return query.first() is not None

    def find_latest_deleted_by_name(self, user_id, name: str):
        return Categories.query.filter(
            Categories.user_id == user_id,
            Categories.deleted_at.isnot(None),
            _same_name_as(name),
        ).order_by(Categories.deleted_at.desc()).first()

    def create_category(self, user_id, name: str) -> Categories:
        category = Categories(
            id=uuid.uuid4(),
            user_id=user_id,
            name=name,
        )
        db.session.add(category)
        db.session.commit()
        return category

    def soft_delete(self, category_id) -> bool:
        category = self.get_by_id(category_id)
        if not category:
            return False
        category.deleted_at = datetime.now(timezone.utc)
        db.session.commit()
        return True
