# Budget Planner - Backend

A Flask-based REST API for managing personal budgets, transactions, and fixed costs.

## Tech Stack

- **Framework**: Flask 3.1.3
- **Database**: PostgreSQL
- **ORM**: SQLAlchemy 2.0.49
- **Migrations**: Alembic 1.18.4
- **Environment**: Python 3.13

## Project Structure

```
backend/
├── src/app/
│   ├── controller/         # API route handlers
│   │   └── user_controller.py
│   ├── models/            # Database models
│   │   ├── user.py
│   │   ├── fixed_costs.py
│   │   ├── budgets.py
│   │   ├── categories.py
│   │   ├── transactions.py
│   │   └── has_user_fixed_costs.py
│   ├── services/          # Business logic layer
│   │   └── user_service.py
│   ├── db.py             # Database initialization
│   └── main.py           # Application entry point
├── alembic/              # Database migrations
├── .env                  # Environment variables
├── alembic.ini          # Alembic configuration
└── requirements.txt     # Python dependencies
```

## Database Models

- **User**: User account management
- **FixedCosts**: Recurring fixed expenses
- **Budgets**: Budget planning and tracking
- **Categories**: Transaction categorization
- **Transactions**: Financial transactions

## Setup

1. **Create virtual environment**:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate  # Windows
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment variables**:
   Create a `.env` file with:
   ```
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=budget_planner
   ```

4. **Run migrations**:
   ```bash
   alembic upgrade head
   ```

5. **Start the server**:
   ```bash
   python src/app/main.py
   ```

The API will be available at `http://localhost:5000`

## API Endpoints

- `GET /` - Health check
- `GET /fixed_costs` - Get all fixed costs
- User endpoints available via `/users` blueprint

## Database Migrations

- **Create migration**: `alembic revision --autogenerate -m "description"`
- **Apply migrations**: `alembic upgrade head`
- **Rollback**: `alembic downgrade -1`

## Dependencies

See `requirements.txt` for full list of dependencies including:
- Flask & Flask-SQLAlchemy
- PostgreSQL drivers (psycopg2-binary, psycopg-binary)
- Alembic for migrations
- python-dotenv for environment management
