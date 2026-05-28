import uuid
from datetime import datetime, timezone
from src.app.repositories.base_repository import BaseRepository
from src.app.models.fixed_costs import FixedCosts
from src.app.db import db


class FixedCostRepository(BaseRepository):
    def __init__(self):
        super().__init__(FixedCosts)

    def get_active_by_user(self, user_id):
        return FixedCosts.query.filter_by(
            user_id=user_id,
            is_active=True,
            deleted_at=None
        ).all()

    def create_fixed_cost(self, user_id, data: dict) -> FixedCosts:
        fixed_cost = FixedCosts(
            id=uuid.uuid4(),
            user_id=user_id,
            **data
        )
        db.session.add(fixed_cost)
        db.session.commit()
        return fixed_cost

    def soft_delete(self, fixed_cost_id) -> bool:
        fc = self.get_by_id(fixed_cost_id)
        if not fc:
            return False
        fc.deleted_at = datetime.now(timezone.utc)
        fc.is_active = False
        db.session.commit()
        return True