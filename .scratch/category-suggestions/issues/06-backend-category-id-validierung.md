# 06: Backend lehnt ungültige Category-IDs bei Transaktionen ab

**What to build:** `POST /transactions` und `PUT /transactions/<id>`
übernehmen heute jede `categoryId` ungeprüft. Eine soft-gelöschte Category
wird so still gespeichert, eine nicht existierende oder ungültige ID endet
in einem Datenbankfehler (500). Künftig prüft der Transaction-Service, dass
die Category existiert, nicht gelöscht ist und dem Nutzer gehört; andernfalls
antwortet der Endpoint mit 400. Gemäß ADR 0010 liegt diese Regel im Backend,
nicht im Formular.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] `POST /transactions` mit der ID einer soft-gelöschten Category liefert
      400 und legt keine Transaktion an
- [ ] `POST /transactions` mit der Category-ID eines anderen Nutzers liefert
      400
- [ ] `POST /transactions` mit einer nicht existierenden oder ungültigen
      Category-ID liefert 400 statt 500
- [ ] `PUT /transactions/<id>` lehnt dieselben Fälle mit 400 ab und lässt die
      Transaktion unverändert (heute bildet der Controller jeden
      Service-Fehler auf 404 ab; "nicht gefunden" bleibt 404)
- [ ] Aktive Categories des Nutzers funktionieren weiterhin, ebenso
      `INITIAL`-Transaktionen ohne `categoryId`
- [ ] Tests über den Service bzw. den Flask-Test-Client (Fixtures aus
      Ticket 01)

## Comments

- 2026-09-16: Angelegt aus dem Spec-Review zu Ticket 02 (Option B). Anlass:
  Wählt man im Transaktionsformular eine Fixed Cost, deren Category
  inzwischen soft-gelöscht ist, setzt das Formular diese `categoryId`. Das
  Feld wirkt leer, besteht aber die `required`-Prüfung, und die Transaktion
  wird mit der gelöschten Category gespeichert.
  - Ein zusätzlicher Frontend-Schutz (nur Categories aus der geladenen Liste
    übernehmen, Option A) wurde bewusst nicht umgesetzt. Nach diesem Ticket
    schlägt das Speichern in dem Fall mit 400 fehl; das Formular zeigt
    Speicherfehler derzeit nur per `console.error`.
  - Verwandt: Die Unique-Constraint `unique_category_name_per_user` greift
    auch für soft-gelöschte Categories (offener Punkt aus Ticket 03), gleiche
    Ursache: unvollständiger Umgang mit Soft-Delete.
  - Nicht Teil dieses Tickets: `POST`/`PUT /fixed-costs` prüfen `categoryId`
    ebenfalls nicht.
