# 04: Automatischer Vorschlag beim Anlegen (leeres Feld)

**What to build:** Verlässt der Nutzer im Transaktionsformular das
Namensfeld, und das Category-Feld ist leer und keine Fixkosten-Zuordnung
gesetzt, wird automatisch ein Kategorie-Vorschlag abgerufen. Bei Treffer
wird die Category direkt gesetzt; ohne Treffer erscheint ein
Bestätigungs-Hinweis mit editierbarem neuen Kategorienamen.

**Blocked by:** 03

**Status:** done

- [x] Verlassen des Namensfelds löst den Vorschlags-Call nur aus, wenn
      `categoryId` leer und `fixedCostId` leer sind
- [x] Ist `categoryId` bereits belegt oder `fixedCostId` gesetzt, löst das
      Verlassen des Namensfelds keinen Call aus
- [x] Liefert der Vorschlag eine existierende `categoryId`, wird das
      Category-Feld direkt damit befüllt
- [x] Liefert der Vorschlag nur einen `newCategoryName`, erscheint ein
      Hinweis mit editierbarem Namen und Accept/Reject
- [x] Accept legt die Category über den bestehenden Categories-Weg an und
      setzt sie als Auswahl
- [x] Reject lässt das Category-Feld leer, Nutzer wählt manuell
- [x] Schlägt der Aufruf fehl (Netzwerk/Timeout/Fehler), bleibt das
      Formular normal nutzbar, ohne Fehlermeldung
- [x] Die gesetzte Category bleibt weiterhin manuell änderbar

## Comments

- 2026-09-17: Response-Keys an die API angeglichen. Der Endpoint
  `POST /transactions/category-suggestion` liefert `{ categoryId,
  newCategoryName }` in camelCase, siehe OpenAPI-Schema `CategorySuggestion`
  in `backend/src/app/openapi/openapi.yaml`.

- 2026-09-22: Offen (Backlog): Der Bestätigungs-Hinweis für eine neue Category
  wurde noch nie live gesehen. z.ai liefert im Free Tier fast immer 429, und
  dann antwortet der Endpoint mit `null`/`null` — das Formular bleibt dabei
  unverändert, genau wie bei einem Fehler. Einmal manuell durchspielen, sobald
  ein `newCategoryName` durchkommt (oder den Service dafür vorübergehend fest
  verdrahten). Abgesichert ist der Ablauf bis dahin nur über die gemockten
  Tests, siehe [Ticket 03](03-backend-suggestion-service.md) und die
  Notiz zur LLM-Verfügbarkeit.

- 2026-09-23: Umgesetzt im Transaktionsformular.
  - **Auslöser:** Verlassen des Namensfelds *oder* Wahl des Typs, je nachdem,
    was zuletzt kommt. Grund: Der Endpoint lehnt Anfragen ohne `type` mit 400
    ab, im Formular steht die Bezeichnung aber vor dem Typ — sonst käme beim
    Anlegen fast nie ein Vorschlag. Bedingungen unverändert: Name nicht leer,
    Typ `INCOME`/`EXPENSE`, Category leer, keine Fixkosten-Zuordnung.
  - **Späte Antwort:** Beim Eintreffen prüft `categoryIsOpenForSuggestion()`
    erneut (Category leer, keine Fixkosten, Typ nicht `INITIAL`). Ein neuer
    Auslöser bricht die noch offene Anfrage ab, damit nicht die Antwort zum
    alten Namen gewinnt.
  - **Angebot für eine neue Category:** Hinweis mit editierbarem Namen,
    „Kategorie anlegen“ / „Verwerfen“. Angelegt wird über den bestehenden
    `POST /categories`. Schlägt das fehl, bleibt das Angebot mit einer Meldung
    offen. Ein zweiter Klick währenddessen löst keinen zweiten POST aus, ein
    leerer Name deaktiviert den Button.
  - **Solange ein Angebot offen ist** (auch während des Anlegens oder nach
    einem Fehler), wird kein neuer Vorschlag geholt. Sonst überschreibt die
    Antwort den bearbeiteten Namen und ein zweites Anlegen wird möglich.
  - **Zurückgezogen** wird das Angebot, sobald es nicht mehr passt: Category
    gesetzt, Typ `INITIAL` oder Fixkosten-Zuordnung gewählt
    (`withdrawNewCategoryOfferIfObsolete()`).
  - **Fokus:** Nach „Verwerfen“ bzw. erfolgreichem Anlegen wandert der Fokus
    auf das Category-Feld, sonst landet er auf `<body>`. Wird das Angebot
    durch eine andere Feldänderung zurückgezogen, bleibt der Fokus stehen.
  - **Neu:** `CategorySuggestionService` und die Models `SuggestCategoryDto` /
    `CategorySuggestion`.
  - **Bewusst gelassen:** Der neue Kategoriename wird nicht getrimmt (wie im
    `CategoryFormComponent`); die `.scss` des Formulars ist weiterhin nicht
    über `styleUrl` eingebunden (Bestandsthema, betrifft `.two-col` und
    `.form-layout`).
  - **Folgeticket:** Bestätigt der Nutzer einen neuen Kategorienamen, der zu
    einer gelöschten Category passt, endet `POST /categories` heute in einem
    500er — siehe [Ticket 07](07-geloeschte-category-wiederherstellen.md).
