from decimal import Decimal
from src.app.repositories.base_repository import BaseRepository
from src.app.models.transactions import Transactions, TransactionType
from src.app.db import db
from sqlalchemy import func, extract
from datetime import date
from calendar import monthrange

class TransactionRepository(BaseRepository):
    def __init__(self):
        super().__init__(Transactions)


    def get_by_user(self, user_id, include_voided=False, month: int = None, year: int = None, day: int = None):
        query = Transactions.query.filter_by(user_id=user_id)
        if not include_voided:
            query = query.filter_by(is_voided=False)
        if month and year:
            start = date(year, month, 1)
            end_day = day if day else monthrange(year, month)[1]
            end = date(year, month, end_day)
            query = query.filter(
                Transactions.transaction_date >= start,
                Transactions.transaction_date <= end
            )
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


    def get_income_sum_for_month(self, user_id, month: int, year: int) -> Decimal:
        result = db.session.query(func.sum(Transactions.amount)).filter(
            Transactions.user_id == user_id,
            Transactions.type == TransactionType.INCOME,
            Transactions.is_voided == False,
            extract('month', Transactions.transaction_date) == month,
            extract('year', Transactions.transaction_date) == year,
        ).scalar()
        return result or Decimal('0')


    def get_expense_sum_for_month(self, user_id, month: int, year: int) -> Decimal:
        result = db.session.query(func.sum(Transactions.amount)).filter(
            Transactions.user_id == user_id,
            Transactions.type == TransactionType.EXPENSE,
            Transactions.is_voided == False,
            extract('month', Transactions.transaction_date) == month,
            extract('year', Transactions.transaction_date) == year,
        ).scalar()
        return result or Decimal('0')


    def get_income_sum_before_date(self, user_id, cutoff_date) -> Decimal:
        result = db.session.query(func.sum(Transactions.amount)).filter(
            Transactions.user_id == user_id,
            Transactions.type == TransactionType.INCOME,
            Transactions.is_voided == False,
            Transactions.transaction_date < cutoff_date
        ).scalar()
        return result or Decimal('0')


    def get_expense_sum_before_date(self, user_id, cutoff_date) -> Decimal:
        result = db.session.query(func.sum(Transactions.amount)).filter(
            Transactions.user_id == user_id,
            Transactions.type == TransactionType.EXPENSE,
            Transactions.is_voided == False,
            Transactions.transaction_date < cutoff_date
        ).scalar()
        return result or Decimal('0')


    def get_income_sum_for_period(self, user_id, from_date, to_date) -> Decimal:
        result = db.session.query(func.sum(Transactions.amount)).filter(
            Transactions.user_id == user_id,
            Transactions.type == TransactionType.INCOME,
            Transactions.is_voided == False,
            Transactions.transaction_date >= from_date,
            Transactions.transaction_date <= to_date
        ).scalar()
        return result or Decimal('0')


    def get_expense_sum_for_period(self, user_id, from_date, to_date) -> Decimal:
        result = db.session.query(func.sum(Transactions.amount)).filter(
            Transactions.user_id == user_id,
            Transactions.type == TransactionType.EXPENSE,
            Transactions.is_voided == False,
            Transactions.transaction_date >= from_date,
            Transactions.transaction_date <= to_date
        ).scalar()
        return result or Decimal('0')


    def was_fixed_cost_paid_in_period(self, user_id, fixed_cost_id, from_date, to_date) -> bool:
        count = db.session.query(Transactions).filter(
            Transactions.user_id == user_id,
            Transactions.fixed_cost_id == fixed_cost_id,
            Transactions.is_voided == False,
            Transactions.transaction_date >= from_date,
            Transactions.transaction_date <= to_date,
        ).count()
        return count > 0