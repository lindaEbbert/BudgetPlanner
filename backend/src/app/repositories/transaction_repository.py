from decimal import Decimal
from src.app.repositories.base_repository import BaseRepository
from src.app.models.transactions import Transactions, TransactionType
from src.app.db import db
from sqlalchemy import func


class TransactionRepository(BaseRepository):
    def __init__(self):
        super().__init__(Transactions)

    def get_by_user(self, user_id, include_voided=False):
        query = Transactions.query.filter_by(user_id=user_id)
        if not include_voided:
            query = query.filter_by(is_voided=False)
        return query.order_by(Transactions.transaction_date.desc()).all()

    def get_income_sum(self, user_id) -> Decimal:
        result = db.session.query(func.sum(Transactions.amount)).filter(
            Transactions.user_id == user_id,
            Transactions.type == TransactionType.INCOME,
            Transactions.is_voided == False
        ).scalar()
        return result or Decimal('0')

    def get_expense_sum(self, user_id) -> Decimal:
        result = db.session.query(func.sum(Transactions.amount)).filter(
            Transactions.user_id == user_id,
            Transactions.type == TransactionType.EXPENSE,
            Transactions.is_voided == False
        ).scalar()
        return result or Decimal('0')

    def get_initial_balance_sum(self, user_id) -> Decimal:
        result = db.session.query(func.sum(Transactions.amount)).filter(
            Transactions.user_id == user_id,
            Transactions.type == TransactionType.INITIAL,
            Transactions.is_voided == False
        ).scalar()
        return result or Decimal('0')