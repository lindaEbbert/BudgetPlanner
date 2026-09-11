import uuid
from decimal import Decimal
from sqlalchemy import func, extract
from src.app.repositories.base_repository import BaseRepository
from src.app.models.budgets import Budgets, BudgetMonth
from src.app.models.transactions import Transactions, TransactionType
from src.app.db import db

MONTH_MAP = {
    1: 'JANUARY', 2: 'FEBRUARY', 3: 'MARCH', 4: 'APRIL',
    5: 'MAY', 6: 'JUNE', 7: 'JULY', 8: 'AUGUST',
    9: 'SEPTEMBER', 10: 'OCTOBER', 11: 'NOVEMBER', 12: 'DECEMBER'
}


class BudgetRepository(BaseRepository):
    def __init__(self):
        super().__init__(Budgets)

    def get_by_month_year(self, user_id, month_int: int, year: int):
        month_enum = BudgetMonth[MONTH_MAP[month_int]]
        return Budgets.query.filter_by(
            user_id=user_id,
            month=month_enum,
            year=year
        ).all()

    def get_spent_for_category_period(
            self, user_id, category_id, from_date, to_date
    ) -> Decimal:
        result = db.session.query(func.sum(Transactions.amount)).filter(
            Transactions.user_id == user_id,
            Transactions.category_id == category_id,
            Transactions.type == TransactionType.EXPENSE,
            Transactions.is_voided == False,
            Transactions.transaction_date >= from_date,
            Transactions.transaction_date <= to_date,
        ).scalar()
        return result or Decimal('0')

    def create_budget(self, user_id, category_id, month_int: int,
                      year: int, limit_amount) -> Budgets:
        budget = Budgets(
            id=uuid.uuid4(),
            user_id=user_id,
            category_id=category_id,
            month=BudgetMonth[MONTH_MAP[month_int]],
            year=year,
            limit_amount=limit_amount
        )
        db.session.add(budget)
        db.session.commit()
        return budget

    def delete_budget(self, budget_id) -> bool:
        budget = self.get_by_id(budget_id)
        if not budget:
            return False
        db.session.delete(budget)
        db.session.commit()
        return True