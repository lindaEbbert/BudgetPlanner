# Budgeting App – Daily Execution Plan bis zum Interview

# Rahmenbedingungen

## Interview

Freitag, 08:00 Uhr

---

## Verfügbare Zeit

- Heute: ca. 8 Stunden
- Dienstag: ca. 8 Stunden
- Mittwoch: ca. 8 Stunden
- Donnerstag: Puffer / Vorbereitung

---

# Gesamtstrategie

Priorität:

1. Angular + TypeScript demonstrieren
2. Datenbankdesign demonstrieren
3. saubere Architektur demonstrieren
4. funktionierende vertikale Flows zeigen
5. Fixed-Cost-Planung als Kernfeature zeigen

Nicht priorisieren:
- perfekte UI
- Animationen
- komplexe Charts
- Mobile Optimierung
- vollständige Testabdeckung

---

# MONTAG – Architektur konsolidieren & Angular Fundament

# Ziel des Tages

Das Ziel heute ist:
- das Projekt technisch zu stabilisieren
- die Angular-Struktur sauber aufzubauen
- das Backend architektonisch vorzubereiten
- den zukünftigen Entwicklungsfluss massiv zu beschleunigen

Am Ende des Tages solltest du:
- eine stabile Projektstruktur besitzen
- Angular sauber organisiert haben
- eine funktionierende API-Anbindung besitzen
- ein solides Fundament für die eigentlichen Features haben

Heute geht es weniger um fertige Features.
Heute geht es darum:

```text
"die richtige Grundlage zu schaffen"
```

---

# Backend Aufgaben

## Projektstruktur aufräumen

### Ziel

Saubere Architektur vorbereiten.

---

### Abhakliste

- controller Struktur prüfen
- services Struktur erweitern
- repositories Ordner anlegen
- dto/schema Struktur vorbereiten
- config Struktur verbessern
- zentrale Error-Handler vorbereiten

---

## Datenbankmodell konsolidieren

### Ziel

Das relationale Modell stabil machen bevor Features darauf aufbauen.

---

### Abhakliste

- Transaction Model erstellen
- UUID überall prüfen
- NUMERIC(12,2) prüfen
- ENUM für interval_unit sauber definieren
- CHECK interval_value > 0 vorbereiten
- UNIQUE Constraints ergänzen
- created_at / updated_at ergänzen
- deleted_at ergänzen
- is_voided ergänzen
- Foreign Keys prüfen

---

## Alembic Migrationen

### Ziel

Sauberen Migrationsworkflow etablieren.

---

### Abhakliste

- neue Migration erzeugen
- Datenbank sauber migrieren
- Migration testen
- DB neu aufsetzen testen

---

## Repository Layer vorbereiten

### Ziel

Datenbankzugriffe sauber trennen.

---

### Abhakliste

- Base Repository Struktur
- UserRepository
- CategoryRepository
- FixedCostRepository
- TransactionRepository

Noch keine perfekte Abstraktion nötig.

---

# Angular Aufgaben

# WICHTIGSTER TEIL DES TAGES

Da Angular/TypeScript im Interview besonders relevant ist, sollte heute sehr viel Zeit ins Frontend fließen.

---

## Angular Struktur aufbauen

### Ziel

Ein modernes, sauberes Angular-Projekt demonstrieren.

---

### Abhakliste

- feature-basierte Struktur
- core module
- shared module
- api service
- environment configs
- typed models/interfaces
- routing strukturieren
- layout shell
- navigation/sidebar

---

## Auth Fundament

### Ziel

Basis für geschützte Features schaffen.

---

### Abhakliste

- Login Page
- AuthService
- JWT Speicherung
- Route Guard
- HTTP Interceptor
- Logout vorbereiten

---

## API Kommunikation

### Ziel

Saubere Angular-Service-Kommunikation.

---

### Abhakliste

- HttpClient Services
- typed responses
- Fehlerhandling
- loading states vorbereiten
- base api service

---

# Montag Abend – Meilenstein

Du solltest demonstrieren können:

```text
- Angular Projekt ist sauber strukturiert
- Flask + PostgreSQL laufen stabil
- Migrationen funktionieren
- Login funktioniert
- JWT funktioniert
- Angular kann APIs ansprechen
- typed services funktionieren
```

Wenn das steht, wird der Rest der Woche deutlich einfacher.

---

# DIENSTAG – Transactions Vertical Slice

# Ziel des Tages

Heute entsteht der erste vollständige Businessflow.

Das Ziel ist:

```text
Datenbank
→ Backend
→ API
→ Angular
→ UI
```

vollständig funktionierend zu haben.

Am Ende des Tages soll die App:
- Einnahmen erfassen können
- Ausgaben erfassen können
- Daten korrekt speichern
- Balance berechnen
- echte Finanzdaten anzeigen

Heute beginnt die App:

```text
"wie eine echte Anwendung zu wirken"
```

---

# Backend Aufgaben

## Categories CRUD

### Abhakliste

- Category DTOs
- Category Repository
- Category Service
- CRUD Endpoints
- Validation
- UNIQUE(user_id, name)
- Soft Delete

---

## Transactions Feature

### Ziel

Komplette Transactionlogik implementieren.

---

### Abhakliste

- Transaction DTOs
- Transaction Repository
- Transaction Service
- CRUD Endpoints
- Validation
- is_voided support
- filtering
- sorting
- pagination optional
- balance calculation

---

## Balance Logic

### Ziel

Erste wichtige Aggregationslogik implementieren.

---

### Abhakliste

- income summieren
- expenses summieren
- voided ignorieren
- current balance berechnen

---

# Angular Aufgaben

## Category UI

### Abhakliste

- Kategorienliste
- Kategorieformular
- Kategorie erstellen
- Kategorie bearbeiten

---

## Transaction UI

### Ziel

Saubere Angular CRUD-Flows.

---

### Abhakliste

- Transaction Table
- Create Form
- Edit Form
- Delete/Void Action
- Category Select
- Type Select
- Filter
- Validation
- loading states

---

## Angular Architektur Fokus

### Besonders wichtig

Heute bewusst sauber arbeiten bei:

- Services
- typed interfaces
- component separation
- reactive forms
- reusable ui components

Das wird interviewrelevant.

---

# Dienstag Abend – Meilenstein

Du solltest demonstrieren können:

```text
- Kategorien anlegen
- Einnahmen erfassen
- Ausgaben erfassen
- Datenbank speichert korrekt
- Angular lädt Daten korrekt
- Balance wird berechnet
- Transactions werden angezeigt
- APIs funktionieren sauber
```

Das ist dein erster echter vertikaler End-to-End-Flow.

---

# MITTWOCH – Dashboard, Budgets & Aggregationen

# Ziel des Tages

Die Anwendung soll jetzt:

```text
"wie eine echte Finanzanwendung wirken"
```

Heute liegt der Fokus besonders auf:
- Datenbankabfragen
- Aggregationen
- Businesslogik
- Dashboarddaten
- Budgetlogik

Das ist sehr interviewrelevant.

---

# Backend Aufgaben

## DashboardService

### Ziel

Mehrere Datenquellen aggregieren.

---

### Abhakliste

- current balance
- monthly income
- monthly expenses
- recent transactions
- budget summary
- free_to_use vorbereiten

---

## Budget System

### Ziel

Erste komplexere Businesslogik.

---

### Abhakliste

- Budget Tabelle
- UNIQUE Constraint
- Budget DTOs
- Budget Repository
- Budget Service
- Budget CRUD
- Budget Usage Calculation
- spent berechnen
- remaining berechnen
- percentage berechnen

---

## SQL / DB Fokus

Heute besonders sauber arbeiten bei:

- JOINs
- Aggregationen
- GROUP BY
- Constraints
- berechneten Zuständen

Das solltest du im Interview erklären können.

---

# Angular Aufgaben

## Dashboard UI

### Ziel

Sauberes Dashboard mit echten Aggregationen.

---

### Abhakliste

- balance card
- income card
- expense card
- recent transactions
- budget overview

---

## Budget UI

### Abhakliste

- Budget erstellen
- Budget bearbeiten
- Budget Übersicht
- Progress Bars
- Restbetrag anzeigen
- Prozentanzeige

---

## Angular Fokus

Heute besonders achten auf:

- State Management
- Component-Aufteilung
- API-Orchestrierung
- typed responses
- wiederverwendbare Komponenten

---

# Mittwoch Abend – Meilenstein

Du solltest demonstrieren können:

```text
- Dashboard aggregiert Daten korrekt
- Budgets funktionieren
- Budgetverbrauch wird berechnet
- Restbeträge werden korrekt angezeigt
- Angular zeigt aggregierte Daten sauber
- Architektur wirkt modular und nachvollziehbar
```

Ab diesem Punkt ist das Projekt bereits sehr interviewfähig.

---

# DONNERSTAG – Fixed Costs & Interview Vorbereitung

# Ziel des Tages

Das Alleinstellungsmerkmal der App fertigstellen:

```text
Fixed Cost Planning & Projection System
```

Das ist der fachlich stärkste Teil deiner App.

Heute geht es:
- weniger um neue Features
- mehr um Qualität
- mehr um Erklärbarkeit
- mehr um Präsentation

---

# Backend Aufgaben

## FixedCostProjectionService

### Ziel

Zukünftige Finanzereignisse berechnen.

---

### Abhakliste

- occurrence calculation
- monthly projections
- interval logic
- projection filtering
- reserve calculations optional
- duplicate validation vorbereiten

---

## Projection API

### Abhakliste

- GET /fixed-costs/projections
- month/year filtering
- projection DTOs
- typed responses

---

## Optional wenn Zeit

### Transaction Generation

```text
Projection → Transaction
```

Nur wenn stabil.

---

# Angular Aufgaben

## Projection View

### Ziel

Das Kernfeature verständlich visualisieren.

---

### Abhakliste

- Monatsauswahl
- Projection Tabelle
- Due Dates
- erwartete Kosten
- Fixed Cost Details
- optional Selection UI

---

## Dashboard Erweiterung

### Optional

- expected fixed costs
- reserved amount
- free_to_use

Nur wenn stabil.

---

# Interview Vorbereitung

## README finalisieren

### Muss enthalten

- Projektziel
- Architektur
- Service Layer
- Repository Layer
- PostgreSQL Entscheidungen
- berechnete Zustände
- Projection System
- Setup Anleitung

---

## Demo vorbereiten

### Sehr wichtig

Seed Daten vorbereiten:

- mehrere Kategorien
- Einnahmen
- Ausgaben
- Budgets
- Fixed Costs
- mehrere Monate

---

## Demo Ablauf vorbereiten

### Beispiel

```text
1. Login
2. Kategorien zeigen
3. Einnahmen/Ausgaben erfassen
4. Dashboard erklären
5. Budgetberechnung zeigen
6. Fixed Cost Projektionen zeigen
7. Architektur erklären
```

---

# Donnerstag Abend – Zielzustand

Du solltest:

```text
- vollständige vertikale Flows besitzen
- Angular Architektur erklären können
- PostgreSQL Modell erklären können
- Budgetberechnung erklären können
- Projection System erklären können
- Repository Layer erklären können
- Service Layer erklären können
```

Dann bist du sehr gut vorbereitet für Freitag.

