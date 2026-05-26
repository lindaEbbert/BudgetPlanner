# Budgeting App – Phase 4 Service Layer & Business Logic

# Ziel von Phase 4

Definition von:
- Service Layer
- Verantwortlichkeiten
- Business-Logik
- Datenfluss
- Service-Kommunikation
- Repository Layer
- DTO-/Schema-Struktur

---

# Architekturprinzipien

## Controllers koordinieren

Flask Routes:
- lesen Requests
- validieren DTOs
- rufen Services auf
- liefern Responses zurück

Keine Business-Logik in Flask Routes.

---

## Services enthalten Business-Logik

Business-Logik liegt ausschließlich im Backend-Service-Layer.

Dazu gehören:
- Budgetberechnung
- Dashboardaggregation
- Rücklagenlogik
- Goal-Fortschritt
- Projektionen
- Monatsabschlusslogik

---

## Frontend-Verantwortung

Frontend verantwortlich für:
- Darstellung
- Benutzerinteraktion
- Formularlogik
- Tabellenfilter
- lokalen UI-State

Keine zentrale Business-Logik im Frontend.

---

# Geplante Services

```text
AuthService
TransactionService
BudgetService
SavingsGoalService
GoalAllocationService
FixedCostService
FixedCostProjectionService
FixedCostExecutionService
DashboardService
```

---

# MVP-Priorisierung

Savings Goals gehören nicht zum Kern-MVP.

Priorität zunächst auf:
- Transactions
- Budgets
- Fixed Costs
- Dashboard

Savings Goals und Goal Allocations:
- spätere MVP-Erweiterung
- optionaler späterer Sprint

---

# AuthService

Verantwortlich für:
- Registrierung
- Login
- JWT-Handling
- User-Authentifizierung

---

## Methoden

### register_user()

Input:
- Registrierungsdaten

Output:
- neuer Benutzer
- JWT Token

---

### login_user()

Input:
- Email
- Passwort

Output:
- JWT Token
- Benutzerinformationen

---

### get_current_user()

Input:
- JWT Token

Output:
- authentifizierter Benutzer

---

# TransactionService

Verantwortlich für:
- reale Geldbewegungen
- Transaction-Verwaltung
- Balance-Berechnung

Keine Verantwortung für:
- Allocations
- Projektionen
- Rücklagen

---

## Methoden

### create_transaction()

Input:
- CreateTransactionDTO

Output:
- gespeicherte Transaction

---

### update_transaction()

Input:
- Transaction ID
- UpdateTransactionDTO

Output:
- aktualisierte Transaction

---

### void_transaction()

Input:
- Transaction ID

Output:
- Transaction mit is_voided = true

---

### get_transactions()

Input:
- Filterparameter
- Zeitraum
- Kategorie

Output:
- Liste gefilterter Transactions

---

### get_balance()

Input:
- Benutzer
- optional Zeitraum

Output:
- berechneter Kontostand

---

# BudgetService

Verantwortlich für:
- Budgetlimits
- Budgetverbrauch
- Budgetzusammenfassungen

Budgetverbrauch wird berechnet.

Nicht gespeichert.

---

## Methoden

### create_budget()

Input:
- CreateBudgetDTO

Output:
- gespeichertes Budget

---

### update_budget()

Input:
- Budget ID
- UpdateBudgetDTO

Output:
- aktualisiertes Budget

---

### calculate_budget_usage()

Input:
- Budget
- Zeitraum

Output:
- spent
- remaining
- percentage

---

### get_budget_summary()

Input:
- Monat
- Jahr

Output:
- Budgetübersicht mit Verbrauch und Restbeträgen

---

# SavingsGoalService

Verantwortlich für:
- Sparziele
- Ziel-Fortschritt
- Zielstatus

Nicht essenziell für erstes MVP.

---

## Methoden

### create_goal()

Input:
- CreateSavingsGoalDTO

Output:
- gespeichertes Sparziel

---

### update_goal()

Input:
- Goal ID
- UpdateSavingsGoalDTO

Output:
- aktualisiertes Sparziel

---

### get_goal_progress()

Input:
- Goal ID

Output:
- Fortschritt basierend auf Goal Allocations

---

# GoalAllocationService

Verantwortlich für:
- logische Geldreservierungen
- Goal Allocations
- Budgetrest-Transfers

Keine echten Geldbewegungen.

Nicht essenziell für erstes MVP.

---

## Methoden

### allocate_to_goal()

Input:
- Goal ID
- Betrag

Output:
- gespeicherte Goal Allocation

---

### transfer_budget_remainder()

Input:
- Budget
- Ziel
- Betrag

Output:
- Goal Allocation aus Budgetrest

---

### get_goal_allocations()

Input:
- Goal ID

Output:
- Allocation-Historie eines Sparziels

---

# FixedCostService

CRUD-Service für Fixed Costs.

Keine Verantwortung für:
- Projektionen
- Transaction-Erstellung

---

## Methoden

### create_fixed_cost()

Input:
- CreateFixedCostDTO

Output:
- gespeicherter Fixed Cost

---

### update_fixed_cost()

Input:
- Fixed Cost ID
- UpdateFixedCostDTO

Output:
- aktualisierter Fixed Cost

---

### deactivate_fixed_cost()

Input:
- Fixed Cost ID

Output:
- Fixed Cost mit is_active = false

---

# FixedCostProjectionService

Verantwortlich für:
- Berechnung zukünftiger Fixed Cost Projections
- Monatsvorschauen
- erwartete zukünftige Belastungen

Projections werden berechnet.

Nicht gespeichert.

---

## Methoden

### get_monthly_projection()

Input:
- Monat
- Jahr

Output:
- Liste erwarteter Fixed Cost Occurrences

---

### calculate_occurrences()

Input:
- Fixed Cost
- Zeitraum

Output:
- berechnete zukünftige Occurrences

---

# FixedCostExecutionService

Verantwortlich für:
- Erstellung echter Transactions aus Fixed Cost Projections

Transactions werden ausschließlich durch Benutzeraktion erstellt.

Keine automatische Ausführung.

---

## Methoden

### create_transactions_from_projection()

Input:
- ausgewählte Projections

Output:
- erzeugte Transactions

---

### validate_duplicate_transactions()

Input:
- Projection
- Zeitraum

Output:
- Information ob bereits eine Transaction existiert

---

# DashboardService

Verantwortlich für:
- Dashboardaggregation
- Zusammenführung mehrerer Services
- zentrale Finanzübersicht

---

## Methoden

### get_dashboard_summary()

Input:
- Benutzer
- optional Zeitraum

Output:
- vollständige Dashboard-Daten

---

### calculate_free_to_use()

Input:
- Balance
- reservierte Beträge

Output:
- frei verfügbarer Betrag

---

# Service-Kommunikation

## Erlaubt

Services dürfen andere Services verwenden.

Beispiel:

```text
DashboardService
→ BudgetService
→ TransactionService
→ FixedCostProjectionService
```

---

## Nicht erlaubt

Keine zirkulären Abhängigkeiten.

Beispiel:

```text
TransactionService
→ DashboardService
→ TransactionService
```

---

# Repository Layer

## Entscheidung

Ein leichtgewichtiger Repository Layer wird verwendet.

Architektur:

```text
Service
→ Repository
→ Datenbank
```

---

## Ziel

- bessere Testbarkeit
- saubere Datenzugriffe
- klarere Verantwortlichkeiten
- bessere Wartbarkeit

---

## Geplante Repositories

```text
TransactionRepository
BudgetRepository
FixedCostRepository
GoalRepository
GoalAllocationRepository
CategoryRepository
```

---

# DTOs / Schemas

## Ziel

Trennung zwischen:
- API
- Business-Logik
- Datenbankmodell

---

## Geplante DTOs

```text
CreateTransactionDTO
UpdateTransactionDTO
TransactionResponseDTO
CreateBudgetDTO
UpdateBudgetDTO
CreateFixedCostDTO
UpdateFixedCostDTO
```

---

# Berechnungen

## Backend berechnet

- Kontostände
- Budgetverbrauch
- freie Mittel
- Rücklagenstatus
- Goal-Fortschritt
- Projektionen
- Dashboarddaten

---

## Frontend berechnet nicht

Keine zentrale Finanzlogik im Frontend.

Frontend dient ausschließlich:
- Darstellung
- UX
- UI-State

