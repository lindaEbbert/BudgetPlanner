# BudgetPlanner

A full-stack personal finance application for tracking income, expenses, budgets, and fixed costs.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 20, TypeScript 5.8, SCSS |
| Backend | Python 3.13, Flask 3.1 |
| ORM | SQLAlchemy 2.0 + Flask-SQLAlchemy |
| Database | PostgreSQL |
| Migrations | Alembic |
| Auth | Flask-JWT-Extended + Flask-Bcrypt |

## Project Structure

```
BudgetPlanner/
├── backend/                  # Flask REST API
│   ├── src/app/
│   │   ├── controller/       # Route handlers (Blueprints)
│   │   ├── services/         # Business logic
│   │   ├── repositories/     # Data access layer
│   │   ├── models/           # SQLAlchemy models
│   │   └── main.py           # App entry point
│   ├── alembic/              # Database migrations
│   └── requirements.txt
├── frontend/                 # Angular SPA
│   ├── src/app/
│   │   ├── core/             # Guards, interceptors, services, layout
│   │   ├── features/         # Feature modules (dashboard, categories, ...)
│   │   └── shared/           # Shared models
│   └── package.json
└── docs/                     # Planning documents
```

## Quick Start

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
source .venv/bin/activate     # macOS/Linux
pip install -r requirements.txt
```

Create a `.env` file in `backend/`:

```env
DB_USER=your_user
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=budget_planner_db
JWT_SECRET_KEY=your_secret_key
```

```bash
alembic upgrade head
python src/app/main.py
```

The API runs at `http://localhost:5000`.

### Frontend

```bash
cd frontend
npm install
ng serve
```

The app runs at `http://localhost:4200`.

## API Overview

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Register new user |
| POST | `/auth/login` | — | Login, returns JWT |
| GET | `/categories` | JWT | Get all categories |
| POST | `/categories` | JWT | Create category |
| PUT | `/categories/<id>` | JWT | Update category |
| DELETE | `/categories/<id>` | JWT | Soft-delete category |

> See [Backend README](backend/README.md) for the full endpoint reference.

## More Information

- [Backend Documentation](backend/README.md) — architecture, all endpoints, migrations
- [Frontend Documentation](frontend/README.md) — routing, auth flow, development commands
