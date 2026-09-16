from flask import jsonify, request, Blueprint
from src.app.services import user_service as service
from src.app.models import User


user_blueprint = Blueprint('user_controller', __name__)

@user_blueprint.route('/user', methods=['POST', 'GET'])
def create_user():
    if request.method == 'POST':
        data = request.get_json()
        # validation
        user = User(name=data['name'], email=data['email'], hashed_password=data['hashed_password'])
        service.add_user(user)
        return jsonify({'message': 'User created!'}), 201  # 201: erfolgreich created
    else:
        user_id = request.args.get('id')
        user = User.query.filter_by(id=user_id).first()
        if user:
            return jsonify(user.to_dict()), 200
        return jsonify({"message": "User not found"}), 404


@user_blueprint.route('/users')
def get_all_users():
    users = service.get_all_users()
    return jsonify([user.to_dict() for user in users]), 200  # list comprehension


@user_blueprint.route('/user/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    success = service.delete_user(user_id)
    if success:
        return jsonify({'message': 'User deleted'}), 200
    else:
        return jsonify({'message': 'User not found'}), 404


@user_blueprint.route('/user/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    data = request.get_json()
    user = service.update_user(user_id, data)
    if user:
        return jsonify(user.to_dict()), 200
    else:
        return jsonify({'message': 'User not found'}), 404