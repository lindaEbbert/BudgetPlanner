from flask import Flask, jsonify
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from src.app.db import db
from src.app.services.auth_service import bcrypt
from dotenv import load_dotenv
import os

from src.app.controller.user_controller import user_blueprint
from src.app.controller.auth_controller import auth_blueprint
from src.app.controller.category_controller import category_blueprint
from src.app.controller.transaction_controller import transaction_blueprint
from src.app.controller.dashboard_controller import dashboard_blueprint
from src.app.controller.budget_controller import budget_blueprint
from src.app.controller.fixed_cost_controller import fixed_cost_blueprint
from src.app.controller.docs_controller import docs_blueprint
from src.app.models import *

load_dotenv()


DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev_fallback_secret")

def build_database_uri(db_name):
    return (f"postgresql://{DB_USER}:{DB_PASSWORD}"
            f"@{DB_HOST}:{DB_PORT}/{db_name}")


def create_app(config_overrides=None):
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = build_database_uri(DB_NAME)
    app.config['JWT_SECRET_KEY'] = JWT_SECRET_KEY
    app.config['JWT_TOKEN_LOCATION'] = ['headers']
    if config_overrides:
        app.config.update(config_overrides)

    db.init_app(app)
    JWTManager(app)
    bcrypt.init_app(app)
    CORS(app, origins=["http://localhost:4200"])

    app.register_blueprint(user_blueprint)
    app.register_blueprint(auth_blueprint)
    app.register_blueprint(category_blueprint)
    app.register_blueprint(transaction_blueprint)
    app.register_blueprint(dashboard_blueprint)
    app.register_blueprint(budget_blueprint)
    app.register_blueprint(fixed_cost_blueprint)
    app.register_blueprint(docs_blueprint)

    @app.route('/')
    def hello_world():
        return 'Hello World!'

    return app


app = create_app()


if __name__ == '__main__':
    app.run(debug=True)