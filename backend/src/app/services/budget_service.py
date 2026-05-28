from src.app.repositories.budget_repository import BudgetRepository

budget_repository = BudgetRepository()


def get_user_budgets_with_summary(user_id, month_int: int, year: int) -> list:
    budgets = budget_repository.get_by_month_year(user_id, month_int, year)
    result = []
    for b in budgets:
        spent = float(budget_repository.get_spent_for_category_month(
            user_id, b.category_id, month_int, year
        ))
        limit = float(b.limit_amount)
        remaining = limit - spent
        percentage = round((spent / limit) * 100, 1) if limit > 0 else 0

        result.append({
            'id': str(b.id),
            'userId': str(b.user_id),
            'categoryId': str(b.category_id),
            'month': b.month.value,
            'year': b.year,
            'limitAmount': limit,
            'spent': spent,
            'remaining': remaining,
            'percentage': percentage,
            'createdAt': b.created_at.isoformat() if b.created_at else None,
            'updatedAt': b.updated_at.isoformat() if b.updated_at else None,
        })
    return result


def create_budget(user_id, category_id, month_int: int, year: int, limit_amount):
    try:
        budget = budget_repository.create_budget(
            user_id=user_id,
            category_id=category_id,
            month_int=month_int,
            year=year,
            limit_amount=limit_amount
        )
        return budget, None
    except Exception as e:
        if 'unique_budget_per_month' in str(e):
            return None, "Budget für diese Kategorie/Monat existiert bereits"
        return None, str(e)


def delete_budget(budget_id, user_id):
    budget = budget_repository.get_by_id(budget_id)
    if not budget:
        return False, "Budget nicht gefunden"
    if str(budget.user_id) != str(user_id):
        return False, "Keine Berechtigung"
    budget_repository.delete_budget(budget_id)
    return True, None