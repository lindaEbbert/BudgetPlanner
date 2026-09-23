# 05: Manueller Vorschlag per Button (belegtes Feld, inkl. Bearbeiten)

**What to build:** Ein Button neben dem Category-Feld ruft den Vorschlag
gezielt ab, wenn das Feld bereits belegt ist (z. B. beim Bearbeiten, oder
nach einer Fixkosten-Zuordnung). Das Ergebnis wird zur Bestätigung
angezeigt, bevor es das bestehende Feld überschreibt.

**Blocked by:** 03, 04

**Status:** done

- [x] Button ist im Anlegen- und im Bearbeiten-Formular verfügbar
- [x] Button ist deaktiviert, solange eine Fixkosten-Zuordnung gesetzt ist
- [x] Klick ruft den Vorschlag unabhängig vom aktuellen Zustand des
      Category-Felds ab
- [x] Ergebnis wird zur Bestätigung angezeigt statt das Feld direkt zu
      überschreiben (sowohl bei Treffer als auch bei
      `newCategoryName`-Vorschlag)
- [x] Accept übernimmt die vorgeschlagene bzw. neu angelegte Category;
      Reject lässt das Feld unverändert
- [x] Verhalten ist im Bearbeiten-Formular identisch zum Anlegen-Formular

## Comments

- 2026-09-17: Response-Keys an die API angeglichen. Der Endpoint
  `POST /transactions/category-suggestion` liefert `{ categoryId,
  newCategoryName }` in camelCase, siehe OpenAPI-Schema `CategorySuggestion`
  in `backend/src/app/openapi/openapi.yaml`.

- 2026-09-23: Umgesetzt im Transaktionsformular.
  - **Button:** „Kategorie vorschlagen“ neben dem Category-Feld. Sein Abstand kommt
    aus einer einzelnen Regel im `styles` der Komponente: Die `.scss` daneben ist
    weiterhin nicht über `styleUrl` eingebunden (Bestandsthema, siehe
    [Ticket 04](04-auto-vorschlag-leeres-feld.md)), und sie einzubinden würde das
    Layout des ganzen Dialogs ändern.
  - **Deaktiviert:** bei gesetzter Fixkosten-Zuordnung, ohne Bezeichnung oder Typ
    (der Endpoint lehnt Anfragen ohne `type` mit 400 ab) und solange ein Angebot
    offen ist. Beim Typ `INITIAL` entfällt er mit dem ganzen Category-Block.
  - **Nicht deaktiviert, solange die Anfrage läuft:** ein Button, der sich unter dem
    Fokus deaktiviert, gibt ihn an `<body>` ab. Stattdessen wird ein zweiter Klick
    ignoriert und ein Status-Hinweis meldet „Vorschlag wird geholt…“.
  - **Bestätigung statt Übernahme:** Treffer → „Vorschlag: Kategorie X übernehmen?“
    mit Übernehmen/Verwerfen; nur `newCategoryName` → derselbe Bestätigungs-Fluss wie
    beim automatischen Vorschlag. Verwerfen lässt das Feld unverändert, auch wenn
    bereits eine Category gesetzt war. Das gilt auch bei leerem Feld: der Button
    übernimmt nie von selbst.
  - **Abweichung vom Spec:** Kommt ein per Button geholter Vorschlag leer zurück —
    auch bei Fehler oder 429 —, erscheint „Keine Kategorie vorgeschlagen.“. Der Spec
    sieht für Fehler keine sichtbare Meldung vor; das galt dem automatischen
    Vorschlag. Ein expliziter Klick ganz ohne Rückmeldung wirkt kaputt, zumal z.ai im
    Free Tier meist 429 liefert. Der Hinweis verschwindet bei der nächsten
    Formularänderung.
  - **Auslöser getrennt:** Der automatische Vorschlag überholt eine laufende
    Button-Anfrage nicht mehr, sonst landete deren Antwort am Bestätigungs-Schritt
    vorbei direkt im Feld.
  - **Unbekannte `categoryId`** aus der Antwort gilt als „kein Vorschlag“, statt sie
    ins Feld zu schreiben.
  - **Bearbeiten-Formular:** identisch, da dieselbe Komponente; per Test abgedeckt.
  - **Glossar:** Der Eintrag „Category Suggestion“ in `CONTEXT.md` nennt jetzt auch
    das Ersetzen einer bereits gesetzten Category.
    [ADR 0011](../../../docs/adr/0011-category-suggestions-via-external-llm.md)
    bleibt unverändert: Die Aussage dort — nie von sich aus in die Datenbank
    schreiben, der Nutzer bestätigt immer — gilt weiterhin.
  - **Bewusst gelassen** (im Review entschieden): Der Bestätigungstext nennt die zu
    ersetzende Category nicht („Vorschlag: X statt Y“) — das Feld darüber zeigt sie
    ohnehin —, und ein Vorschlag, der der gewählten Category entspricht, wird
    trotzdem angeboten. Der Vorschlags-Zustand bleibt auf drei Signals verteilt
    statt in einer Union; die Invarianten hält der Guard auf offene Angebote.
  - **Folgetickets:**
    [Ticket 09](09-unbekannte-category-id-im-vorschlag.md) — der automatische
    Vorschlag schreibt eine unbekannte `categoryId` weiterhin ungeprüft ins Feld
    (Bestand aus Ticket 04) — und
    [Ticket 10](10-formularwerte-als-signals.md) — Formularwerte als Signals, damit
    die abgeleiteten Zustände `computed()` werden.
