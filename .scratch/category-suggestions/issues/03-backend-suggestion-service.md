# 03: Kategorie-Vorschlag – Backend-Service & Endpoint

**What to build:** Ein neuer Service ermittelt für gegebene Transaktionsdaten
(Name, Beschreibung, Typ) und die existierenden Categories eines Nutzers per
LLM-Aufruf (`glm-4.7-flash` über [chat.z.ai](https://chat.z.ai/), via
`ai-sdk-python`) entweder eine passende bestehende
Category, einen Vorschlag für eine neue Category, oder kein Ergebnis. Ein
neuer JWT-geschützter Endpoint macht das für das Frontend nutzbar; per
`test.http` direkt verifizierbar, unabhängig vom Frontend.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Neuer Endpoint nimmt `name`/`description`/`type` entgegen und liefert
      entweder eine existierende `category_id`, einen vorgeschlagenen
      `new_category_name`, oder ein leeres Ergebnis
- [ ] Es werden nur `name`, `description`, `type` der Transaktion sowie die
      Namen der existierenden Categories des Nutzers an das Modell
      übergeben (kein `amount`)
- [ ] Test mit gemocktem LLM-Aufruf: Übereinstimmung mit bestehender
      Category liefert deren `category_id`
- [ ] Test mit gemocktem LLM-Aufruf: keine passende Category liefert
      `new_category_name`
- [ ] Test: Nutzer ganz ohne Categories funktioniert weiterhin ohne Fehler
- [ ] Test: Wirft der LLM-Aufruf einen Fehler/Timeout, liefert der Service
      ein klar erkennbares "kein Ergebnis" statt die Exception
      durchzureichen
- [ ] `Z_AI_API_KEY` wird über eine Umgebungsvariable konfiguriert;
      `requirements.txt` und `backend/README.md` sind aktualisiert
- [ ] Endpoint ist wie bestehende Endpoints JWT-geschützt

## Comments

- 2026-09-16: Provider auf `glm-4.7-flash` (chat.z.ai) statt OpenAI
  festgelegt, siehe [ADR 0011](../../../docs/adr/0011-category-suggestions-via-external-llm.md).
