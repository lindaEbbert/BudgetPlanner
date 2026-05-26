# Budgeting App – Service Function Reference

# Ziel des Dokuments

Dieses Dokument beschreibt:
- die geplanten Services
- deren Funktionen
- Verantwortlichkeiten
- Input und Output
- fachliche Bedeutung

Die Beschreibungen dienen als Grundlage für:
- Implementierung
- API-Design
- Roadmap
- Testing
- Architekturentscheidungen

---

# AuthService

Verantwortlich für:
- Benutzerregistrierung
- Login
- JWT-Verarbeitung
- Authentifizierung

---

## register_user()

### Aufgabe

Erstellt einen neuen Benutzeraccount.

---

### Input

```text
- email
- password
```

---

### Ablauf

```text
- prüft ob Benutzer bereits existiert
- validiert Eingaben
- hasht Passwort
- erstellt neuen User
- erzeugt JWT Token
```

---

### Output

```text
- User Objekt
- JWT Token
```

---

## login_user()

### Aufgabe

Authentifiziert einen bestehenden Benutzer.

---

### Input

```text
- email
- password
```

---

### Ablauf

```text
- sucht Benutzer
- prüft Passwort
- erzeugt JWT Token
```

---

### Output

```text
- JWT Token
- Benutzerinformationen
```

---

## get_current_user()

### Aufgabe

Lädt den aktuell authentifizierten Benutzer.

---

### Input

```text
- JWT Token
```

---

### Ablauf

```text
- validiert Token
- extrahiert User ID
- lädt Benutzer aus Datenbank
```

---

### Output

```text
- User Objekt
```

---

# TransactionService

Verantwortlich für:
- reale Geldbewegungen
- Kontostandsberechnung
- Transactionverwaltung

Keine Verantwortung für:
- Allocations
- Projektionen
- virtuelle Reservierungen

---

## create_transaction()

### Aufgabe

Erstellt eine neue reale Geldbewegung.

---

### Input

```text
CreateTransactionDTO
- amount
- type
- category_id
- transaction_date
- description
- optional fixed_cost_id
```

---

### Ablauf

```text
- validiert Daten
- prüft Kategorie
- erstellt Transaction
- speichert Transaction
```

---

### Output

```text
- gespeicherte Transaction
```

---

## update_transaction()

### Aufgabe

Aktualisiert eine bestehende Transaction.

---

### Input

```text
- transaction_id
- UpdateTransactionDTO
```

---

### Ablauf

```text
- lädt Transaction
- prüft Änderbarkeit
- aktualisiert Felder
- speichert Änderungen
```

---

### Output

```text
- aktualisierte Transaction
```

---

## void_transaction()

### Aufgabe

Markiert eine Transaction als ungültig ohne sie zu löschen.

---

### Input

```text
- transaction_id
```

---

### Ablauf

```text
- lädt Transaction
- setzt is_voided = true
- speichert Änderung
```

---

### Output

```text
- voided Transaction
```

---

## get_transactions()

### Aufgabe

Lädt Transactions anhand von Filtern.

---

### Input

```text
- Zeitraum
- Kategorie
- Transaction Type
- Pagination
```

---

### Ablauf

```text
- erstellt Query
- wendet Filter an
- sortiert Ergebnisse
- lädt Transactions
```

---

### Output

```text
- Liste von Transactions
```

---

## get_balance()

### Aufgabe

Berechnet den aktuellen Kontostand.

---

### Input

```text
- user_id
- optional Zeitraum
```

---

### Ablauf

```text
- lädt relevante Transactions
- ignoriert voided Transactions
- summiert income und expense
```

---

### Output

```text
- berechneter Kontostand
```

---

# BudgetService

Verantwortlich für:
- Budgetlimits
- Budgetverbrauch
- Budgetübersichten

Budgetstände werden berechnet.

Nicht gespeichert.

---

## create_budget()

### Aufgabe

Erstellt ein Budget für eine Kategorie und einen Monat.

---

### Input

```text
CreateBudgetDTO
- category_id
- month
- year
- limit_amount
```

---

### Ablauf

```text
- prüft UNIQUE Constraint
- erstellt Budget
- speichert Budget
```

---

### Output

```text
- gespeichertes Budget
```

---

## update_budget()

### Aufgabe

Aktualisiert ein bestehendes Budget.

---

### Input

```text
- budget_id
- UpdateBudgetDTO
```

---

### Ablauf

```text
- lädt Budget
- aktualisiert Felder
- speichert Änderungen
```

---

### Output

```text
- aktualisiertes Budget
```

---

## calculate_budget_usage()

### Aufgabe

Berechnet den aktuellen Verbrauch eines Budgets.

---

### Input

```text
- budget_id
```

---

### Ablauf

```text
- lädt Budget
- lädt passende Transactions
- summiert Ausgaben
- berechnet Restbetrag
- berechnet Prozentwert
```

---

### Output

```text
- spent
- remaining
- percentage
```

---

## get_budget_summary()

### Aufgabe

Erzeugt eine vollständige Budgetübersicht für einen Zeitraum.

---

### Input

```text
- month
- year
```

---

### Ablauf

```text
- lädt alle Budgets
- berechnet Verbrauch
- kombiniert Ergebnisse
```

---

### Output

```text
- Liste aller Budgetübersichten
```

---

# SavingsGoalService

Nicht essenziell für erstes MVP.

Verantwortlich für:
- Sparziele
- Goal-Fortschritt
- Zielstatus

---

## create_goal()

### Aufgabe

Erstellt ein neues Sparziel.

---

### Input

```text
CreateSavingsGoalDTO
- name
- target_amount
- description
```

---

### Ablauf

```text
- validiert Eingaben
- erstellt Goal
- speichert Goal
```

---

### Output

```text
- gespeichertes Goal
```

---

## update_goal()

### Aufgabe

Aktualisiert ein bestehendes Sparziel.

---

### Input

```text
- goal_id
- UpdateSavingsGoalDTO
```

---

### Ablauf

```text
- lädt Goal
- aktualisiert Felder
- speichert Änderungen
```

---

### Output

```text
- aktualisiertes Goal
```

---

## get_goal_progress()

### Aufgabe

Berechnet den Fortschritt eines Sparziels.

---

### Input

```text
- goal_id
```

---

### Ablauf

```text
- lädt Goal
- lädt Goal Allocations
- summiert reservierte Beträge
- berechnet Fortschritt
```

---

### Output

```text
- aktueller Betrag
- Zielbetrag
- Fortschritt in Prozent
```

---

# GoalAllocationService

Nicht essenziell für erstes MVP.

Verantwortlich für:
- logische Geldreservierungen
- Goal Allocations
- Budgetrest-Transfers

Keine echten Geldbewegungen.

---

## allocate_to_goal()

### Aufgabe

Reserviert Geld für ein Sparziel.

---

### Input

```text
- goal_id
- amount
- note
```

---

### Ablauf

```text
- lädt Goal
- erstellt Goal Allocation
- speichert Allocation
```

---

### Output

```text
- gespeicherte Goal Allocation
```

---

## transfer_budget_remainder()

### Aufgabe

Überträgt Budgetreste auf ein Sparziel.

---

### Input

```text
- budget_id
- goal_id
- amount
```

---

### Ablauf

```text
- berechnet Budgetrest
- validiert Betrag
- erstellt Goal Allocation
```

---

### Output

```text
- Goal Allocation
```

---

## get_goal_allocations()

### Aufgabe

Lädt die Allocation-Historie eines Sparziels.

---

### Input

```text
- goal_id
```

---

### Ablauf

```text
- lädt Goal Allocations
- sortiert nach Datum
```

---

### Output

```text
- Liste aller Goal Allocations
```

---

# FixedCostService

Verantwortlich für:
- Verwaltung von Fixed Costs
- Aktivierung/Deaktivierung
- Änderungslogik

Keine Verantwortung für:
- Projektionen
- Transaction-Erstellung

---

## create_fixed_cost()

### Aufgabe

Erstellt einen neuen Fixed Cost.

---

### Input

```text
CreateFixedCostDTO
- name
- amount
- interval_unit
- interval_value
- next_due_date
- category_id
```

---

### Ablauf

```text
- validiert Daten
- prüft Intervalle
- erstellt Fixed Cost
- speichert Fixed Cost
```

---

### Output

```text
- gespeicherter Fixed Cost
```

---

## update_fixed_cost()

### Aufgabe

Aktualisiert einen bestehenden Fixed Cost.

---

### Input

```text
- fixed_cost_id
- UpdateFixedCostDTO
```

---

### Ablauf

```text
- lädt Fixed Cost
- aktualisiert Felder
- speichert Änderungen
```

---

### Output

```text
- aktualisierter Fixed Cost
```

---

## deactivate_fixed_cost()

### Aufgabe

Deaktiviert einen Fixed Cost ohne ihn zu löschen.

---

### Input

```text
- fixed_cost_id
```

---

### Ablauf

```text
- lädt Fixed Cost
- setzt is_active = false
- speichert Änderung
```

---

### Output

```text
- deaktivierter Fixed Cost
```

---

# FixedCostProjectionService

Verantwortlich für:
- Berechnung zukünftiger Fixed Cost Occurrences
- Monatsprognosen
- erwartete Belastungen

Projections werden dynamisch berechnet.

Nicht gespeichert.

---

## get_monthly_projection()

### Aufgabe

Berechnet alle erwarteten Fixed Costs für einen bestimmten Monat.

---

### Input

```text
- month
- year
```

---

### Ablauf

```text
- lädt aktive Fixed Costs
- berechnet Occurrences
- filtert auf Zielmonat
- erzeugt Projection-Liste
```

---

### Output

```text
- Liste erwarteter Fixed Cost Projections
```

---

## calculate_occurrences()

### Aufgabe

Berechnet zukünftige Occurrences eines einzelnen Fixed Costs.

---

### Input

```text
- fixed_cost_id
- Zeitraum
```

---

### Ablauf

```text
- lädt Fixed Cost
- berechnet Intervallfolgen
- erzeugt Occurrence-Daten
```

---

### Output

```text
- Liste zukünftiger Occurrences
```

---

# FixedCostExecutionService

Verantwortlich für:
- Erstellung echter Transactions aus Fixed Cost Projections

Keine automatische Ausführung.

Nur Benutzeraktionen.

---

## create_transactions_from_projection()

### Aufgabe

Erzeugt reale Transactions aus ausgewählten Projections.

---

### Input

```text
- Liste ausgewählter Projections
```

---

### Ablauf

```text
- validiert Projections
- prüft doppelte Transactions
- erstellt Transactions
- verknüpft fixed_cost_id
- speichert Transactions
```

---

### Output

```text
- Liste erzeugter Transactions
```

---

## validate_duplicate_transactions()

### Aufgabe

Prüft ob für eine Projection bereits eine Transaction existiert.

---

### Input

```text
- Projection
```

---

### Ablauf

```text
- sucht passende Transactions
- vergleicht Zeitraum und Fixed Cost
```

---

### Output

```text
- true/false
- optional existierende Transaction
```

---

# DashboardService

Verantwortlich für:
- zentrale Finanzübersicht
- Dashboardaggregation
- Zusammenführung mehrerer Services

---

## get_dashboard_summary()

### Aufgabe

Erzeugt alle Dashboarddaten für die Hauptansicht.

---

### Input

```text
- user_id
- optional month/year
```

---

### Ablauf

```text
- lädt Balance
- lädt Budgetdaten
- lädt Fixed Cost Daten
- berechnet freie Mittel
- aggregiert Ergebnisse
```

---

### Output

```text
- vollständige Dashboardübersicht
```

---

## calculate_free_to_use()

### Aufgabe

Berechnet den tatsächlich frei verfügbaren Geldbetrag.

---

### Input

```text
- aktuelle Balance
- reservierte Beträge
```

---

### Ablauf

```text
- summiert Reservierungen
- zieht Reservierungen von Balance ab
```

---

### Output

```text
- free_to_use Betrag
```

