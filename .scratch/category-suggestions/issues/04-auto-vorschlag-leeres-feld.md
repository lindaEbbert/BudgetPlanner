# 04: Automatischer Vorschlag beim Anlegen (leeres Feld)

**What to build:** Verlässt der Nutzer im Transaktionsformular das
Namensfeld, und das Category-Feld ist leer und keine Fixkosten-Zuordnung
gesetzt, wird automatisch ein Kategorie-Vorschlag abgerufen. Bei Treffer
wird die Category direkt gesetzt; ohne Treffer erscheint ein
Bestätigungs-Hinweis mit editierbarem neuen Kategorienamen.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] Verlassen des Namensfelds löst den Vorschlags-Call nur aus, wenn
      `categoryId` leer und `fixedCostId` leer sind
- [ ] Ist `categoryId` bereits belegt oder `fixedCostId` gesetzt, löst das
      Verlassen des Namensfelds keinen Call aus
- [ ] Liefert der Vorschlag eine existierende `categoryId`, wird das
      Category-Feld direkt damit befüllt
- [ ] Liefert der Vorschlag nur einen `newCategoryName`, erscheint ein
      Hinweis mit editierbarem Namen und Accept/Reject
- [ ] Accept legt die Category über den bestehenden Categories-Weg an und
      setzt sie als Auswahl
- [ ] Reject lässt das Category-Feld leer, Nutzer wählt manuell
- [ ] Schlägt der Aufruf fehl (Netzwerk/Timeout/Fehler), bleibt das
      Formular normal nutzbar, ohne Fehlermeldung
- [ ] Die gesetzte Category bleibt weiterhin manuell änderbar

## Comments

- 2026-09-17: Response-Keys an die API angeglichen. Der Endpoint
  `POST /transactions/category-suggestion` liefert `{ categoryId,
  newCategoryName }` in camelCase, siehe OpenAPI-Schema `CategorySuggestion`
  in `backend/src/app/openapi/openapi.yaml`.
