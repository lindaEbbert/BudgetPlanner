# BudgetPlanner

A full-stack personal budget planning application with Flask backend and TypeScript frontend.

## Overview

BudgetPlanner is a tool designed to help users track their finances, manage budgets, categorize transactions, and monitor fixed costs. The application provides a REST API for data management and user operations.

## Tech Stack

### Backend
- **Language:** Python 3.13
- **Framework:** Flask 3.1.3
- **ORM:** SQLAlchemy 2.0.49
- **Database:** PostgreSQL
- **Migrations:** Alembic 1.18.4
- **Environment:** python-dotenv

### Frontend
- **Language:** TypeScript 5.5.3
- **Build Tool:** TypeScript Compiler (tsc)

## Project Structure

```text
BudgetPlanner/
├── backend/
│   ├── src/app/
│   │   ├── controller/           # API route handlers
│   │   │   └── user_controller.py
│   │   ├── models/               # SQLAlchemy models
│   │   │   ├── user.py
│   │   │   ├── fixed_costs.py
│   │   │   ├── budgets.py
│   │   │   ├── categories.py
│   │   │   ├── transactions.py
│   │   │   └── has_user_fixed_costs.py
│   │   ├── services/             # Business logic layer
│   │   │   └── user_service.py
│   │   ├── db.py                # Database initialization
│   │   └── main.py              # Application entry point
│   ├── alembic/                 # Database migrations
│   ├── .env                     # Environment variables (not in Git!)
│   ├── alembic.ini              # Alembic configuration
│   └── requirements.txt         # Python dependencies
├── frontend/
│   ├── src/                     # TypeScript source files
│   ├── package.json             # Node.js dependencies
│   └── tsconfig.json            # TypeScript configuration
└── README.md
```

## Database Models

- **User**: User account management
- **FixedCosts**: Recurring fixed expenses
- **Budgets**: Budget planning and tracking
- **Categories**: Transaction categorization
- **Transactions**: Financial transactions
- **HasUserFixedCosts**: Junction table linking users to their fixed costs

## Setup & Start

### Prerequisites

- Python 3.13+
- PostgreSQL Database
- Node.js & npm (for frontend)

### Backend Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd BudgetPlanner/backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate  # Windows
   source .venv/bin/activate  # macOS/Linux
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables:
   Create a `.env` file in the `backend/` directory:
   ```env
   DB_USER=your_user
   DB_PASSWORD=your_password
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=budget_planner_db
   ```

5. Run database migrations:
   ```bash
   alembic upgrade head
   ```

6. Start the Flask server:
   ```bash
   python src/app/main.py
   ```

The server starts on `http://127.0.0.1:5000/` by default.

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the TypeScript files:
   ```bash
   npm run build
   ```

## API Endpoints

### General
- `GET /` - Health check endpoint

### Users
- `POST /users` - Create a new user
- `GET /users/<id>` - Get user by ID
- `GET /users` - Get all users

### Fixed Costs
- `GET /fixed_costs` - Get all fixed costs

## Database Migrations

- **Create migration**: `alembic revision --autogenerate -m "description"`
- **Apply migrations**: `alembic upgrade head`
- **Rollback**: `alembic downgrade -1`

## Environment Variables

The following variables must be defined in the `backend/.env` file:

- `DB_USER`: PostgreSQL username
- `DB_PASSWORD`: PostgreSQL password
- `DB_HOST`: Database host (e.g., localhost)
- `DB_PORT`: Database port (Default: 5432)
- `DB_NAME`: Name of the database

## Development

See individual README files for more details:
- [Backend Documentation](backend/README.md)

## License

TODO: Add a LICENSE file.