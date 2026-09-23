# 08: LLM-Provider für die Category Suggestion wechseln

**What to build:** Die Category Suggestion läuft heute über `glm-4.7-flash`
bei z.ai. Im Free Tier antwortet der Dienst fast immer mit 429, der Vorschlag
ist dadurch live praktisch nie zu sehen. Provider und Modell sollen gewechselt
werden. Kandidaten: OpenAI, JEV (TypeSafe) oder eine lokale Alternative
(z. B. Ollama). Damit ein weiterer Wechsel später kein Code-Umbau mehr ist,
werden Base-URL, Modell und Key über `.env` konfigurierbar.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Qualität und Latenz der Kandidaten sind mit denselben Beispielen
      gemessen wie bei der Diagnose zu Ticket 03 (gleiche Transaktionsnamen,
      gleiche Kategorienliste)
- [ ] Für jeden Kandidaten ist geklärt: OpenAI-kompatibler Endpoint ja/nein,
      Kosten bzw. Free Tier, und ob `json_schema` unterstützt wird
- [ ] Bei einem externen Anbieter ist geprüft, welche Daten rausgehen — heute
      nur `name`, `description`, `type` und die Kategorienamen (Spec-Story 18)
- [ ] Fällt die Wahl auf Jev: entschieden, woher der Vorschlag für eine *neue*
      Category kommt (zweites Modell, oder der Hinweis öffnet sich mit leerem
      Namensfeld) — Jev kann keinen Namen erzeugen
- [ ] Base-URL, Modell und API-Key kommen aus `.env` statt aus Konstanten in
      `category_suggestion_service.py`; der ersetzte OpenAI-Client
      (`model._client`) ist dabei überdacht
- [ ] `backend/README.md`, `.env`-Beispiel und OpenAPI-Beschreibung des
      Endpoints nennen den neuen Anbieter
- [ ] Die bestehenden Tests zu Ticket 03 laufen unverändert weiter (der
      LLM-Aufruf ist dort gemockt)
- [ ] [ADR 0011](../../../docs/adr/0011-category-suggestions-via-external-llm.md)
      ist ergänzt

## Comments

- 2026-09-23: Angelegt auf Wunsch von Linda. Auslöser ist die Verfügbarkeit:
  Bei der Live-Diagnose zu Ticket 03 kamen fast nur 429er
  (`1302 Rate limit reached`, `1305 service temporarily overloaded`), einzelne
  10-s-Timeouts, und jeder Fehlschlag kostet zwei Requests, weil
  `ai_sdk.generate_object` einen zweiten Versuch startet. Beobachtete Latenz
  im Fehlerfall bis ~11,5 s.
  - Kandidat **OpenAI**: war die ursprüngliche Wahl in ADR 0011, bevor auf
    z.ai gewechselt wurde.
  - Kandidat **Jev (TypeSafe)**: von Linda genannt, siehe die Recherche
    unten — passt für die halbe Aufgabe sehr gut, kann die andere Hälfte
    aber prinzipiell nicht.
  - Kandidat **lokal** (z. B. Ollama): läuft CPU-only auf Ryzen 7 7735HS mit
    16 GB RAM, ohne dedizierte GPU. Das wäre eine echte Änderung an ADR 0011,
    weil die Entscheidung dort ausdrücklich auf ein externes LLM lautet.
    Dafür entfallen Rate Limits und der Versand von Transaktionstexten an
    einen Dritten.
  - Hängt zusammen mit dem offenen Live-Test aus
    [Ticket 04](04-auto-vorschlag-leeres-feld.md): Solange kein Vorschlag
    durchkommt, ist der Bestätigungs-Hinweis für eine neue Category nur über
    die gemockten Tests abgesichert.

- 2026-09-23: Recherche zu Jev (Quellen unten). Jev ist **kein LLM**, sondern
  ein "System One"-Modell: Es bekommt einen Text plus typisierte Fragen und
  antwortet mit typisierten Werten samt Wahrscheinlichkeiten und Confidence.
  Laut TypeSafe rund 100× schneller und günstiger als übliche LLMs
  (Input 42 $ pro Milliarde Tokens, Output kostenlos). Erschienen am
  2026-09-15.
  - **Passt gut für den Kern der Aufgabe:** "Welche meiner bestehenden
    Categories passt?" ist genau eine Auswahl aus vorgegebenen Optionen
    (`Choice`, optionales Pick-one für "keine passt") — inklusive Confidence,
    über die sich ein Schwellwert legen ließe. Das heutige Nachschlagen der
    Namen auf IDs (case-insensitiv, siehe Ticket 03) könnte entfallen, weil
    die Antwort aus der übergebenen Optionsliste kommt statt aus freiem Text.
  - **Kann den Rest nicht:** Jev erzeugt keinen Text. Ein Vorschlag für einen
    *neuen* Kategorienamen (Spec-Stories 8 und 10, umgesetzt in Ticket 04)
    ist damit nicht möglich. Entweder bleibt dafür ein zweites Modell im
    Spiel, oder der Bestätigungs-Hinweis öffnet sich künftig mit leerem
    Namensfeld, das der Nutzer selbst füllt.
  - **Kein OpenAI-kompatibler Endpoint.** Eigene SDK (`typesafe_sdk`), oder
    über `pydantic-ai-slim[typesafe]` mit `TYPESAFE_API_KEY`; Modell-ID z. B.
    `typesafe:jev-latest`. Der Wechsel wäre also kein Austausch von Base-URL
    und Modellnamen, sondern ein Umbau von `category_suggestion_service.py`:
    `ai_sdk.generate_object` fällt weg, ebenso der ersetzte OpenAI-Client.
  - **Offen:** Qualität auf deutschen Transaktionsnamen, Latenz in der
    Praxis, Free Tier bzw. Mindestkosten.
  - **ADR 0011 wäre echt betroffen:** Dort steht die Entscheidung für ein
    externes *LLM*, begründet mit freier Texteingabe. Jev ist ein Klassifier
    — das ist eine andere Entscheidung, keine Ergänzung.
  - Quellen: <https://docs.typesafe.ai/introduction>,
    <https://pydantic.dev/docs/ai/models/typesafe/>,
    <https://typesafe.ai/blog/introducing-system-one-models-and-jev>
