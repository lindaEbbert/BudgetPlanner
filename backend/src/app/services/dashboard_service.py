from decimal import Decimal
from sqlalchemy import func, extract
from src.app.repositories.transaction_repository import TransactionRepository
from src.app.models.transactions import Transactions, TransactionType
from src.app.db import db
from src.app.services import fixed_cost_service, budget_service

transaction_repository = TransactionRepository()


def _get_monthly_sum(user_id: str, month: int, year: int,
                     transaction_type: TransactionType) -> Decimal:
    result = db.session.query(func.sum(Transactions.amount)).filter(
        Transactions.user_id == user_id,
        Transactions.type == transaction_type,
        Transactions.is_voided == False,
        extract('month', Transactions.transaction_date) == month,
        extract('year', Transactions.transaction_date) == year,
    ).scalar()
    return result or Decimal('0')


def get_summary(user_id: str, month: int = None, year: int = None) -> dict:
    from datetime import date
    today = date.today()
    if not month:
        month = today.month
    if not year:
        year = today.year

    income = _get_monthly_sum(user_id, month, year, TransactionType.INCOME)
    expenses = _get_monthly_sum(user_id, month, year, TransactionType.EXPENSE)

    # sum up fixed costs for this month TODO
    projections = fixed_cost_service.get_projections_for_month(user_id, month, year)
    projected_fc = sum(p['projectedAmount'] for p in projections)

    # sum remaining budget limits for this month
    budgets_for_this_month = budget_service.get_user_budgets_with_summary(user_id, month, year)
    remaining_budget_limits = sum(r['remaining'] for r in budgets_for_this_month)

    free_to_use = float(income) - float(expenses) - projected_fc - remaining_budget_limits # TODO

    recent = transaction_repository.get_by_user(user_id)[:5]

    return {
        'month': month,
        'year': year,
        'monthIncome': float(income),
        'monthExpenses': float(expenses),
        'projectedFixedCosts': projected_fc,
        'freeToUse': free_to_use,
        'recentTransactions': [
            {
                'id': str(t.id),
                'name': t.name,
                'amount': float(t.amount),
                'type': t.type.value,
                'transactionDate': t.transaction_date.isoformat() if t.transaction_date else None,
                'isVoided': t.is_voided
            }
            for t in recent
        ]
    }