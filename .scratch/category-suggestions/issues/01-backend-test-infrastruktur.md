# 01: Backend-Testinfrastruktur einrichten

**What to build:** `pytest` funktioniert gegen das Backend, mit einer
Fixture-Strategie für eine isolierte Test-Datenbank und einen
JWT-authentifizierten Flask-Test-Client. Kein für Nutzer sichtbares
Verhalten — dies ist die Grundlage, damit die folgenden Backend-Tickets
test-first (TDD) entwickelt werden können.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] `pytest` ist als Dev-Dependency eingerichtet und über ein
      dokumentiertes Kommando ausführbar
- [ ] Tests laufen gegen eine isolierte Test-Datenbank (kein Zugriff auf die
      echte Entwicklungs-DB), die zwischen Testläufen zurückgesetzt wird
- [ ] Es existiert eine wiederverwendbare Fixture, die einen Testnutzer
      anlegt und einen gültigen JWT liefert
- [ ] Ein triviales Beispieltest (z. B. gegen einen bestehenden Service)
      läuft grün und demonstriert den Aufbau
