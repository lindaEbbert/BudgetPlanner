from flask import Flask, jsonify
from src.app.db import db
from dotenv import load_dotenv
import os
from src.app.controller import user_controller
from src.app.models import *

load_dotenv()


DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = (f"postgresql://{DB_USER}:{DB_PASSWORD}"
                                         f"@{DB_HOST}:{DB_PORT}/{DB_NAME}")
db.init_app(app)


@app.route('/')
def hello_world():
    return 'Hello World!'



@app.route('/fixed_costs')
def get_all_fixed_costs():
    fixed_costs = FixedCosts.query.all()
    return jsonify([fixed_cost.to_dict() for fixed_cost in fixed_costs]), 200


app.register_blueprint(user_controller.user_controller)


if __name__ == '__main__':
    app.run(debug=True)