# 11: User wählt, wohin die Daten für die Category Suggestion gehen

**What to build:** Jeder User entscheidet selbst, ob seine Transaktionstexte
für die Category Suggestion auf dem Server der App bleiben (Modell über LM
Studio) oder an einen externen Anbieter gehen. Das ist in der Sache eine
Datenschutz-Einwilligung und schließt an Spec-Story 18 an: „lokal“ heißt hier
*auf dem Server, auf dem die App läuft*, nicht auf dem Rechner des Users.

**Blocked by:** 08

**Status:** ready-for-human

- [ ] Begriff für die Wahl im Glossar (`CONTEXT.md`) geklärt — „lokal“
      vermeiden, weil es für den User irreführend ist
- [ ] Zwei Konfigurationen in der `.env` (z. B. `LLM_LOCAL_*` und
      `LLM_EXTERNAL_*`), jeweils Base-URL, Modell, Key, Timeout; ersetzt die
      eine `LLM_*`-Konfiguration aus [08](08-llm-endpoint-konfigurierbar.md)
- [ ] Standard für User ohne eigene Wahl festgelegt
- [ ] Einstellung pro User in der Datenbank (Alembic-Migration)
- [ ] Endpoint zum Lesen und Ändern der Einstellung, in der OpenAPI
      beschrieben
- [ ] Einstellung im Frontend änderbar
- [ ] Der Suggestion-Service nimmt die Konfiguration des jeweiligen Users
- [ ] Ist nur eine der beiden Konfigurationen gesetzt, ist entschieden, was
      der User sieht (Option ausgegraut, oder Fallback)
- [ ] Tests in jeder berührten Schicht

## Comments

- 2026-09-23: Beim Grilling zu Ticket 08 entstanden. Bewusst aus Ticket 08
  herausgehalten, damit es klein genug für eine Umsetzung bis 30.09. bleibt.
  Geschätzt ein bis zwei Tage Full-Stack-Arbeit.
