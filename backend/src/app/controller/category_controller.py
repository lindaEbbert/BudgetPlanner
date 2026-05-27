from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.app.services import category_service

category_blueprint = Blueprint('categories', __name__, url_prefix='/categories')


def category_to_dict(cat):
    return {
        'id': str(cat.id),
        'name': cat.name,
        'type': cat.type.value,
        'userId': str(cat.user_id),
        'createdAt': cat.created_at.isoformat() if cat.created_at else None
    }


@category_blueprint.route('', methods=['GET'])
@jwt_required()
def get_categories():
    user_id = get_jwt_identity()
    categories = category_service.get_user_categories(user_id)
    return jsonify([category_to_dict(c) for c in categories]), 200


@category_blueprint.route('', methods=['POST'])
@jwt_required()
def create_category():
    user_id = get_jwt_identity()
    data = request.get_json()
    name = data.get('name')
    category_type = data.get('type')

    if not name or not category_type:
        return jsonify({'error': 'Name und Typ erforderlich'}), 400

    category, error = category_service.create_category(user_id, name, category_type)
    if error:
        return jsonify({'error': error}), 409

    return jsonify(category_to_dict(category)), 201


@category_blueprint.route('/<category_id>', methods=['PUT'])
@jwt_required()
def update_category(category_id):
    user_id = get_jwt_identity()
    data = request.get_json()

    category, error = category_service.update_category(
        category_id=category_id,
        user_id=user_id,
        name=data.get('name'),
        category_type=data.get('type')
    )
    if error:
        return jsonify({'error': error}), 404

    return jsonify(category_to_dict(category)), 200


@category_blueprint.route('/<category_id>', methods=['DELETE'])
@jwt_required()
def delete_category(category_id):
    user_id = get_jwt_identity()
    success, error = category_service.delete_category(category_id, user_id)

    if not success:
        return jsonify({'error': error}), 404

    return jsonify({'message': 'Kategorie gelöscht'}), 200
