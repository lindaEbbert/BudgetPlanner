# Budgeting App – Phase 3 Architecture & Data Modeling

## Ziel von Phase 3

In Phase 3 wurde die technische Architektur der Anwendung definiert.

Fokus:
- Datenmodell
- Tabellenstruktur
- Architekturprinzipien
- REST-API-Konzept
- Backend-Struktur
- fachliche Datenrepräsentation

---

# 1. Architekturprinzipien

Während der Modellierung wurden mehrere zentrale Architekturprinzipien festgelegt.

---

## Rohdaten speichern, Zustände berechnen

Die Anwendung speichert primär:
- Fakten
- Ereignisse
- Rohdaten

Und berechnet daraus:
- Kontostände
- Budgetstände
- Ziel-Fortschritte
- Rücklagenstatus
- freie verfügbare Mittel

---

## Nicht speichern

Folgende Werte sollen bewusst nicht persistiert werden:

```text
remaining_budget
account_balance
goal_progress
allocated_total
fixed_cost_status
```

Diese Werte werden dynamisch berechnet.

---

## Vorteile

Dieser Ansatz reduziert:
- Inkonsistenzen
- Synchronisationsprobleme
- redundante Datenhaltung

Außerdem verbessert er:
- Nachvollziehbarkeit
- Wartbarkeit
- Datenkonsistenz

---

# 2. ENUM-Konzept

## Erklärung

ENUMs definieren feste erlaubte Werte für ein Datenfeld.

Beispiel:

```text
income
expense
initial_balance
```

---

## Vorteile

ENUMs bieten:
- bessere Validierung
- konsistente Daten
- weniger Tippfehler
- klarere Geschäftslogik

---

# 3. Flexible Wiederholungslogik für Fixed Costs

## Entscheidung

Für Fixed Costs wird bewusst KEIN ENUM-basiertes Frequenzsystem verwendet.

Stattdessen soll ein flexibles Intervallmodell verwendet werden.

---

## Ziel

Unterstützung von Intervallen wie:

```text
alle 2 Wochen
alle 4 Monate
alle 12 Monate
alle 10 Tage
```

---

## Vorgeschlagenes Modell

### interval_unit

Mögliche Werte:

```text
day
week
month
year
```

---

### interval_value

Integer-Wert.

Beispiele:

```text
2
4
12
```

---

## Beispiel

```text
interval_unit = month
interval_value = 4
```

Bedeutung:

```text
alle 4 Monate
```

---

## Vorteil

Dieses Modell ist:
- deutlich flexibler
- einfacher erweiterbar
- realistischer für Finanzplanung

---

# 4. Transaction-Modellierung

## Entscheidung

Transactions speichern:
- positive Beträge
- getrenntes Type-Feld

---

## Beispiel

```text
amount = 3000
type = income
```

```text
amount = 40
type = expense
```

---

## Warum?

Dies verbessert:
- Lesbarkeit
- Validierung
- Datenkonsistenz

Und reduziert Fehler durch doppelte Negationen.

---

# 5. Allocations

## Fachliche Bedeutung

Allocations repräsentieren:
- logische Geldreservierungen
- keine echten Banktransaktionen

Das Geld verlässt dabei das reale Konto nicht.

---

## Beispiel

```text
Kontostand: 4000€

500€ werden für Urlaub reserviert
```

Der Kontostand bleibt unverändert.

Die Allocation dokumentiert lediglich:

```text
500€ → Savings Goal Urlaub
```

---

# 6. Unterschied zwischen Transactions und Allocations

## Transactions

Reale Geldbewegungen.

Beispiele:

```text
Gehalt
Einkauf
Miete
```

---

## Allocations

Logische Geldzuweisungen.

Beispiele:

```text
Budgetrest → Urlaub
Geld reservieren → Notgroschen
```

---

## Vorteil der Trennung

Diese Trennung verbessert:
- Nachvollziehbarkeit
- Historisierung
- fachliche Korrektheit
- Erweiterbarkeit

---

# 7. Allocation-Historie

Durch Allocations entsteht ein nachvollziehbares Reservierungssystem.

Beispiel:

```text
01.05 → +300€ Urlaub
15.05 → +50€ Urlaub
31.05 → +80€ Budgetrest → Urlaub
```

Der aktuelle Zielbetrag wird daraus berechnet.

---

# 8. Bezug zu Event-Driven / Event-Sourcing

Die Architektur orientiert sich teilweise an:
- event-driven Denken
- Ledger-Systemen
- Event-Sourcing-Prinzipien

Allerdings wird kein vollständiges Event-Sourcing implementiert.

---

## Tatsächlicher Ansatz

Die Anwendung speichert:
- Zustandsänderungen
- Rohdaten

Und berechnet daraus:
- aggregierte Zustände
- Summen
- Fortschritte
- Statuswerte

Dieser Ansatz wurde als passend für das MVP bewertet.

---

# 9. Entity Relationship Diagram (ERD)

## Erklärung

Ein ERD (Entity Relationship Diagram) beschreibt:
- welche Tabellen existieren
- wie sie verbunden sind
- welche Beziehungen bestehen

---

## Beispiel

```text
Category
   |
   | 1:n
   |
Transactions
```

Bedeutung:

```text
Eine Kategorie
kann viele Transactions besitzen.
```

---

# 10. Beziehungstypen

## 1:1

Beispiel:

```text
Ein User besitzt genau ein Profil.
```

---

## 1:n

Beispiel:

```text
Eine Kategorie besitzt viele Transactions.
```

Dieser Beziehungstyp wird im MVP am häufigsten verwendet.

---

## n:m

Beispiel:

```text
Viele Posts besitzen viele Tags.
```

Hierfür werden Zwischentabellen benötigt.

Dieser Typ wird im MVP zunächst nicht benötigt.

---

# 11. Vorläufige Tabellenstruktur

Aktuell geplante Tabellen:

```text
users
categories
transactions
budgets
savings_goals
fixed_costs
allocations
```

---

# 12. Vorläufige Entity-Struktur

## users

```text
id
email
password_hash
created_at
```

---

## categories

```text
id
user_id
name
type
color
created_at
```

---

## transactions

```text
id
user_id
category_id
amount
type
transaction_date
description
created_at
```

---

## budgets

```text
id
user_id
category_id
month
year
limit_amount
created_at
```

---

## savings_goals

```text
id
user_id
name
target_amount
description
created_at
```

Der aktuelle reservierte Betrag wird aus Allocations berechnet.

---

## fixed_costs

```text
id
user_id
category_id
name
amount
interval_unit
interval_value
next_due_date
is_active
created_at
```

---

## allocations

```text
id
user_id
target_type
target_id
amount
allocation_date
note
created_at
```

---

# 13. Wichtige Architekturentscheidungen

## Business-Logik im Backend

Berechnungen gehören in das Backend.

Dazu gehören:
- Budgetberechnung
- Rücklagenlogik
- Dashboard-Aggregationen
- Goal-Fortschritte
- freie Mittel

Das Frontend dient primär:
- der Darstellung
- der Benutzerinteraktion
- Formularlogik

---

## Service-Layer

Die Business-Logik soll in dedizierten Services liegen.

Beispiele:

```text
BudgetService
FixedCostService
AllocationService
DashboardService
```

Nicht:
- direkt in Flask Routes
- nicht im Angular Frontend

---

# 14. Vorläufige REST-API-Struktur

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

## Allocations

```http
POST /api/allocations
GET  /api/allocations
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

Diese Route liefert aggregierte Dashboard-Daten.

---

# 15. Angular Architektur

Empfohlene Feature-Struktur:

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

# 16. State Management

Für das MVP wurde entschieden:
- kein NgRx
- stattdessen Angular Signals + RxJS

Begründung:
- geringere Komplexität
- schnelleres MVP
- ausreichend für Projektgröße

