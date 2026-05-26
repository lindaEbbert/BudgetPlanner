# Todos Montag 25.5.26

Favorite: No
Archived: No
Created: May 25, 2026 4:32 PM
Updated: May 25, 2026 8:58 PM

# Heute — Kleinschrittige Todo-Liste (Montag)

# Tagesziel

Heute sollst du:

- die Architektur stabilisieren
- Angular professionell strukturieren
- das Backend vorbereiten
- die Datenbank sauber machen
- die Grundlage für die restliche Woche schaffen

Heute ist:

> Fundament-Tag.
> 

Wenn du heute sauber arbeitest, sparst du dir morgen und Mittwoch sehr viel Chaos.

---

# Priorität heute

1. Angular Struktur
2. API-Kommunikation
3. Datenbankmodell konsolidieren
4. Repository Layer
5. Auth Flow stabilisieren

---

# Geschätzte Tagesstruktur

| Block | Thema | Dauer |
| --- | --- | --- |
| 1 | DB + Backend Cleanup | 2h |
| 2 | Angular Architektur | 2.5h |
| 3 | Auth + API Kommunikation | 2h |
| 4 | Repository Layer + Cleanup | 1h |
| 5 | Testing + Git Cleanup | 0.5h |

---

# BLOCK 1 — Datenbank & Backend konsolidieren

⏱️ ca. 2 Stunden

# Ziel

Das Datenmodell final stabilisieren bevor Features darauf aufbauen.

---

# Schritt 1 — Alle aktuellen Models prüfen

## TODO

Prüfe jede Tabelle:

- [x]  User
- [x]  Category
- [x]  Transaction
- [x]  Budget
- [x]  FixedCost

---

# Schritt 2 — UUIDs prüfen

## TODO

Für jedes Model prüfen:

- [x]  `id` ist UUID
- [x]  `default=uuid.uuid4`
- [x]  überall konsistent

---

# Schritt 3 — Monetary Fields prüfen

## TODO

Prüfen:

- [x]  alle Geldfelder = `NUMERIC(12,2)`
- [x]  kein FLOAT irgendwo

Besonders:

- [x]  transaction.amount
- [x]  budget.limit_amount
- [x]  fixed_cost.amount

---

# Schritt 4 — Timestamp Felder ergänzen

## TODO

Für relevante Tabellen ergänzen:

- [x]  `created_at`
- [x]  `updated_at`

Für Soft Delete:

- [x]  `deleted_at`

---

# Schritt 5 — Transaction erweitern

## TODO

Transaction Model prüfen:

- [x]  `is_voided`
- [x]  `transaction_date`
- [x]  `type`
- [x]  `fixed_cost_id nullable`

---

# Schritt 6 — ENUM für interval_unit

## TODO

PostgreSQL ENUM definieren:

- [x]  `week`
- [x]  `day`
- [x]  `month`
- [x]  `year`

Dann:

- [x]  Model aktualisieren
- [x]  Migration vorbereiten

---

# Schritt 7 — CHECK Constraint

## TODO

Für `interval_value`:

- [x]  `interval_value > 0`

---

# Schritt 8 — UNIQUE Constraints

## TODO

Prüfen/ergänzen:

- [x]  `categories(user_id, name)`
- [x]  `budgets(user_id, category_id, month, year)`
- [ ]  `savings_goals(user_id, name)` (optional später)

---

# Schritt 9 — Foreign Keys prüfen

## TODO

Sicherstellen:

- [ ]  alle Beziehungen existieren
- [ ]  nullable korrekt
- [ ]  on delete Verhalten prüfen

---

# Schritt 10 — Alembic Migration

## TODO

- [ ]  neue Migration erzeugen
- [ ]  Migration lesen
- [ ]  DB migrieren
- [ ]  testen
- [ ]  DB neu aufsetzen testen

---

# BLOCK 2 — Angular Architektur

⏱️ ca. 2.5 Stunden

# Ziel

Ein professionell strukturiertes Angular-Projekt aufbauen.

Das ist heute vermutlich der wichtigste Teil.

---

# Schritt 1 — Ordnerstruktur bereinigen

## TODO

Anlegen/prüfen:

- [ ]  `core/`
- [ ]  `shared/`
- [ ]  `features/`

---

# Schritt 2 — Feature-Struktur anlegen

## TODO

Unter `features/`:

- [ ]  `auth/`
- [ ]  `transactions/`
- [ ]  `categories/`
- [ ]  `dashboard/`
- [ ]  `budgets/`
- [ ]  `fixed-costs/`

Nur Grundstruktur.

---

# Schritt 3 — Core Struktur

## TODO

Unter `core/`:

- [ ]  `services/`
- [ ]  `interceptors/`
- [ ]  `guards/`
- [ ]  `layout/`

---

# Schritt 4 — Shared Struktur

## TODO

Unter `shared/`:

- [ ]  `models/`
- [ ]  `components/`
- [ ]  `ui/`
- [ ]  `types/`

---

# Schritt 5 — Typed Models erstellen

## TODO

Erstelle Interfaces:

- [ ]  User
- [ ]  Category
- [ ]  Transaction
- [ ]  Budget
- [ ]  FixedCost

---

# Schritt 6 — API Service Basis

## TODO

Erstellen:

- [ ]  BaseApiService
- [ ]  environment.ts
- [ ]  api base url

---

# Schritt 7 — Angular Material Layout

## TODO

Erstellen:

- [ ]  Toolbar
- [ ]  Sidebar
- [ ]  Router Outlet Layout

Noch nicht hübsch machen.

---

# Schritt 8 — Routing Struktur

## TODO

- [ ]  Feature Routes
- [ ]  Lazy Loading vorbereiten
- [ ]  Auth Guard vorbereiten

---

# BLOCK 3 — Auth + API Kommunikation

⏱️ ca. 2 Stunden

# Ziel

Frontend und Backend sauber verbinden.

---

# Schritt 1 — Login Endpoint testen

## TODO

Mit Postman/Insomnia:

- [ ]  Register testen
- [ ]  Login testen
- [ ]  JWT prüfen

---

# Schritt 2 — Angular AuthService

## TODO

Implementieren:

- [ ]  login()
- [ ]  logout()
- [ ]  token speichern
- [ ]  token laden

---

# Schritt 3 — HTTP Interceptor

## TODO

- [ ]  JWT automatisch anhängen
- [ ]  Fehler abfangen

---

# Schritt 4 — Auth Guard

## TODO

- [ ]  geschützte Routen blockieren
- [ ]  redirect auf login

---

# Schritt 5 — Login UI

## TODO

Erstellen:

- [ ]  Reactive Form
- [ ]  Validation
- [ ]  Error Anzeige
- [ ]  Loading State

---

# Schritt 6 — API Fehlerhandling

## TODO

- [ ]  zentrale Fehlerbehandlung
- [ ]  console logs
- [ ]  toast/snackbar optional

---

# BLOCK 4 — Repository Layer vorbereiten

⏱️ ca. 1 Stunde

# Ziel

Saubere DB-Zugriffe vorbereiten.

---

# Schritt 1 — repositories/ Ordner

## TODO

- [ ]  Struktur anlegen

---

# Schritt 2 — BaseRepository

## TODO

Nur simpel:

- [ ]  get_by_id
- [ ]  create
- [ ]  update
- [ ]  soft_delete

---

# Schritt 3 — Erste Repositories

## TODO

- [ ]  UserRepository
- [ ]  TransactionRepository
- [ ]  CategoryRepository

Noch minimal halten.

---

# BLOCK 5 — Cleanup & Tagesabschluss

⏱️ ca. 30 Minuten

# Ziel

Den Tag sauber abschließen.

---

# Schritt 1 — App komplett testen

## TODO

- [ ]  Backend startet
- [ ]  Angular startet
- [ ]  DB verbindet
- [ ]  Login funktioniert

---

# Schritt 2 — Git Cleanup

## TODO

- [ ]  sinnvolle Commits
- [ ]  keine kaputten Dateien
- [ ]  .env prüfen
- [ ]  .gitignore prüfen

---

# Schritt 3 — Notizen machen

## TODO

Kurz dokumentieren:

- [ ]  offene Probleme
- [ ]  TODOs morgen
- [ ]  Architekturentscheidungen

---

# Ziel heute Abend

Du solltest heute Abend:

```
- eine stabile Architektur besitzen
- Angular sauber strukturiert haben
- PostgreSQL sauber modelliert haben
- Auth stabil haben
- API Kommunikation stabil haben
- Repository Layer vorbereitet haben
```

Dann bist du perfekt vorbereitet für morgen:

> den ersten echten Businessflow.
>