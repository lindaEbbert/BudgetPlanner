from datetime import date
from src.app.repositories.fixed_cost_repository import FixedCostRepository
from src.app.models.fixed_costs import IntervalUnitEnum

fixed_cost_repository = FixedCostRepository()


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
    Berechnet welche Fixkosten im Zielmonat anfallen.
    MONTH und YEAR werden exakt berechnet.
    DAY und WEEK: vereinfacht (trifft immer zu wenn start_date <= Zielmonat).
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
    # Liegt start_date nach dem Zielmonat? → trifft nicht zu
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
        # DAY / WEEK: vereinfacht
        # Vollständige Implementierung: Kalenderwochen/-tagesberechnung mit timedelta
        return True


def get_monthly_cost(interval_unit: IntervalUnitEnum, interval_value: int, amount: float, next_due_date: date):
    """
    Calculates the monthly cost for a fixed cost.
    :param interval_unit: e.G. MONTH, YEAR
    :param interval_value: int that defines the interval distances between payments
    :param amount: total cost of the fixed cost
    :param next_due_date: date of the next payment
    :return: monthly cost
    """
    pass


def get_needed_fc_depot_for_month(active_fc_list: list, active_month: int, active_year: int):
    """
    
    :param active_fc_list:
    :param active_month:
    :param active_year:
    :return:
    """
    pass
    # für alle aktiven fixkosten:
        # gesamtbetrag - monatlicher betrag * monate bis zahlungsmonat
            # falls bereits gezahlt, dann 0
            # falls noch nicht gezahlt, dann restbetrag