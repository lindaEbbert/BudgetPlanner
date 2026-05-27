from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.app.services import transaction_service

transaction_blueprint = Blueprint('transactions', __name__, url_prefix='/transactions')


def transaction_to_dict(t):
    return {
        'id': str(t.id),
        'userId': str(t.user_id),
        'categoryId': str(t.category_id) if t.category_id else None,
        'fixedCostId': str(t.fixed_cost_id) if t.fixed_cost_id else None,
        'name': t.name,
        'amount': float(t.amount),
        'type': t.type.value,
        'transactionDate': t.transaction_date.isoformat() if t.transaction_date else None,
        'description': t.description,
        'isVoided': t.is_voided,
        'createdAt': t.created_at.isoformat() if t.created_at else None
    }


@transaction_blueprint.route('/balance', methods=['GET'])
@jwt_required()
def get_balance():
    user_id = get_jwt_identity()
    balance = transaction_service.calculate_balance(user_id)
    return jsonify(balance), 200


@transaction_blueprint.route('', methods=['GET'])
@jwt_required()
def get_transactions():
    user_id = get_jwt_identity()
    include_voided = request.args.get('include_voided', 'false').lower() == 'true'
    transactions = transaction_service.get_user_transactions(user_id, include_voided)
    return jsonify([transaction_to_dict(t) for t in transactions]), 200


@transaction_blueprint.route('', methods=['POST'])
@jwt_required()
def create_transaction():
    user_id = get_jwt_identity()
    data = request.get_json()

    transaction_type = data.get('type')
    required = ['name', 'amount', 'type', 'transactionDate']
    if transaction_type != 'INITIAL':
        required.append('categoryId')
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'{field} ist erforderlich'}), 400

    transaction, error = transaction_service.create_transaction(
        user_id=user_id,
        name=data['name'],
        amount=data['amount'],
        transaction_type=data['type'],
        category_id=data.get('categoryId'),
        transaction_date=data['transactionDate'],
        description=data.get('description'),
        fixed_cost_id=data.get('fixedCostId')
    )
    if error:
        return jsonify({'error': error}), 400

    return jsonify(transaction_to_dict(transaction)), 201


@transaction_blueprint.route('/<transaction_id>', methods=['PUT'])
@jwt_required()
def update_transaction(transaction_id):
    user_id = get_jwt_identity()
    data = request.get_json()

    transaction, error = transaction_service.update_transaction(transaction_id, user_id, data)
    if error:
        return jsonify({'error': error}), 404

    return jsonify(transaction_to_dict(transaction)), 200


@transaction_blueprint.route('/<transaction_id>/void', methods=['POST'])
@jwt_required()
def void_transaction(transaction_id):
    user_id = get_jwt_identity()
    transaction, error = transaction_service.void_transaction(transaction_id, user_id)

    if error:
        return jsonify({'error': error}), 404

    return jsonify(transaction_to_dict(transaction)), 200


@transaction_blueprint.route('/<transaction_id>', methods=['DELETE'])
@jwt_required()
def delete_transaction(transaction_id):
    user_id = get_jwt_identity()
    transaction = transaction_service.get_user_transactions(user_id)
    # Hinweis: In einer Finanz-App lieber void_transaction verwenden!
    return jsonify({'message': 'Nicht erlaubt — bitte stornieren statt löschen'}), 405