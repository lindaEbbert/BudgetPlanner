# Automatische Kategorie-Erkennung für Transaktionen

Status: ready-for-agent

## Problem Statement

Beim Anlegen einer Transaktion muss der Nutzer die Kategorie jedes Mal manuell
aus der Liste auswählen — selbst bei wiederkehrenden, leicht erkennbaren
Transaktionen ("Rewe", "Netflix", "Miete"). Das ist unnötiger manueller
Aufwand bei einem Pflichtfeld, das in den meisten Fällen aus dem Namen der
Transaktion ableitbar wäre.

## Solution

Eine Category Suggestion schlägt die Kategorie für eine Transaktion vor, statt
sie manuell auswählen zu müssen:

- Ist eine Fixed-Cost-Zuordnung gewählt, wird deren eigene Category
  automatisch übernommen (wie schon heute beim Betrag).
- Andernfalls kann ein externer LLM-Aufruf (`glm-4.7-flash` über
  [chat.z.ai](https://chat.z.ai/), via `ai-sdk-python`) den Namen, die
  Beschreibung und den Typ der Transaktion gegen die bestehenden Categories
  des Nutzers abgleichen und eine passende vorschlagen.
- Ist das Category-Feld leer, passiert das automatisch beim Verlassen des
  Namensfelds. Ist es bereits belegt, holt ein expliziter Button den
  Vorschlag auf Wunsch nach und zeigt ihn zur Bestätigung an, bevor er das
  Feld überschreibt.
- Passt keine bestehende Category, wird eine neu vorgeschlagene Category zur
  Bestätigung angezeigt statt sie automatisch anzulegen.
- Der Vorschlag bleibt in jedem Fall nur eine Vorbefüllung — die endgültige
  Category legt immer der Nutzer fest.

Siehe [ADR 0011](../../docs/adr/0011-category-suggestions-via-external-llm.md)
für die Begründung der Technologie-Entscheidung und den Glossar-Eintrag
"Category Suggestion" in `CONTEXT.md`.

## User Stories

1. Als Nutzer möchte ich, dass beim Erstellen einer Transaktion mit
   Fixed-Cost-Zuordnung die Category automatisch aus der Category der Fixed
   Cost übernommen wird, damit ich sie nicht erneut manuell auswählen muss.
2. Als Nutzer möchte ich die automatisch übernommene Category weiterhin
   manuell ändern können, falls sie für diese einzelne Transaktion nicht
   passt.
3. Als Nutzer möchte ich, dass beim Verlassen des Namensfelds (ohne
   Fixed-Cost-Zuordnung) automatisch eine Category Suggestion abgerufen wird,
   wenn das Category-Feld noch leer ist, damit ich beim Anlegen weniger
   manuell auswählen muss.
4. Als Nutzer möchte ich, dass kein automatischer Vorschlag abgerufen wird,
   solange das Category-Feld bereits belegt ist, damit eine bewusst gesetzte
   Category nicht ungefragt überschrieben wird.
5. Als Nutzer möchte ich einen Button nutzen können, um eine Category
   Suggestion gezielt abzurufen, auch wenn das Category-Feld bereits belegt
   ist, damit ich die KI-Einschätzung bei Bedarf trotzdem einholen kann.
6. Als Nutzer möchte ich einen per Button abgerufenen Vorschlag erst
   bestätigen, bevor er das bereits gesetzte Feld überschreibt, damit ich
   nicht versehentlich eine bewusst gesetzte Category verliere.
7. Als Nutzer möchte ich, dass der Vorschlag immer änderbar bleibt, egal wie
   er zustande kam, damit die letzte Entscheidung immer bei mir liegt.
8. Als Nutzer möchte ich, dass bei fehlendem Treffer unter meinen bestehenden
   Categories ein Hinweis mit einem vorgeschlagenen neuen Kategorienamen
   angezeigt wird, damit ich weiß, dass keine passende bestehende Category
   gefunden wurde.
9. Als Nutzer möchte ich diesen Vorschlag für eine neue Category explizit
   bestätigen müssen, bevor sie angelegt wird, damit meine Kategorieliste
   nicht durch KI-Fehlgriffe verschmutzt wird.
10. Als Nutzer möchte ich den vorgeschlagenen neuen Kategorienamen vor dem
    Anlegen noch bearbeiten können, damit ich Formulierungen anpassen kann,
    bevor sie dauerhaft gespeichert werden.
11. Als Nutzer möchte ich den Vorschlag für eine neue Category auch ablehnen
    können; das Category-Feld bleibt dann leer und ich wähle manuell eine
    bestehende Category aus.
12. Als Nutzer möchte ich, dass eine neu angelegte Category über denselben
    Weg wie manuell angelegte Categories entsteht (eindeutiger Name pro
    Nutzer), damit es keine Sonderregeln oder Duplikate gibt.
13. Als Nutzer möchte ich, dass beim Bearbeiten einer bestehenden Transaktion
    dieselbe Logik gilt wie beim Anlegen (leer → automatisch, belegt → nur
    Button), damit sich das Formular konsistent verhält.
14. Als Nutzer möchte ich, dass keine automatische Anfrage ausgelöst wird,
    solange eine Fixed-Cost-Zuordnung aktiv ist, damit die verlässliche
    Fixed-Cost-Category nicht durch eine unsichere KI-Schätzung ersetzt wird.
15. Als Entwickler möchte ich, dass der externe LLM-Aufruf ausschließlich
    serverseitig im Backend erfolgt, damit kein API-Key im Frontend landet
    und die fachliche Logik gemäß ADR 0010 im Service bleibt.
16. Als Entwickler möchte ich, dass der z.ai-API-Key über eine
    Umgebungsvariable konfiguriert wird, damit keine Zugangsdaten im Code
    landen.
17. Als Nutzer möchte ich, dass das Formular bei einem Fehlschlagen des
    KI-Aufrufs (Netzwerkfehler, Timeout, fehlender/ungültiger API-Key)
    weiterhin normal nutzbar bleibt und ich die Category einfach manuell
    auswähle, damit ein Ausfall des externen Dienstes mich nicht blockiert.
18. Als Nutzer möchte ich, dass an das Modell nur `name`, `description` und
    `type` der Transaction sowie meine existierenden Kategorienamen
    übermittelt werden, damit nicht mehr persönliche Finanzdaten als nötig an
    einen externen Dienst gehen.
19. Als Nutzer möchte ich, dass eine Category weiterhin ein reines Label ohne
    Einnahme/Ausgabe-Bedeutung bleibt, auch wenn sie KI-generiert ist, damit
    ADR 0009 nicht unterlaufen wird.

## Implementation Decisions

- Neuer Backend-Service (analog zu den bestehenden Services unter
  `services/`), der: die existierenden Categories des Nutzers lädt, daraus
  zusammen mit `name`/`description`/`type` der Transaction einen Prompt baut,
  `ai_sdk.generate_object` (Paket `ai-sdk-python`, konfiguriert auf
  `glm-4.7-flash` über den OpenAI-kompatiblen Endpoint von chat.z.ai) mit
  einem Pydantic-Schema aufruft, das entweder eine existierende
  `category_id`, einen `new_category_name`-Vorschlag oder beides leer
  (kein Treffer) zurückgibt.
- Neuer, JWT-geschützter Endpoint im Transaction-Controller (Konvention wie
  bestehende Endpoints), der `name`, `description`, `type` entgegennimmt und
  das Ergebnis des Services als JSON zurückgibt.
- Neue Abhängigkeit `ai-sdk-python` in `backend/requirements.txt`; neue
  Umgebungsvariable `Z_AI_API_KEY`, geladen wie die bestehenden `.env`-Werte
  über `python-dotenv`; Setup-Schritt in `backend/README.md` ergänzen.
- Kein neuer Weg zum Anlegen von Categories: Bestätigt der Nutzer eine neue
  Category, ruft das Frontend den bestehenden `POST /categories`-Endpoint
  auf (über den bestehenden `category_service`) und übernimmt die
  zurückgegebene ID.
- Frontend (`TransactionFormComponent`): neuer injizierter Service, der den
  neuen Suggestion-Endpoint kapselt. Der bestehende `fixedCostId`-
  `valueChanges`-Listener (der heute schon den Betrag automatisch setzt) wird
  um das Setzen von `categoryId` aus der Fixed Cost erweitert. Ein neuer
  `blur`-Handler am Namensfeld ruft die Suggestion nur ab, wenn `categoryId`
  aktuell leer UND `fixedCostId` aktuell leer ist — bei Treffer wird das
  Feld hier direkt befüllt, da nichts überschrieben wird. Ein neuer Button
  ruft die Suggestion unabhängig vom aktuellen Zustand ab (außer wenn
  `fixedCostId` gesetzt ist — dann deaktiviert); anders als beim
  automatischen Blur-Trigger wird das Ergebnis hier nicht direkt übernommen,
  sondern zur Bestätigung angezeigt (z. B. „Vorschlag: 'Lebensmittel' statt
  'Sonstiges' übernehmen?“ mit Accept/Reject), da dabei eine bereits gesetzte
  Category überschrieben würde. Liefert die Suggestion nur einen
  `newCategoryName` (kein Treffer unter bestehenden Categories), gilt
  unabhängig vom Auslöser immer der Bestätigungs-Fluss mit editierbarem
  Namen (Accept legt über den bestehenden Categories-Weg an und übernimmt
  die ID; Reject lässt das Feld leer).
- Fehler beim Suggestion-Aufruf (Netzwerk, Timeout, Provider-Fehler) werden
  im Frontend abgefangen und führen zu keiner sichtbaren Störung — das Feld
  bleibt einfach unverändert, keine Fehlermeldung nötig.

## Testing Decisions

- Tests prüfen nur äußeres Verhalten (Rückgabewerte, gesetzte Formularwerte,
  ausgelöste HTTP-Calls), keine internen Implementierungsdetails.
- Backend-Seam: der neue Categorization-Service, direkt aufgerufen (keine
  Flask-Test-Client-Tests nötig für die Kernlogik). Der `ai_sdk.generate_object`-
  Aufruf wird mit einem Mock/Stub ersetzt, der feste Rückgabewerte liefert —
  keine echten API-Calls in Tests. Abzudecken: Treffer unter bestehenden
  Categories → passende `category_id`; kein Treffer → `new_category_name`;
  Nutzer ohne Categories → funktioniert trotzdem; der externe Aufruf wirft
  einen Fehler → Service liefert ein klar erkennbares "kein Ergebnis" statt
  die Exception durchzureichen.
- Frontend-Seam: `TransactionFormComponent` über Angular TestBed, HTTP-Calls
  zum neuen Endpoint über `HttpTestingController` abgefangen. Abzudecken:
  `blur` löst nur aus, wenn Category leer und keine Fixed-Cost-Zuordnung
  gesetzt ist, und übernimmt einen Treffer dabei direkt ins Feld; `blur`
  löst NICHT aus, wenn Category bereits belegt oder Fixed-Cost-Zuordnung
  gesetzt ist; Button löst immer aus (außer deaktiviert bei gesetzter
  Fixed-Cost-Zuordnung) und zeigt das Ergebnis zur Bestätigung an, statt
  direkt zu überschreiben — Accept übernimmt die vorgeschlagene Category,
  Reject verwirft den Vorschlag und lässt das Feld unverändert; Antwort mit
  nur `newCategoryName` zeigt unabhängig vom Auslöser den
  Bestätigungs-Hinweis; Accept legt die Category an und setzt die ID; Reject
  lässt das Feld leer; ein HTTP-Fehler bricht das Formular nicht.
- Weder Backend noch Frontend haben aktuell automatisierte Tests (nur
  `backend/test.http` bzw. das Default-`app.spec.ts`) — dies ist der erste
  echte Test-Seam in beiden. Die grundlegende Test-Infrastruktur (z. B.
  `pytest`-Setup samt Teststrategie für die Datenbank) muss dafür
  voraussichtlich als vorgelagerter Schritt mit aufgebaut werden.

## Out of Scope

- Kein automatisches Nachkategorisieren bereits bestehender Transaktionen
  (kein Backfill).
- Kein Lernen aus Nutzerkorrekturen (keine Speicherung abgelehnter
  Vorschläge, kein Fine-Tuning).
- Keine Unterstützung weiterer LLM-Provider (z. B. Anthropic) in dieser
  ersten Version — `ai-sdk-python` erlaubt einen späteren Wechsel, ist aber
  nicht Teil dieses Specs.
- Kein Rate-Limiting oder Caching über den `blur`/Button-Mechanismus hinaus.
- Keine Änderungen an Budget- oder Dashboard-Logik.

## Further Notes

- Grundsatzentscheidung und Begründung sind bereits als
  [ADR 0011](../../docs/adr/0011-category-suggestions-via-external-llm.md)
  und als Glossar-Eintrag "Category Suggestion" in `CONTEXT.md` festgehalten.
- Dieses Feature spannt Backend und Frontend auf, mit einer echten
  Abhängigkeit (Frontend braucht den Backend-Endpoint) — beim Ticket-Split
  über `/to-tickets` sollte das als Blocking Edge abgebildet werden.
- Der Endpoint antwortet in camelCase mit `{ categoryId, newCategoryName }`
  (OpenAPI-Schema `CategorySuggestion`). `category_id`/`new_category_name`
  in den Backend-Abschnitten bezeichnen die Felder des Python-Services.
