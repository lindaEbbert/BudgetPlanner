# 12: LLM-Anbieter für die Category Suggestion auswählen

**What to build:** Die Category Suggestion lief bisher über `glm-4.7-flash`
bei z.ai. Im Free Tier antwortet der Dienst fast immer mit 429, der Vorschlag
ist dadurch live praktisch nie zu sehen. Dieses Ticket misst Kandidaten mit
einem festen Beispielsatz und entscheidet, welcher Anbieter und welches Modell
Standard werden. Die Umschaltung selbst ist nach
[Ticket 08](08-llm-endpoint-konfigurierbar.md) nur eine Änderung in der
`.env`.

Wichtigstes Kriterium: kostenlos oder günstig; danach, dass möglichst wenig
Daten an Dritte gehen.

**Blocked by:** 08

**Status:** ready-for-agent

## Kandidaten

- LM Studio lokal: **Gemma 4 E4B** (QAT) und **Qwen 3.5 4B** (Q8), Denkmodus
  bei Qwen abgeschaltet
- **OpenAI**
- ein bis zwei externe Anbieter mit OpenAI-kompatiblem Endpoint und
  zuverlässig nutzbarem Free Tier (z. B. Google Gemini, Groq — Limits und
  `json_schema`-Support recherchieren)

Nicht Kandidat: Jev (siehe Out of scope).

## Acceptance criteria

- [ ] Beispielsatz liegt in `.scratch/category-suggestions/eval-beispiele.md`:
      10–15 Transaktionen gegen eine feste Kategorienliste — klare Treffer auf
      eine bestehende Category, Fälle für eine neue Category, Fälle für
      „kein Vorschlag“, abweichende Groß-/Kleinschreibung. Die erwarteten
      Ergebnisse legt Linda fest
- [ ] `backend/scripts/evaluate_category_suggestions.py` ruft
      `suggest_category` für jedes Beispiel mit der aktuellen `.env` auf und
      gibt Treffer und Antwortzeit aus; Skript und Beispielsatz bleiben im
      Repo für spätere Wechsel
- [ ] Für jeden Kandidaten ist gemessen und festgehalten:
  - [ ] Trefferquote auf dem Beispielsatz (Schwelle: ≥ 80 %)
  - [ ] typische Antwortzeit bei geladenem Modell (Schwelle: ≤ 3 s);
        Kaltstart separat notiert
  - [ ] extern: keine 429er bei ~20 Anfragen in Folge im Free Tier
  - [ ] extern: Kosten bzw. Free Tier, `json_schema`-Support
- [ ] Bei einem externen Anbieter ist geprüft, welche Daten rausgehen — heute
      nur `name`, `description`, `type` und die Kategorienamen
      (Spec-Story 18)
- [ ] Entscheidung: Erfüllen mehrere Kandidaten die Schwellen, gewinnt lokal
- [ ] ADR 0012 ist um das gewählte Modell und die Messwerte ergänzt
- [ ] `backend/README.md` und `.env.example` nennen den gewählten Anbieter
- [ ] Standardwert von `LLM_TIMEOUT_SECONDS` ist anhand der Messung
      festgelegt

## Out of scope

- **Jev (TypeSafe)** für den Teilschritt „bestehende Category wählen“ — eigenes
  Ticket, falls die Messung zeigt, dass das LLM beim Auswählen zu langsam ist
- `LLM_EXTRA_BODY` — nur nachziehen, falls ein Kandidat ohne
  anbieterspezifische Parameter nicht brauchbar ist

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

- 2026-09-23: Nach dem Grilling mit Linda aufgeteilt. Die Konfigurierbarkeit
  über `.env` ist nach [08](08-llm-endpoint-konfigurierbar.md) gewandert
  und kommt zuerst, weil diese Messung sie braucht. Entschieden:
  - Lokal ist wieder im Rennen — über **LM Studio** statt Ollama, weil es den
    Rechner besser unterstützt. ADR 0011 wird dafür durch ADR 0012 abgelöst
    (in Ticket 08).
  - Der Vorschlag für eine *neue* Category bleibt. Jev wäre nur für den
    Teilschritt „bestehende wählen“ sinnvoll und ist aus diesem Ticket
    herausgenommen.
  - Die Beispiele aus der Diagnose zu Ticket 03 sind nirgends festgehalten;
    deshalb ein neuer, fester Beispielsatz im Repo.
  - Eine Wahl pro User zwischen lokal und extern →
    [Ticket 11](11-user-waehlt-suggestion-anbieter.md).
