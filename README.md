# BudgetPlanner

A simple personal budget planning application with a Flask backend.

## Overview

BudgetPlanner is a tool designed to help users track their fixed costs and manage their budget. Currently, it features a backend API for user management and cost tracking.

## Stack

- **Language:** Python 3.x
- **Framework:** [Flask](https://flask.palletsprojects.com/)
- **ORM:** [Flask-SQLAlchemy](https://flask-sqlalchemy.palletsprojects.com/)
- **Database:** PostgreSQL (configured via `.env`)
- **Package Manager:** pip (`requirements.txt` included)

## Project Structure

```text
BudgetPlanner/
├── backend/
│   ├── main.py              # Application entry point & routes
│   ├── db.py                # Database configuration & helpers
│   ├── .env                 # Environment variables (not in Git!)
│   ├── models/              # SQLAlchemy models
│   │   ├── user.py          # User model
│   │   ├── fixed_costs.py   # Fixed costs model
│   │   ├── has_user_fixed_costs.py # Link between User & Fixed costs
│   │   └── ...
│   ├── docs/                # Project documentation & ToDos
│   └── requirements.txt     # Python dependencies
└── README.md
```

## Setup & Start

### Prerequisites

- Python 3.x
- PostgreSQL Database

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd BudgetPlanner
   ```

2. (Recommended) Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```

4. Configuration of environment variables:
   Create a `.env` file in the `backend/` directory with the following content (example):
   ```env
   DB_USER=your_user
   DB_PASSWORD=your_password
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=budget_planner_db
   ```

### Running the Application

Start the Flask server:

```bash
cd backend
python main.py
```

The server starts on `http://127.0.0.1:5000/` by default.

## API Endpoints

- `GET /`: Returns a simple "Hello World!" message.
- `POST /user`: Create a new user (JSON body: `name`, `email`, `hashed_password`).
- `GET /user?id=<id>`: Retrieve user details by ID.
- `GET /users`: Retrieve a list of all registered users.
- `GET /fixed_costs`: Retrieve a list of all available fixed costs.

## Environment Variables

The following variables must be defined in the `backend/.env` file:

- `DB_USER`: PostgreSQL username
- `DB_PASSWORD`: PostgreSQL password
- `DB_HOST`: Database host (e.g., localhost)
- `DB_PORT`: Database port (Default: 5432)
- `DB_NAME`: Name of the database

## Tests

- TODO: Add unit and integration tests.

## License

- TODO: Add a LICENSE file.