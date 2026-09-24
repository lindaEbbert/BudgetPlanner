# 08: LLM-Endpoint für die Category Suggestion über `.env` konfigurierbar

**What to build:** Die Category Suggestion ist heute fest auf `glm-4.7-flash`
bei z.ai verdrahtet (`Z_AI_*`-Konstanten in `category_suggestion_service.py`).
Base-URL, Modell, Key und Timeout sollen aus der `.env` kommen, damit jeder
OpenAI-kompatible Endpoint — lokal über LM Studio oder ein externer Anbieter —
ohne Code-Änderung eingesetzt werden kann. Standard ist LM Studio. Zum
Abschluss läuft die Suggestion live gegen ein Modell in LM Studio.

Welcher Anbieter und welches Modell dauerhaft gewählt werden, entscheidet
[Ticket 12](12-llm-anbieter-auswaehlen.md) — nicht dieses Ticket.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

## Konfiguration

| Variable | Pflicht | Verhalten |
|---|---|---|
| `LLM_BASE_URL` | ja | Fehlt sie: Warnung im Log, kein Vorschlag, kein Modellaufruf |
| `LLM_MODEL` | ja | wie `LLM_BASE_URL` |
| `LLM_API_KEY` | nein | Fehlt er, wird ein Platzhalter geschickt (LM Studio braucht keinen Key, der OpenAI-Client aber einen nicht-leeren Wert) |
| `LLM_TIMEOUT_SECONDS` | nein | Standard 10 |

`Z_AI_API_KEY` und die `Z_AI_*`-Konstanten fallen weg. Es gibt keine
Standardwerte für URL und Modell im Code: Ohne Konfiguration geht nie eine
Anfrage an einen unbeabsichtigten Endpoint, auch nicht über `OPENAI_API_KEY`
an OpenAI.

## Acceptance criteria

- [ ] Base-URL, Modell, Key und Timeout kommen aus der `.env` wie in der
      Tabelle oben
- [ ] `ai_sdk.generate_object` und der ausgetauschte OpenAI-Client
      (`model._client`) bleiben — nur gespeist aus der Konfiguration
- [ ] `extra_body={"thinking": ...}` ist ersatzlos entfernt; keine
      anbieterspezifische Logik im Code
- [ ] Die Verhaltens-Tests aus [Ticket 03](03-backend-suggestion-service.md)
      laufen inhaltlich unverändert; nur die Konfigurations-Tests sind auf
      `LLM_*` umgestellt:
  - [ ] `model_answers` (conftest) und `test_failing_model_call…` setzen
        `LLM_BASE_URL` und `LLM_MODEL` statt `Z_AI_API_KEY`
  - [ ] `fake_z_ai` heißt `fake_llm_endpoint`; der Test prüft, dass die
        Anfrage an die konfigurierte Base-URL geht, mit konfiguriertem Modell
        und Key und ohne `thinking`-Feld
  - [ ] Parametrisierter Test: fehlende `LLM_BASE_URL` bzw. `LLM_MODEL` →
        kein Vorschlag, kein Modellaufruf (ersetzt den Test zum fehlenden
        z.ai-Key, inklusive der Absicherung gegen `OPENAI_API_KEY`)
  - [ ] Neuer Test: ohne `LLM_API_KEY` geht die Anfrage trotzdem raus
- [ ] `backend/.env.example` existiert mit allen Variablen (DB, JWT, LLM):
      LM Studio als aktiver Block, ein externer Anbieter auskommentiert
- [ ] `backend/README.md` verweist auf `.env.example`, beschreibt den
      Endpoint anbieter-neutral und nennt für LM Studio: Server starten,
      Modell vorab laden (Kaltstart), bei Qwen den Denkmodus abschalten
- [ ] OpenAPI-Beschreibung des Endpoints ist anbieter-neutral („sent to the
      configured LLM endpoint (`LLM_BASE_URL`, LM Studio by default)“) und
      nennt statt `Z_AI_API_KEY` die fehlende Konfiguration
- [ ] ADR 0012 „Category Suggestion über einen konfigurierbaren
      OpenAI-kompatiblen Endpoint, lokal als Standard“ ist angelegt; in
      [ADR 0011](../../../docs/adr/0011-category-suggestions-via-external-llm.md)
      ist der Provider-Abschnitt als durch 0012 ersetzt markiert
- [ ] **Live mit LM Studio** (Gemma 4 E4B, QAT) ist in der App zu sehen:
  - [ ] ein Vorschlag für eine **bestehende** Category belegt das leere Feld
        vor ([Ticket 04](04-auto-vorschlag-leeres-feld.md))
  - [ ] ein Vorschlag für eine **neue** Category öffnet den
        Bestätigungs-Hinweis ([Ticket 04](04-auto-vorschlag-leeres-feld.md) /
        [05](05-manueller-vorschlag-button.md))
  - [ ] bei ausgeschaltetem LM Studio erscheint „Keine Kategorie
        vorgeschlagen.“ und die App läuft fehlerfrei weiter
- [ ] Reicht der Timeout von 10 s live nicht, darf `LLM_TIMEOUT_SECONDS` in
      der eigenen `.env` erhöht werden; der beobachtete Wert steht als
      Kommentar in diesem Ticket, der Standard bleibt bis Ticket 12 bei 10

## Out of scope

- Welcher Anbieter und welches Modell gewählt werden, Eval-Skript,
  Standardwert des Timeouts → [12](12-llm-anbieter-auswaehlen.md)
- Zwei Konfigurationen und eine Wahl pro User →
  [11](11-user-waehlt-suggestion-anbieter.md)
- Jev als Klassifier für den Teilschritt „bestehende Category wählen“
- `LLM_EXTRA_BODY` für anbieterspezifische Parameter — erst, falls Ticket 12 zeigt,
  dass es ohne nicht geht
- Wechsel von `ai_sdk` auf das `openai`-SDK direkt

## Comments

- 2026-09-23: Aus dem ursprünglichen Ticket 08 herausgelöst (Grilling mit
  Linda); die Anbieterauswahl ist jetzt [Ticket 12](12-llm-anbieter-auswaehlen.md).
  Kommt vor Ticket 12, weil die Messung dort genau die Umschaltbarkeit über
  `.env` braucht. Die Live-Punkte brauchen Linda am Rechner mit LM Studio.
  Der Live-Test schließt die offene Lücke aus
  [Ticket 04](04-auto-vorschlag-leeres-feld.md): Der Bestätigungs-Hinweis für
  eine neue Category war bisher nur über gemockte Tests abgesichert.
