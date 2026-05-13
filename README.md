# BudgetPlanner

A simple personal budget planning application with a Flask backend.

## Overview

BudgetPlanner is a tool designed to help users track their fixed costs and manage their budget. Currently, it features a backend API for user management and cost tracking.

## Stack

- **Language:** Python 3.x
- **Framework:** [Flask](https://flask.palletsprojects.com/)
- **ORM:** [Flask-SQLAlchemy](https://flask-sqlalchemy.palletsprojects.com/)
- **Database:** SQLite (Default), configuration for PostgreSQL available.
- **Package Manager:** pip (`requirements.txt` included)

## Project Structure

```text
BudgetPlanner/
├── backend/
│   ├── main.py              # Application entry point & routes
│   ├── db.py                # Database configuration & helpers
│   ├── models/              # SQLAlchemy models
│   │   ├── user.py          # User model
│   │   ├── fixed_costs.py   # Fixed costs model
│   │   └── ...
│   ├── docs/                # Project documentation & ToDos
│   └── requirements.txt     # Python dependencies
└── README.md
```

## Setup & Run

### Requirements

- Python 3.x
- Flask
- Flask-SQLAlchemy

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

### Running the Application

Start the Flask server:

```bash
python backend/main.py
```

The server will start on `http://127.0.0.1:5000/` by default.

## API Endpoints

- `GET /`: Returns a simple "Hello World!" message.
- `POST /user`: Create a new user (JSON body: `name`, `email`, `hashed_password`).
- `GET /user?id=<id>`: Get user details by ID.
- `GET /users`: List all registered users.

## Scripts

- `python backend/main.py`: Runs the development server and initializes the database.

## Environment Variables

- TODO: Implement environment variable support for database URIs and secret keys.

## Tests

- TODO: Add unit and integration tests.

## License

- TODO: Add a LICENSE file.