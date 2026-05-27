from flask import Flask, jsonify
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from src.app.db import db
from src.app.services.auth_service import bcrypt
from dotenv import load_dotenv
import os

from src.app.controller import user_controller
from src.app.controller.auth_controller import auth_blueprint
from src.app.models import *

load_dotenv()


DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev_fallback_secret")

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = (f"postgresql://{DB_USER}:{DB_PASSWORD}"
                                         f"@{DB_HOST}:{DB_PORT}/{DB_NAME}")
app.config['JWT_SECRET_KEY'] = JWT_SECRET_KEY

db.init_app(app)
JWTManager(app)
bcrypt.init_app(app)
CORS(app, origins=["http://localhost:4200"])


app.register_blueprint(user_controller.user_controller)
app.register_blueprint(auth_blueprint)

@app.route('/')
def hello_world():
    return 'Hello World!'



@app.route('/fixed_costs')
def get_all_fixed_costs():
    fixed_costs = FixedCosts.query.all()
    return jsonify([fixed_cost.to_dict() for fixed_cost in fixed_costs]), 200



if __name__ == '__main__':
    app.run(debug=True)