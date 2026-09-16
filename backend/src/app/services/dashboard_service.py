from decimal import Decimal
from sqlalchemy import extract, func
from src.app.repositories.transaction_repository import TransactionRepository
from src.app.models.transactions import Transactions, TransactionType
from src.app.db import db
from src.app.services import fixed_cost_service, budget_service, transaction_service

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


def get_summary(user_id: str, month: int = None, year: int = None, day: int = None) -> dict:
    from datetime import date
    today = date.today()
    if not month:
        month = today.month
    if not year:
        year  = today.year
    if not day:
        day   = today.day

    # Balance up to the chosen day (incl. carryover from previous months)
    bal = transaction_service.calculate_balance(user_id, month, year, day)

    # Total budget still remaining up to the chosen day
    remaining_budgets = budget_service.get_budgets_total_remaining(user_id, month, year, day)

    # Required fixed-cost reserve as of the chosen day
    needed_fc_depot = fixed_cost_service.get_needed_fc_depot(user_id, month, year, day)

    # Free to use = balance minus what's still reserved for budgets + fixed costs
    free_to_use = bal['balance'] - remaining_budgets - needed_fc_depot

    # Last 5 transactions (chronological, across all months)
    recent = transaction_repository.get_by_user(user_id)[:5]

    return {
        'month':               month,
        'year':                year,
        'balance':             bal['balance'],
        'remainingBudgets':    remaining_budgets,
        'projectedFixedCosts': needed_fc_depot,
        'freeToUse':           round(free_to_use, 2),
        'recentTransactions': [
            {
                'id':              str(t.id),
                'name':            t.name,
                'amount':          float(t.amount),
                'type':            t.type.value,
                'transactionDate': t.transaction_date.isoformat() if t.transaction_date else None,
                'isVoided':        t.is_voided,
            }
            for t in recent
        ],
    }