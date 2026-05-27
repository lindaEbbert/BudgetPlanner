from src.app.repositories.transaction_repository import TransactionRepository

transaction_repository = TransactionRepository()


def get_summary(user_id: str) -> dict:
    income = transaction_repository.get_income_sum(user_id)
    expenses = transaction_repository.get_expense_sum(user_id)
    initial_balance = transaction_repository.get_initial_balance_sum(user_id)
    recent = transaction_repository.get_by_user(user_id)[:5]

    return {
        'balance': initial_balance + income - expenses,
        'totalIncome': income,
        'totalExpenses': expenses,
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