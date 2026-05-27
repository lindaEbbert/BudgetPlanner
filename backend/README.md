# BudgetPlanner — Backend

Flask REST API with JWT authentication, a 3-layer architecture, and PostgreSQL.

## Tech Stack

- **Python** 3.13
- **Flask** 3.1 + Flask-SQLAlchemy + Flask-JWT-Extended + Flask-Bcrypt + Flask-CORS
- **Database**: PostgreSQL
- **ORM**: SQLAlchemy 2.0
- **Migrations**: Alembic

## Architecture

The backend follows a strict 3-layer pattern:

```
Request → Controller → Service → Repository → Database
```

| Layer | Folder | Responsibility |
|---|---|---|
| Controller | `controller/` | HTTP routing, request parsing, response formatting |
| Service | `services/` | Business logic, validation, error handling |
| Repository | `repositories/` | Database queries, data access |
| Model | `models/` | SQLAlchemy table definitions |

### Project Structure

```
backend/
├── src/app/
│   ├── controller/
│   │   ├── auth_controller.py       # /auth routes
│   │   ├── category_controller.py   # /categories routes
│   │   └── user_controller.py       # /user routes
│   ├── services/
│   │   ├── auth_service.py
│   │   ├── category_service.py
│   │   └── user_service.py
│   ├── repositories/
│   │   ├── base_repository.py       # Generic CRUD base class
│   │   ├── category_repository.py
│   │   └── user_repository.py
│   ├── models/
│   │   ├── user.py
│   │   ├── categories.py
│   │   ├── transactions.py
│   │   ├── budgets.py
│   │   └── fixed_costs.py
│   ├── db.py                        # SQLAlchemy instance
│   └── main.py                      # App factory & blueprint registration
├── alembic/                         # Migration files
├── alembic.ini
├── requirements.txt
└── test.http                        # Manual API test file
```

## Database Models

| Model | Table | Description |
|---|---|---|
| `User` | `user` | User accounts (email unique, password hashed) |
| `Categories` | `categories` | Income/Expense categories per user, supports soft-delete |
| `Transactions` | `transactions` | Financial transactions linked to a category |
| `Budgets` | `budgets` | Monthly budget limits per user and category |
| `FixedCosts` | `fixed_costs` | Recurring costs with interval and start date |

## API Endpoints

### Auth — `/auth`

| Method | Path | Body | Description |
|---|---|---|---|
| POST | `/auth/register` | `email`, `name`, `password` | Register a new user |
| POST | `/auth/login` | `email`, `password` | Login — returns `access_token` |

### Categories — `/categories` *(JWT required)*

| Method | Path | Body | Description |
|---|---|---|---|
| GET | `/categories` | — | Get all categories for the authenticated user |
| POST | `/categories` | `name`, `type` | Create a category (`type`: `INCOME` or `EXPENSE`) |
| PUT | `/categories/<id>` | `name`, `type` | Update a category |
| DELETE | `/categories/<id>` | — | Soft-delete a category |

### Users — `/user`

| Method | Path | Description |
|---|---|---|
| POST | `/user` | Create a user |
| GET | `/user` | Get a user |
| GET | `/users` | Get all users |
| PUT | `/user/<id>` | Update a user |
| DELETE | `/user/<id>` | Delete a user |

### Other

| Method | Path | Description |
|---|---|---|
| GET | `/` | Health check |
| GET | `/fixed_costs` | Get all fixed costs |

## Setup

1. **Create and activate virtual environment**
   ```bash
   python -m venv .venv
   .venv\Scripts\activate     # Windows
   source .venv/bin/activate  # macOS/Linux
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Create `.env` file** in the `backend/` directory
   ```env
   DB_USER=your_user
   DB_PASSWORD=your_password
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=budget_planner_db
   JWT_SECRET_KEY=your_secret_key
   ```

4. **Run migrations**
   ```bash
   alembic upgrade head
   ```

5. **Start the server**
   ```bash
   python src/app/main.py
   ```

API available at `http://localhost:5000`.

## Database Migrations

```bash
# Create a new migration
alembic revision --autogenerate -m "describe the change"

# Apply all migrations
alembic upgrade head

# Roll back one step
alembic downgrade -1
```

## Manual API Testing

The file `test.http` contains ready-to-use requests for all implemented endpoints.
It can be executed directly in JetBrains IDEs (HTTP Client) or VS Code (REST Client extension).
The login request automatically saves the `access_token` for subsequent requests.
