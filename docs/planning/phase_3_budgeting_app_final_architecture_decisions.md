# Budgeting App – Phase 3 Final Architecture Decisions

## Technologie-Stack

### Backend
- Python
- Flask
- SQLAlchemy
- Alembic
- Flask-JWT-Extended

### Frontend
- Angular
- TypeScript
- Angular Material
- Angular Signals
- RxJS

### Datenbank
- PostgreSQL

---

# Architekturprinzipien

## Business-Logik

Business-Logik liegt im Backend.

Dazu gehören:
- Budgetberechnung
- Dashboardaggregation
- Rücklagenberechnung
- Goal-Fortschritte
- verfügbare Mittel
- Monatsabschlusslogik

Frontend verantwortlich für:
- Darstellung
- Benutzerinteraktion
- Formularlogik

---

## Datenmodell

Speichern:
- Rohdaten
- Fakten
- Zustandsänderungen

Berechnen:
- Kontostände
- Budgetverbrauch
- Goal-Fortschritt
- verfügbare Mittel
- Rücklagenstatus
- Aggregationen

---

## Soft Delete

Verwendet für:
- categories
- savings_goals
- fixed_costs

Felder:

```text
created_at
updated_at
deleted_at
```

---

## Transactions

Transactions werden nicht hart gelöscht.

Zusätzliches Feld:

```text
is_voided
```

---

# Finanzmodell

## Ein Hauptkonto

Die Anwendung verwendet:
- ein reales Hauptkonto
- virtuelle Geldreservierungen

Keine echten Multi-Accounts im MVP.

---

## Virtuelle Reservierungen

Verwendet für:
- Budgets
- Sparziele
- Fixed Cost Rücklagen

---

## Freie Mittel

Berechnung:

```text
real_balance
- allocated_money
= free_to_use
```

---

# Tabellenstruktur

## users

```text
id UUID PRIMARY KEY
email
password_hash
created_at
updated_at
```

---

## categories

```text
id UUID PRIMARY KEY
user_id FK
name
type
color
created_at
updated_at
deleted_at
```

---

## transactions

```text
id UUID PRIMARY KEY
user_id FK
category_id FK
amount NUMERIC(12,2)
type
transaction_date
description
is_voided
created_at
updated_at
```

---

## budgets

```text
id UUID PRIMARY KEY
user_id FK
category_id FK
month
year
limit_amount NUMERIC(12,2)
created_at
updated_at
```

---

## savings_goals

```text
id UUID PRIMARY KEY
user_id FK
name
target_amount NUMERIC(12,2)
description
created_at
updated_at
deleted_at
```

---

## fixed_costs

```text
id UUID PRIMARY KEY
user_id FK
category_id FK
name
amount NUMERIC(12,2)
interval_unit
interval_value
next_due_date
is_active
created_at
updated_at
deleted_at
```

---

## goal_allocations

```text
id UUID PRIMARY KEY
user_id FK
savings_goal_id FK
amount NUMERIC(12,2)
allocation_date
note
created_at
updated_at
```

---

# UUID-Strategie

Alle Haupttabellen verwenden:

```text
UUID PRIMARY KEY
```

PostgreSQL:

```sql
gen_random_uuid()
```

---

# Monetary Values

Alle Geldbeträge verwenden:

```sql
NUMERIC(12,2)
```

Kein FLOAT.

---

# Zeitmodell

Verwendete Zeitfelder:

```text
transaction_date
created_at
updated_at
```

---

# Fixed Cost Modell

## Flexible Intervalle

Kein ENUM-System für Frequenzen.

Verwendet:

```text
interval_unit
interval_value
```

---

## Beispiele

```text
2 weeks
4 months
12 months
10 days
```

---

# Transaction-Modell

## Amount

Transactions speichern:
- positive Beträge
- separates type-Feld

---

## Transaction Types

Geplante Werte:

```text
income
expense
initial_balance
```

---

# Allocation-Modell

## Separate Tabellen

Keine polymorphen Allocations.

Verwendet:

```text
goal_allocations
```

Später optional:

```text
fixed_cost_reserves
budget_rollovers
```

---

# Kategorien

## Benutzerdefiniert

Kategorien werden vom Benutzer erstellt.

---

## Category Types

```text
income
expense
```

---

# Budgets

## Modell

Ein Budget:
- pro Kategorie
- pro Monat
- pro Benutzer

---

## Verbrauch

Budgetverbrauch wird berechnet.

Nicht gespeichert.

---

# Savings Goals

## Modell

Virtuelle Geldtöpfe.

Keine echten Konten.

---

## Goal Amount

Aktueller Goal-Betrag wird aus goal_allocations berechnet.

---

# Fixed Costs

## Modell

Fixed Costs sind:
- Planungsobjekte
- keine echten Transactions

---

## Berechnungen

Die Anwendung berechnet:
- benötigte Rücklage
- monatliche Rücklage
- Deckungsstatus

---

# Initial Balance

Initiales Kapital wird gespeichert als:

```text
Transaction
(type = initial_balance)
```

---

# REST API

## Auth

```http
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

---

## Categories

```http
GET    /api/categories
POST   /api/categories
PUT    /api/categories/:id
DELETE /api/categories/:id
```

---

## Transactions

```http
GET    /api/transactions
GET    /api/transactions/:id
POST   /api/transactions
PUT    /api/transactions/:id
DELETE /api/transactions/:id
```

---

## Budgets

```http
GET  /api/budgets
POST /api/budgets
PUT  /api/budgets/:id
```

---

## Savings Goals

```http
GET    /api/savings-goals
POST   /api/savings-goals
PUT    /api/savings-goals/:id
DELETE /api/savings-goals/:id
```

---

## Goal Allocations

```http
POST /api/goal-allocations
GET  /api/goal-allocations
```

---

## Fixed Costs

```http
GET    /api/fixed-costs
POST   /api/fixed-costs
PUT    /api/fixed-costs/:id
DELETE /api/fixed-costs/:id
```

---

## Dashboard

```http
GET /api/dashboard
```

---

# UNIQUE Constraints

## categories

```sql
UNIQUE(user_id, name)
```

---

## budgets

```sql
UNIQUE(user_id, category_id, month, year)
```

---

## savings_goals

```sql
UNIQUE(user_id, name)
```

---

# Foreign Keys

## transactions

```text
category_id → categories.id
user_id → users.id
```

---

## budgets

```text
category_id → categories.id
user_id → users.id
```

---

## savings_goals

```text
user_id → users.id
```

---

## fixed_costs

```text
category_id → categories.id
user_id → users.id
```

---

## goal_allocations

```text
savings_goal_id → savings_goals.id
user_id → users.id
```

---

# Angular Architektur

## Struktur

```text
src/app/
│
├── core/
├── shared/
├── features/
│   ├── dashboard/
│   ├── transactions/
│   ├── budgets/
│   ├── savings-goals/
│   ├── fixed-costs/
│   └── auth/
```

---

# State Management

Kein NgRx im MVP.

Verwendet:
- Angular Signals
- RxJS

---

# Geplante Services

```text
BudgetService
FixedCostService
GoalAllocationService
DashboardService
TransactionService
```

