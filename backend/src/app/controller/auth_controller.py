from flask import Blueprint, request, jsonify
from src.app.services import auth_service

auth_blueprint = Blueprint('auth', __name__, url_prefix='/auth')


@auth_blueprint.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    name = data.get('name')
    password = data.get('password')

    if not email or not name or not password:
        return jsonify({'error': 'Alle Felder erforderlich'}), 400

    user, error = auth_service.register_user(email, name, password)
    if error:
        return jsonify({'error': error}), 409

    return jsonify({'message': 'Benutzer erstellt', 'id': str(user.id)}), 201


@auth_blueprint.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'E-Mail und Passwort erforderlich'}), 400

    token, error = auth_service.login_user(email, password)
    if error:
        return jsonify({'error': error}), 401

    return jsonify({'access_token': token}), 200