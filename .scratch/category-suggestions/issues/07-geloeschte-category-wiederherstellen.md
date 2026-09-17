# 07: Gelöschte Category beim Neuanlegen wiederherstellen

**What to build:** Der Name einer soft-gelöschten Category ist heute
blockiert: Anlegen (`POST /categories`) oder Umbenennen
(`PUT /categories/<id>`) auf so einen Namen endet in einem Datenbankfehler
(500), weil die Unique-Constraint `unique_category_name_per_user` auch
gelöschte Categories umfasst. Künftig gilt die Eindeutigkeit nur für aktive
Categories. Legt der Nutzer eine Category an, deren Name zu einer gelöschten
Category passt, wird er gefragt, ob er stattdessen die alte Category
wiederherstellen oder eine neue anlegen möchte — auf der Kategorien-Übersicht
ebenso wie beim Anlegen aus einer Category Suggestion im
Transaktionsformular. Benennt er eine Category auf so einen Namen um, wird er
vorgewarnt und muss das Umbenennen bestätigen.

**Blocked by:** 04

**Status:** ready-for-agent

### Backend

- [ ] Die Eindeutigkeit des Category-Namens pro Nutzer gilt nur für nicht
      gelöschte Categories (Alembic-Migration und Model; die Tests bauen das
      Schema aus den Models)
- [ ] Anlegen und Umbenennen auf den Namen einer gelöschten Category liefern
      keinen 500er mehr
- [ ] Anlegen mit dem Namen einer gelöschten Category legt ohne ausdrückliche
      Wahl "neu anlegen" nichts an und meldet die gelöschte Category (ID,
      Name, Löschdatum), damit das Frontend nachfragen kann
- [ ] Mit ausdrücklicher Wahl "neu anlegen" entsteht eine neue Category mit
      neuer ID; die gelöschte bleibt gelöscht
- [ ] Umbenennen auf den Namen einer gelöschten Category ändert ohne
      ausdrückliche Bestätigung nichts und meldet die gelöschte Category;
      mit Bestätigung wird umbenannt, die gelöschte bleibt gelöscht
- [ ] Ein neuer JWT-geschützter Endpoint stellt eine eigene gelöschte
      Category wieder her und gibt sie zurück. Fremde, nicht existierende
      oder nicht gelöschte Categories → 404; gibt es bereits eine aktive
      Category mit diesem Namen → 409
- [ ] Der Namensabgleich ignoriert Groß-/Kleinschreibung und umgebende
      Leerzeichen (wie der Category-Suggestion-Service); bei mehreren
      gelöschten Treffern wird die zuletzt gelöschte angeboten
- [ ] `backend/README.md`, OpenAPI-Spec und `test.http` sind aktualisiert

### Frontend

- [ ] Kategorien-Übersicht (`CategoryFormComponent`): Meldet das Backend
      eine gelöschte Category mit dem Namen, erscheint die Auswahl "Alte
      Kategorie wiederherstellen" / "Neue Kategorie anlegen" / "Abbrechen".
      Abbrechen legt nichts an und lässt den Dialog mit dem eingegebenen
      Namen offen
- [ ] Kategorien-Übersicht, Umbenennen (`CategoryFormComponent` im
      Bearbeiten-Modus): Meldet das Backend eine gelöschte Category mit dem
      neuen Namen, erscheint die Warnung, dass es diese Kategorie schon
      einmal gab, mit der Auswahl "Wirklich umbenennen" / "Abbrechen".
      Abbrechen ändert nichts und lässt den Dialog mit dem eingegebenen
      Namen offen; ein Wiederherstellen wird hier nicht angeboten
- [ ] Transaktionsformular: Dieselbe Auswahl erscheint, wenn der Nutzer
      einen vorgeschlagenen neuen Kategorienamen bestätigt (Ticket 04, später
      auch 05). Wiederherstellen bzw. neu anlegen setzt die jeweilige
      Category als Auswahl; Abbrechen legt nichts an, lässt das Category-Feld
      unverändert und kehrt zum Vorschlags-Hinweis mit editierbarem Namen
      zurück
- [ ] Tests: Backend über Service und Flask-Test-Client; Frontend über
      TestBed mit `HttpTestingController` für beide Stellen

## Comments

- 2026-09-17: Angelegt aus den offenen Review-Punkten zu Ticket 03
  (Punkt 11). Entscheidung: Eindeutigkeit nur für aktive Categories, dazu
  das Angebot, eine gelöschte Category wiederherzustellen.
  - Vorschlag für den API-Vertrag: `POST /categories` und
    `PUT /categories/<id>` antworten bei einem gelöschten Namenstreffer mit
    `409` und `{ error, deletedCategory: { id, name, deletedAt } }`; mit
    `ignoreDeletedCategory: true` im Body wird trotzdem angelegt bzw.
    umbenannt. Wiederherstellen über `POST /categories/<id>/restore`. So
    liegt die Prüfung im Backend (ADR 0010) und gilt für jeden Client.
  - Wiederherstellen bringt die alte Category mit ihrer ID zurück.
    Transaktionen, Budgets und Fixkosten, die noch auf sie zeigen, hängen
    damit wieder an einer aktiven Category.
  - Umbenennen auf den Namen einer gelöschten Category ist erlaubt, aber
    erst nach einer Warnung mit Bestätigung; Wiederherstellen wird beim
    Umbenennen nicht angeboten.
  - Verwandt: Ticket 06 (Validierung von Category-IDs bei Transaktionen).
