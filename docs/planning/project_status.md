# Projektstatus: BudgetPlanner (Backend)
Datum: 2026-05-25

## 📂 Projektstruktur
Das Projekt ist als Flask-Anwendung mit SQLAlchemy (PostgreSQL) strukturiert.

```text
C:\Users\linda\Documents\BudgetPlanner\backend
├── alembic\               # Datenbank-Migrationen
├── docs\
│   └── ToDo.txt           # Aktuelle To-Dos
├── src\
│   └── app\
│       ├── controller\
│       │   └── user_controller.py
│       ├── models\
│       │   ├── __init__.py
│       │   ├── categories.py
│       │   ├── fixed_costs.py
│       │   ├── has_user_fixed_costs.py
│       │   └── user.py
│       ├── services\
│       │   └── user_service.py
│       ├── __init__.py
│       ├── db.py          # SQLAlchemy Instanz
│       └── main.py        # Flask App Entrypoint
├── alembic.ini
└── requirements.txt
```

## 🏗️ Models (Datenbankstruktur)

### User (`user.py`)
- **id**: UUID (Primary Key)
- **name**: String(100)
- **email**: String(120)
- **hashed_password**: String(100)
- **Beziehungen**: `fixed_costs` (Relationship zu FixedCosts)

### Categories (`categories.py`)
- **id**: UUID (Primary Key)
- **user_id**: UUID (Foreign Key)
- **name**: String(100)
- **type**: Enum (INCOME, EXPENSE)
- **Timestamps**: created_at, updated_at, deleted_at

### FixedCosts (`fixed_costs.py`)
- **id**: UUID (Primary Key)
- **category_id**: UUID (Foreign Key)
- **user_id**: UUID (Foreign Key)
- **name**: String(100)
- **description**: String(120)
- **money_amount**: Numeric(12, 2)
- **interval_unit**: Enum (DAY, WEEK, MONTH, YEAR)
- **interval_value**: Integer
- **next_due_date**: DateTime
- **is_active**: Boolean

### Hilfstabellen
- **has_user_fixed_costs**: Verknüpfungstabelle (User <-> FixedCosts)

## 🛠️ Services

### UserService (`user_service.py`)
- `add_user(user)`: Speichert einen neuen Benutzer.
- `get_user(user_id)`: Ruft einen Benutzer ab.
- `get_all_users()`: Liste aller Benutzer.
- `delete_user(user_id)`: Löscht einen Benutzer.
- `update_user(user_id, data)`: Aktualisiert Benutzerdaten.

## 🕹️ Controller & Endpunkte

### UserController (`user_controller.py`)
- `POST /user`: Erstellt einen neuen Benutzer.
- `GET /user?id=<id>`: Ruft einen spezifischen Benutzer ab.
- `GET /users`: Liste aller Benutzer.
- `DELETE /user/<id>`: Löscht einen Benutzer.
- `PUT /user/<id>`: Aktualisiert einen Benutzer.

### Hauptanwendung (`main.py`)
- `GET /`: "Hello World!" Test-Route.
- `GET /fixed_costs`: Ruft alle Fixkosten ab (direkt im Controller definiert).

