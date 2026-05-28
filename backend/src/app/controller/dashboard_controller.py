from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.app.services import dashboard_service

dashboard_blueprint = Blueprint('dashboard', __name__, url_prefix='/dashboard')


@dashboard_blueprint.route('', methods=['GET'])
@jwt_required()
def get_dashboard():
    user_id = get_jwt_identity()
    month = request.args.get('month', type=int)
    year = request.args.get('year', type=int)
    summary = dashboard_service.get_summary(user_id, month, year)
    return jsonify(summary), 200