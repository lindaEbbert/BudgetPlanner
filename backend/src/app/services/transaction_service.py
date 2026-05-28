import uuid
from decimal import Decimal
from datetime import datetime
from src.app.repositories.transaction_repository import TransactionRepository
from src.app.models.transactions import Transactions, TransactionType
from src.app.db import db

transaction_repository = TransactionRepository()


def get_user_transactions(user_id, include_voided=False, month: int = None, year: int = None):
    return transaction_repository.get_by_user(user_id, include_voided, month, year)


def create_transaction(user_id, name, amount, transaction_type,
                       category_id, transaction_date, description=None, fixed_cost_id=None):
    transaction = Transactions(
        id=uuid.uuid4(),
        user_id=user_id,
        category_id=category_id,
        fixed_cost_id=fixed_cost_id,
        name=name,
        amount=amount,
        type=TransactionType[transaction_type],
        transaction_date=datetime.fromisoformat(transaction_date),
        description=description,
        is_voided=False
    )
    db.session.add(transaction)
    db.session.commit()
    return transaction, None


def update_transaction(transaction_id, user_id, data: dict):
    transaction = transaction_repository.get_by_id(transaction_id)
    if not transaction:
        return None, "Transaktion nicht gefunden"
    if str(transaction.user_id) != str(user_id):
        return None, "Keine Berechtigung"

    update_data = {}
    if 'name' in data:
        update_data['name'] = data['name']
    if 'amount' in data:
        update_data['amount'] = data['amount']
    if 'description' in data:
        update_data['description'] = data['description']
    if 'transactionDate' in data:
        update_data['transaction_date'] = datetime.fromisoformat(data['transactionDate'])
    if 'categoryId' in data:
        update_data['category_id'] = data['categoryId']
    if 'fixedCostId' in data:
        update_data['fixed_cost_id'] = data['fixedCostId']
    if 'type' in data:
        update_data['type'] = TransactionType[data['type']]

    updated = transaction_repository.update(transaction, update_data)
    return updated, None


def void_transaction(transaction_id, user_id):
    transaction = transaction_repository.get_by_id(transaction_id)
    if not transaction:
        return None, "Transaktion nicht gefunden"
    if str(transaction.user_id) != str(user_id):
        return None, "Keine Berechtigung"

    transaction_repository.update(transaction, {'is_voided': True})
    return transaction, None


def calculate_balance(user_id, month: int = None, year: int = None):
    if month and year:
        income = transaction_repository.get_income_sum_for_month(user_id, month, year)
        expenses = transaction_repository.get_expense_sum_for_month(user_id, month, year)
        initial_balance = Decimal('0')  # Initial Balance ist kein Monatskonzept
    else:
        income = transaction_repository.get_income_sum(user_id)
        expenses = transaction_repository.get_expense_sum(user_id)
        initial_balance = transaction_repository.get_initial_balance_sum(user_id)
    return {
        'income': float(income),
        'expense': float(expenses),
        'initialBalance': float(initial_balance),
        'balance': float(initial_balance + income - expenses)
    }