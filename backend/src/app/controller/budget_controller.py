from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.app.services import budget_service

budget_blueprint = Blueprint('budgets', __name__, url_prefix='/budgets')


@budget_blueprint.route('', methods=['GET'])
@jwt_required()
def get_budgets():
    user_id = get_jwt_identity()
    month = request.args.get('month', type=int)
    year = request.args.get('year', type=int)

    if not month or not year:
        return jsonify({'error': 'month und year sind erforderlich'}), 400

    budgets = budget_service.get_user_budgets_with_summary(user_id, month, year)
    return jsonify(budgets), 200


@budget_blueprint.route('', methods=['POST'])
@jwt_required()
def create_budget():
    user_id = get_jwt_identity()
    data = request.get_json()

    required = ['categoryId', 'month', 'year', 'limitAmount']
    for field in required:
        if data.get(field) is None:
            return jsonify({'error': f'{field} ist erforderlich'}), 400

    budget, error = budget_service.create_budget(
        user_id=user_id,
        category_id=data['categoryId'],
        month_int=data['month'],
        year=data['year'],
        limit_amount=data['limitAmount']
    )
    if error:
        return jsonify({'error': error}), 409

    # Budget sofort mit spent/remaining zurückgeben
    budgets = budget_service.get_user_budgets_with_summary(
        user_id, data['month'], data['year']
    )
    created = next((b for b in budgets if b['id'] == str(budget.id)), None)
    return jsonify(created), 201


@budget_blueprint.route('/<budget_id>', methods=['DELETE'])
@jwt_required()
def delete_budget(budget_id):
    user_id = get_jwt_identity()
    success, error = budget_service.delete_budget(budget_id, user_id)

    if not success:
        return jsonify({'error': error}), 404

    return jsonify({'message': 'Budget gelöscht'}), 200