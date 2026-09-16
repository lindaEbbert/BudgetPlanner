# 01: Backend-Testinfrastruktur einrichten

**What to build:** `pytest` funktioniert gegen das Backend, mit einer
Fixture-Strategie für eine isolierte Test-Datenbank und einen
JWT-authentifizierten Flask-Test-Client. Kein für Nutzer sichtbares
Verhalten — dies ist die Grundlage, damit die folgenden Backend-Tickets
test-first (TDD) entwickelt werden können.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] `pytest` ist als Dev-Dependency eingerichtet und über ein
      dokumentiertes Kommando ausführbar
- [x] Tests laufen gegen eine isolierte Test-Datenbank (kein Zugriff auf die
      echte Entwicklungs-DB), die zwischen Testläufen zurückgesetzt wird
- [x] Es existiert eine wiederverwendbare Fixture, die einen Testnutzer
      anlegt und einen gültigen JWT liefert
- [x] Ein triviales Beispieltest (z. B. gegen einen bestehenden Service)
      läuft grün und demonstriert den Aufbau

## Comments

- 2026-09-16: Umgesetzt. `pytest` über `backend/requirements-dev.txt`,
  Aufruf `pytest` in `backend/` (siehe README "Automated Tests"). Tests
  laufen gegen die Postgres-DB `<DB_NAME>_test` (wird automatisch angelegt,
  Schema pro Lauf neu, Tabellen nach jedem Test geleert). Fixtures `app`,
  `client`, `user`, `access_token`, `auth_headers` in
  `backend/tests/conftest.py`. `main.py` hat dafür eine App-Factory
  `create_app()` bekommen; das modulweite `app` bleibt erhalten.
