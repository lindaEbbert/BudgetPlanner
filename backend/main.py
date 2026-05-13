from flask import Flask, request, jsonify
from db import db, add_user

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///db.sqlite3'  # postgresql link
db.init_app(app)


from models import *

with app.app_context():
    db.create_all()


@app.route('/')
def hello_world():
    return 'Hello World!'

@app.route('/user', methods=['POST', 'GET'])
def create_user():
    if request.method == 'POST':
        data = request.get_json()
        # validierung
        user = User(name=data['name'], email=data['email'], hashed_password=data['hashed_password'])
        add_user(user)
        return jsonify({'message': 'User created!'}), 201  # 201: erfolgreich created
    else:
        user_id = request.args.get('id')
        user = User.query.filter_by(id=user_id).first()
        if user:
            return jsonify(user.to_dict()), 200
        return jsonify({"message": "User not found"}), 404

@app.route('/fixed_costs')
def get_all_fixed_costs():
    fixed_costs = FixedCosts.query.all()
    return jsonify([fixed_cost.to_dict() for fixed_cost in fixed_costs]), 200


@app.route('/users')
def get_all_users():
    users = User.query.all()
    return jsonify([user.to_dict() for user in users]), 200  # list comprehension


if __name__ == '__main__':
    app.run(debug=True)