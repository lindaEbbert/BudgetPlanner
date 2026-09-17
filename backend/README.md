# BudgetPlanner — Backend

Flask REST API with JWT authentication, a 3-layer architecture, and PostgreSQL.

## Tech Stack

- **Python** 3.13
- **Flask** 3.1 + Flask-SQLAlchemy + Flask-JWT-Extended + Flask-Bcrypt + Flask-CORS
- **Database**: PostgreSQL
- **ORM**: SQLAlchemy 2.0
- **Migrations**: Alembic
- **AI**: `ai-sdk-python` → `glm-4.7-flash` via the z.ai API (category suggestions)

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
│   │   ├── auth_controller.py           # /auth routes
│   │   ├── category_controller.py       # /categories routes
│   │   ├── transaction_controller.py    # /transactions routes
│   │   ├── budget_controller.py         # /budgets routes
│   │   ├── fixed_cost_controller.py     # /fixed-costs routes
│   │   ├── dashboard_controller.py      # /dashboard routes
│   │   ├── docs_controller.py           # /openapi.json and /docs (Swagger UI)
│   │   └── user_controller.py           # /user routes (legacy, unauthenticated)
│   ├── services/
│   │   ├── auth_service.py
│   │   ├── category_service.py
│   │   ├── category_suggestion_service.py  # LLM category suggestion (z.ai)
│   │   ├── transaction_service.py       # balance & carryover calculation
│   │   ├── budget_service.py            # budget spent/remaining calculation
│   │   ├── fixed_cost_service.py        # projections & required-reserve calculation
│   │   ├── dashboard_service.py         # aggregates the above into the overview
│   │   └── user_service.py
│   ├── repositories/
│   │   ├── base_repository.py           # Generic CRUD base class
│   │   ├── category_repository.py
│   │   ├── transaction_repository.py
│   │   ├── budget_repository.py
│   │   ├── fixed_cost_repository.py
│   │   └── user_repository.py
│   ├── models/
│   │   ├── user.py
│   │   ├── categories.py
│   │   ├── transactions.py
│   │   ├── budgets.py
│   │   └── fixed_costs.py
│   ├── openapi/
│   │   ├── openapi.yaml                 # OpenAPI 3.1 spec of the API
│   │   └── swagger_ui.html              # Swagger UI page served at /docs
│   ├── db.py                            # SQLAlchemy instance
│   └── main.py                          # App factory & blueprint registration
├── alembic/                             # Migration files
├── tests/
│   ├── conftest.py                      # Test DB setup & shared fixtures
│   └── test_*.py
├── alembic.ini
├── pytest.ini
├── requirements.txt
├── requirements-dev.txt                 # requirements.txt + test tooling
└── test.http                            # Manual API test file
```

## Database Models

| Model | Table | Description |
|---|---|---|
| `User` | `user` | User accounts (email unique, password hashed) |
| `Categories` | `categories` | User-defined labels per user (name only), supports soft-delete |
| `Transactions` | `transactions` | Financial transactions (`INCOME` / `EXPENSE` / `INITIAL`), optionally linked to a category |
| `Budgets` | `budgets` | Monthly budget limits per user and category |
| `FixedCosts` | `fixed_costs` | Recurring costs with interval and start date |

## API Endpoints

No `/api` prefix. Protected routes require `Authorization: Bearer <access_token>`
(token comes from `POST /auth/login`). All amounts are decimal strings/numbers;
all ids are UUIDs. JSON bodies use camelCase keys; responses do too.

### Auth — `/auth`

| Method | Path | Body | Description |
|---|---|---|---|
| POST | `/auth/register` | `email`, `name`, `password` | Register a new user — returns `{ message, id }` |
| POST | `/auth/login` | `email`, `password` | Login — returns `{ access_token }` |

### Categories — `/categories` *(JWT required)*

| Method | Path | Body | Description |
|---|---|---|---|
| GET | `/categories` | — | All categories for the authenticated user |
| POST | `/categories` | `name` | Create a category (a plain label; usable by both income and expense transactions) |
| PUT | `/categories/<id>` | `name` | Rename a category |
| DELETE | `/categories/<id>` | — | Soft-delete a category |

### Transactions — `/transactions` *(JWT required)*

| Method | Path | Body / Query | Description |
|---|---|---|---|
| GET | `/transactions` | `?month&year&day&include_voided` (all optional) | List transactions, newest first |
| GET | `/transactions/balance` | `?month&year&day` (optional) | Computed balance — `{ income, expense, initialBalance, balance }`. With `month`/`year`/`day` the balance is calculated up to that date incl. carryover |
| POST | `/transactions` | `name`, `amount`, `type`, `transactionDate`, `categoryId`*, `description`?, `fixedCostId`? | Create a transaction. `type`: `INCOME` \| `EXPENSE` \| `INITIAL`. `categoryId` required unless `type` is `INITIAL` |
| POST | `/transactions/category-suggestion` | `name`, `type` (`INCOME` \| `EXPENSE` \| `INITIAL`), `description`? | Category Suggestion from an LLM — `{ categoryId, newCategoryName }`: an existing category's id, a proposed new category name, or both `null` (no suggestion, also when the LLM call fails). Only `name`, `description`, `type` and the user's category names are sent to z.ai. Writes nothing |
| PUT | `/transactions/<id>` | any of the create fields | Update a transaction |
| POST | `/transactions/<id>/void` | — | Mark a transaction as voided (it stops counting; not deleted) |
| DELETE | `/transactions/<id>` | — | Not allowed — always `405`; use void instead |

### Budgets — `/budgets` *(JWT required)*

| Method | Path | Body / Query | Description |
|---|---|---|---|
| GET | `/budgets` | `?month&year` (both required; `month` = 1–12) | Budgets for that month with computed `spent`, `remaining`, `percentage` |
| POST | `/budgets` | `categoryId`, `month` (1–12), `year`, `limitAmount` | Create a budget (one per category/month/year). Returns it with the computed summary |
| DELETE | `/budgets/<id>` | — | Delete a budget |

### Fixed Costs — `/fixed-costs` *(JWT required)*

| Method | Path | Body / Query | Description |
|---|---|---|---|
| GET | `/fixed-costs` | — | All active fixed costs |
| GET | `/fixed-costs/projections` | `?month&year` (both required) | Fixed costs expected to occur that month — `{ projections, total }` |
| POST | `/fixed-costs` | `name`, `amount`, `intervalUnit`, `intervalValue`, `startDate`, `categoryId`?, `description`? | Create a fixed cost. `intervalUnit`: `DAY` \| `WEEK` \| `MONTH` \| `YEAR`; `intervalValue` > 0 |
| PUT | `/fixed-costs/<id>` | any of `name`, `amount`, `description`, `intervalUnit`, `intervalValue` | Update a fixed cost |
| DELETE | `/fixed-costs/<id>` | — | Soft-delete a fixed cost |

### Dashboard — `/dashboard` *(JWT required)*

| Method | Path | Query | Description |
|---|---|---|---|
| GET | `/dashboard` | `?month&year&day` (optional, defaults to today) | Aggregated overview — `{ month, year, balance, remainingBudgets, projectedFixedCosts, freeToUse, recentTransactions }` |

### Users — `/user` *(legacy, unauthenticated)*

Predates `/auth` and is not JWT-guarded; `<id>` is typed as an integer and does
not match the UUID primary keys. Kept only for local inspection — use `/auth` for
real user creation.

| Method | Path | Description |
|---|---|---|
| POST | `/user` | Create a user (`name`, `email`, `hashed_password`) |
| GET | `/user?id=<id>` | Get one user |
| GET | `/users` | Get all users |
| PUT | `/user/<id>` | Update a user |
| DELETE | `/user/<id>` | Delete a user |

### Other

| Method | Path | Description |
|---|---|---|
| GET | `/` | Health check — returns `Hello World!` |
| GET | `/openapi.json` | OpenAPI document (no token required) |
| GET | `/docs` | Swagger UI (no token required) |

\* `categoryId` is required for `INCOME` / `EXPENSE`, omitted for `INITIAL`.

## API Documentation (OpenAPI / Swagger UI)

With the server running:

- **Swagger UI:** `http://localhost:5000/docs` — browse and try out every endpoint.
  For protected routes, call `POST /auth/login` and paste the `access_token`
  into **Authorize**.
- **OpenAPI document:** `http://localhost:5000/openapi.json` (OpenAPI 3.1)

The spec is written by hand in `src/app/openapi/openapi.yaml` and served by
`docs_controller.py`; no Flask-specific Swagger library is used. It documents
the implemented behavior, including known cases that fail with 500.
`GET /fixed-costs/<selected_month><selected_year>` is an unimplemented stub
and intentionally left out.

**Keep it in sync:** when you change a route, its validation, or a response
dict (`*_to_dict`), update `openapi.yaml` in the same change.

Swagger UI is loaded from jsDelivr (pinned version with integrity hashes), so
`/docs` needs internet access in the browser.

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
   Z_AI_API_KEY=your_z_ai_api_key
   ```
   `Z_AI_API_KEY` comes from the [z.ai API console](https://z.ai/manage-apikey/apikey-list)
   and is only needed for category suggestions — without it the suggestion
   endpoint simply returns no suggestion.

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

## Automated Tests

Tests use `pytest` and run against a separate PostgreSQL database, never the
development database from `DB_NAME`.

```bash
pip install -r requirements-dev.txt   # once
pytest                                # run from backend/
pytest tests/test_category_service.py # a single file
```

- **Test database**: `<DB_NAME>_test` (override with `TEST_DB_NAME` in `.env`;
  the name must end in `_test`), using the same
  `DB_USER`/`DB_PASSWORD`/`DB_HOST`/`DB_PORT`. It is created
  automatically on the first run, which requires the DB user to have the
  `CREATEDB` privilege.
- **Reset**: each test run drops and recreates the schema from the models
  (`db.create_all()`, not Alembic); after every test all tables are truncated,
  so tests never see each other's data.
- **Fixtures** (`tests/conftest.py`):

  | Fixture | Provides |
  |---|---|
  | `app` | Flask app configured for the test database |
  | `client` | Flask test client |
  | `user` | A registered test user |
  | `access_token` | A valid JWT for `user` |
  | `auth_headers` | `{"Authorization": "Bearer <access_token>"}` for `client` requests |
  | `model_answers` | Stubs the LLM behind category suggestions — `model_answers(existing_category_name=..., new_category_name=...)` sets the answer and returns the recorded calls; no real API requests |

  Every test runs inside an app context, so services can be called directly.

## Manual API Testing

The file `test.http` contains ready-to-use requests for all implemented endpoints.
It can be executed directly in JetBrains IDEs (HTTP Client) or VS Code (REST Client extension).
The login request automatically saves the `access_token` for subsequent requests.
