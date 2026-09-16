# 03: Kategorie-Vorschlag – Backend-Service & Endpoint

**What to build:** Ein neuer Service ermittelt für gegebene Transaktionsdaten
(Name, Beschreibung, Typ) und die existierenden Categories eines Nutzers per
LLM-Aufruf (`glm-4.7-flash` über [chat.z.ai](https://chat.z.ai/), via
`ai-sdk-python`) entweder eine passende bestehende
Category, einen Vorschlag für eine neue Category, oder kein Ergebnis. Ein
neuer JWT-geschützter Endpoint macht das für das Frontend nutzbar; per
`test.http` direkt verifizierbar, unabhängig vom Frontend.

**Blocked by:** 01

**Status:** done

- [x] Neuer Endpoint nimmt `name`/`description`/`type` entgegen und liefert
      entweder eine existierende `category_id`, einen vorgeschlagenen
      `new_category_name`, oder ein leeres Ergebnis
- [x] Es werden nur `name`, `description`, `type` der Transaktion sowie die
      Namen der existierenden Categories des Nutzers an das Modell
      übergeben (kein `amount`)
- [x] Test mit gemocktem LLM-Aufruf: Übereinstimmung mit bestehender
      Category liefert deren `category_id`
- [x] Test mit gemocktem LLM-Aufruf: keine passende Category liefert
      `new_category_name`
- [x] Test: Nutzer ganz ohne Categories funktioniert weiterhin ohne Fehler
- [x] Test: Wirft der LLM-Aufruf einen Fehler/Timeout, liefert der Service
      ein klar erkennbares "kein Ergebnis" statt die Exception
      durchzureichen
- [x] `Z_AI_API_KEY` wird über eine Umgebungsvariable konfiguriert;
      `requirements.txt` und `backend/README.md` sind aktualisiert
- [x] Endpoint ist wie bestehende Endpoints JWT-geschützt

## Comments

- 2026-09-16: Provider auf `glm-4.7-flash` (chat.z.ai) statt OpenAI
  festgelegt, siehe [ADR 0011](../../../docs/adr/0011-category-suggestions-via-external-llm.md).
- 2026-09-16: Umgesetzt. Service `category_suggestion_service.suggest_category`
  liefert `CategorySuggestion(category_id | new_category_name)` bzw.
  `NO_SUGGESTION` (auch bei Fehler, Timeout oder fehlendem `Z_AI_API_KEY`).
  Endpoint `POST /transactions/category-suggestion` antwortet gemäß
  README-Konvention in camelCase: `{ categoryId, newCategoryName }`.
  Abweichung vom Spec: Da nur Kategorienamen ans Modell gehen, antwortet das
  Modell mit Namen (`existing_category_name`/`new_category_name`); der Service
  löst sie case-insensitiv auf die ID auf, damit keine Beinahe-Duplikate
  entstehen. z.ai-Anbindung: `ai_sdk.openai()` kennt keine `base_url`, daher
  wird der OpenAI-Client des Modells ersetzt (Timeout 10 s, keine Retries,
  Thinking aus); `ai-sdk-python` ist auf 0.1.1 gepinnt. Noch nicht gegen die
  echte z.ai-API geprüft (kein Key vorhanden) → per `test.http` verifizieren.
