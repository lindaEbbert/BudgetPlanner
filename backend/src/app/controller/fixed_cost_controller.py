from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.app.services import fixed_cost_service

fixed_cost_blueprint = Blueprint('fixed_costs', __name__, url_prefix='/fixed-costs')


# IMPORTANT: /projections MUST be registered before /<id>!
# Otherwise Flask would interpret "projections" as a fixed_cost_id.
@fixed_cost_blueprint.route('/projections', methods=['GET'])
@jwt_required()
def get_projections():
    user_id = get_jwt_identity()
    month = request.args.get('month', type=int)
    year = request.args.get('year', type=int)

    if not month or not year:
        return jsonify({'error': 'month und year sind erforderlich'}), 400

    projections = fixed_cost_service.get_projections_for_month(user_id, month, year)
    total = sum(p['projectedAmount'] for p in projections)
    return jsonify({'projections': projections, 'total': total}), 200


@fixed_cost_blueprint.route('/<selected_month><selected_year>', methods=['GET'])
@jwt_required()
def get_fixed_costs_for_month(selected_month, selected_year):
    user_id = get_jwt_identity()
    # TODO

@fixed_cost_blueprint.route('', methods=['GET'])
@jwt_required()
def get_fixed_costs():
    user_id = get_jwt_identity()
    return jsonify(fixed_cost_service.get_all_fixed_costs(user_id)), 200


@fixed_cost_blueprint.route('', methods=['POST'])
@jwt_required()
def create_fixed_cost():
    user_id = get_jwt_identity()
    data = request.get_json()

    required = ['name', 'amount', 'intervalUnit', 'intervalValue', 'startDate']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'{field} ist erforderlich'}), 400

    fc, error = fixed_cost_service.create_fixed_cost(user_id, data)
    if error:
        return jsonify({'error': error}), 400

    return jsonify(fc), 201


@fixed_cost_blueprint.route('/<fixed_cost_id>', methods=['PUT'])
@jwt_required()
def update_fixed_cost(fixed_cost_id):
    user_id = get_jwt_identity()
    data = request.get_json()

    fc, error = fixed_cost_service.update_fixed_cost(fixed_cost_id, user_id, data)
    if error:
        return jsonify({'error': error}), 404

    return jsonify(fc), 200


@fixed_cost_blueprint.route('/<fixed_cost_id>', methods=['DELETE'])
@jwt_required()
def delete_fixed_cost(fixed_cost_id):
    user_id = get_jwt_identity()
    success, error = fixed_cost_service.delete_fixed_cost(fixed_cost_id, user_id)

    if not success:
        return jsonify({'error': error}), 404

    return jsonify({'message': 'Fixkosten gelöscht'}), 200