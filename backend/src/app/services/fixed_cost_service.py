from datetime import date
from src.app.repositories.fixed_cost_repository import FixedCostRepository
from src.app.models.fixed_costs import IntervalUnitEnum
from src.app.repositories.transaction_repository import TransactionRepository

fixed_cost_repository = FixedCostRepository()
transaction_repository = TransactionRepository()


def _fc_to_dict(fc) -> dict:
    return {
        'id': str(fc.id),
        'userId': str(fc.user_id),
        'categoryId': str(fc.category_id) if fc.category_id else None,
        'name': fc.name,
        'description': fc.description,
        'amount': float(fc.amount),
        'intervalUnit': fc.interval_unit.value,
        'intervalValue': fc.interval_value,
        'startDate': fc.start_date.isoformat() if fc.start_date else None,
        'nextDueDate': fc.next_due_date.isoformat() if fc.next_due_date else None,
        'isActive': fc.is_active,
    }


def get_all_fixed_costs(user_id) -> list:
    return [_fc_to_dict(fc) for fc in fixed_cost_repository.get_active_by_user(user_id)]


def create_fixed_cost(user_id, data: dict):
    fixed_cost_data = {
        'category_id': data.get('categoryId'),
        'name': data['name'],
        'description': data.get('description'),
        'amount': data['amount'],
        'interval_unit': IntervalUnitEnum[data['intervalUnit']],
        'interval_value': data['intervalValue'],
        'start_date': date.fromisoformat(data['startDate']),
        'is_active': True,
    }
    fc = fixed_cost_repository.create_fixed_cost(user_id, fixed_cost_data)
    return _fc_to_dict(fc), None


def update_fixed_cost(fixed_cost_id, user_id, data: dict):
    fc = fixed_cost_repository.get_by_id(fixed_cost_id)
    if not fc:
        return None, "Fixkosten nicht gefunden"
    if str(fc.user_id) != str(user_id):
        return None, "Keine Berechtigung"

    update_data = {}
    if 'name' in data:
        update_data['name'] = data['name']
    if 'amount' in data:
        update_data['amount'] = data['amount']
    if 'description' in data:
        update_data['description'] = data['description']
    if 'intervalUnit' in data:
        update_data['interval_unit'] = IntervalUnitEnum[data['intervalUnit']]
    if 'intervalValue' in data:
        update_data['interval_value'] = data['intervalValue']

    updated = fixed_cost_repository.update(fc, update_data)
    return _fc_to_dict(updated), None


def delete_fixed_cost(fixed_cost_id, user_id):
    fc = fixed_cost_repository.get_by_id(fixed_cost_id)
    if not fc:
        return False, "Fixkosten nicht gefunden"
    if str(fc.user_id) != str(user_id):
        return False, "Keine Berechtigung"
    fixed_cost_repository.soft_delete(fixed_cost_id)
    return True, None


def get_projections_for_month(user_id, month_int: int, year: int) -> list:
    """
    Computes which fixed costs occur in the target month.
    MONTH and YEAR are computed exactly.
    DAY and WEEK: simplified (always matches once start_date <= target month).
    """
    fixed_costs = fixed_cost_repository.get_active_by_user(user_id)
    results = []
    for fc in fixed_costs:
        if _occurs_in_month(fc, month_int, year):
            d = _fc_to_dict(fc)
            d['projectedAmount'] = float(fc.amount)
            results.append(d)
    return results


def _occurs_in_month(fc, target_month: int, target_year: int) -> bool:
    start = fc.start_date
    # Does start_date lie after the target month? → does not apply
    if (start.year, start.month) > (target_year, target_month):
        return False

    unit = fc.interval_unit.value
    if unit == 'MONTH':
        months_diff = (target_year - start.year) * 12 + (target_month - start.month)
        return months_diff % fc.interval_value == 0
    elif unit == 'YEAR':
        if start.month != target_month:
            return False
        years_diff = target_year - start.year
        return years_diff % fc.interval_value == 0
    else:
        # DAY / WEEK: simplified
        # Full implementation: calendar week/day calculation with timedelta
        return True


def _was_paid_this_month(user_id, fixed_cost_id, from_date, to_date) -> bool:
    return transaction_repository.was_fixed_cost_paid_in_period(
        user_id, fixed_cost_id, from_date, to_date
    )


def _monthly_equivalent(fc) -> float:
    """Monthly share of a fixed cost, independent of its interval."""
    unit   = fc.interval_unit.value
    value  = fc.interval_value
    amount = float(fc.amount)

    if unit == 'MONTH':
        return amount / value
    elif unit == 'YEAR':
        return amount / (value * 12)
    elif unit == 'WEEK':
        return amount * (52.1775 / 12.0) / value   # ≈ 4.348 weeks/month
    elif unit == 'DAY':
        return amount * (365.25 / 12.0) / value    # ≈ 30.44 days/month
    return 0.0


def _months_elapsed_in_cycle(fc, current_month: int, current_year: int) -> int:
    """
    How many months have passed (inclusive) since the last payment up to the
    current month? This indicates how many monthly shares should currently be
    sitting in the 'reserve'.
    For DAY/WEEK: approximation → always 1 (one month's amount).
    """
    unit  = fc.interval_unit.value
    value = fc.interval_value

    if unit not in ('MONTH', 'YEAR'):
        return 1  # approximation: daily/weekly costs → one month's amount as reserve

    interval_months = value if unit == 'MONTH' else value * 12

    total_months = (current_year - fc.start_date.year) * 12 \
                   + (current_month - fc.start_date.month)
    if total_months < 0:
        return 0  # not active yet

    months_into_cycle = total_months % interval_months
    # months_into_cycle == 0 means: exactly on the due date
    return months_into_cycle if months_into_cycle > 0 else interval_months


def get_needed_fc_depot(user_id, month: int, year: int, day: int) -> float:
    """
    How much money must be 'blocked' for fixed costs as of the chosen date?
    Assumption: in every past and future month, the monthly share is set
    aside. Fixed costs already paid this month contribute 0.
    """
    from datetime import date
    cutoff         = date(year, month, day)
    start_of_month = date(year, month, 1)

    fixed_costs = fixed_cost_repository.get_active_by_user(user_id)
    total = 0.0

    for fc in fixed_costs:
        if fc.start_date > cutoff:
            continue  # not started yet

        if _was_paid_this_month(user_id, fc.id, start_of_month, cutoff):
            blocked = 0.0
        else:
            months  = _months_elapsed_in_cycle(fc, month, year)
            blocked = months * _monthly_equivalent(fc)

        total += blocked

    return round(total, 2)

