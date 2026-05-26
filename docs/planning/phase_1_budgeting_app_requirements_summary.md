# Budgeting App – Phase 1 Requirements & Discovery

## Projektkontext

Ziel ist die Entwicklung einer lokalen Web-Anwendung zur Verwaltung persönlicher Finanzen.

Technologie-Stack:
- Backend: Python + Flask
- Frontend: TypeScript + Angular
- Datenbank: PostgreSQL

Die Anwendung dient gleichzeitig:
- als Lernprojekt
- als Portfolio-/Bewerbungsprojekt
- zum Vertiefen von Angular, TypeScript und PostgreSQL

---

# 1. Ziel der Anwendung

Die Anwendung soll folgende Kernprobleme lösen:

## Hauptziele

1. Persönliche Einnahmen und Ausgaben tracken
2. Monatliche Budgets verwalten
3. Sparziele verfolgen
4. Finanzstatus übersichtlich visualisieren
5. Wiederkehrende Fixkosten intelligent verwalten

---

# 2. Besondere fachliche Anforderungen

## Budgetreste in Sparziele übertragen

Nicht verbrauchte Beträge aus Budgets sollen in Sparziele übertragen werden können.

Beispiel:
- Budget "Freizeit": 150€
- Tatsächlich verbraucht: 100€
- Rest: 50€
- Übertragung auf Sparziel "Urlaub"

---

## Rücklagenberechnung für Fixkosten

Die Anwendung soll Fixkosten mit unterschiedlichen Frequenzen unterstützen.

Beispiele:
- monatlich
- quartalsweise
- jährlich

Die App soll automatisch berechnen:
- wie viel Geld aktuell für eine Fixkostenposition zurückgelegt sein sollte
- wie viel monatlich angespart werden muss
- ob die Rücklage ausreichend gedeckt ist

### Beispiel

```text
KFZ Versicherung
600€ jährlich
Nächste Abbuchung in 8 Monaten

=> aktuell sollten ca. 400€ zurückgelegt sein
=> monatlich noch 25€ sparen
```

Dieser Bereich stellt die wichtigste fachliche Besonderheit der Anwendung dar.

---

# 3. Zielgruppe

## Initialer Scope

Die Anwendung wird zunächst nur von einem einzelnen Benutzer verwendet.

## Zukunftsperspektive

Später soll die Anwendung:
- mehrere Benutzer unterstützen
- Login-Funktionalität besitzen
- auf einem lokalen Rechner für mehrere Nutzer verwendbar sein

Die Architektur soll daher grundsätzlich multi-user-fähig vorbereitet werden.

---

# 4. Datenerfassung

## MVP

Die Dateneingabe erfolgt zunächst ausschließlich manuell.

Folgende Datenarten sollen erfasst werden:
- fixe Einnahmen
- variable Einnahmen
- fixe Ausgaben
- variable Ausgaben

---

## Zukunftsidee

Später könnte eine lokale KI zur Verarbeitung von Kontoübersichten integriert werden.

Beispiele:
- automatische Kategorisierung
- Erkennung wiederkehrender Buchungen
- Import von Kontoauszügen

Dies gehört jedoch nicht zum MVP.

---

# 5. Kern-Domänenobjekte

Im Rahmen der ersten Analyse wurden folgende zentrale fachliche Objekte identifiziert.

## Transaction

Repräsentiert tatsächliche Geldbewegungen.

Beispiele:
- Gehalt
- Einkauf
- Streaming-Abo

Mögliche Attribute:
- Betrag
- Datum
- Kategorie
- Typ (income/expense)
- Konto

---

## Budget

Monatliche Ausgabenlimits pro Kategorie.

Beispiele:
- Essen
- Freizeit
- Wohnen

Mögliche Attribute:
- Kategorie
- Monatslimit
- aktueller Verbrauch
- Restbetrag

---

## Savings Goal

Sparziele mit Fortschritt.

Beispiele:
- Urlaub
- Notgroschen
- Hardware

Mögliche Attribute:
- Zielbetrag
- aktueller Betrag
- Fortschritt

---

## Fixed Cost / Recurring Expense

Wiederkehrende Fixkosten mit unterschiedlichen Frequenzen.

Beispiele:
- Miete
- Versicherung
- Rundfunkbeitrag

Mögliche Attribute:
- Betrag
- Frequenz
- nächste Fälligkeit
- benötigte Rücklage
- monatlicher Rücklagenbetrag

---

# 6. Dashboard-Anforderungen

Folgende Informationen sollen direkt sichtbar sein:

- aktueller Kontostand
- verbleibende Budgetbeträge
- Status/Fortschritt der Sparziele
- Rücklagenstatus für Fixkosten
- benötigte Rücklagen für zukünftige Abbuchungen

---

# 7. Budgeting-Komplexität

Das Budgeting-System soll bewusst einfach gehalten werden.

## Gewählter Ansatz

Monatliche Budgets pro Kategorie.

Beispiel:

```text
Essen → 400€
Freizeit → 150€
```

Nicht Teil des MVP:
- Envelope-Systeme
- komplexe Budget-Hierarchien
- Rollovers
- automatische Forecasts

---

# 8. Plattform & Deployment

## Zielplattform

- lokale Web-Anwendung
- Nutzung im Browser
- Betrieb auf einem einzelnen Rechner

## Kein Fokus im MVP

- Cloud-Deployment
- Mobile Apps
- Offline-Synchronisierung
- PWA-Funktionalität

Responsive Design kann später ergänzt werden.

---

# 9. Technische Ziele / Lernziele

Besonderer Fokus liegt auf:
- TypeScript
- Angular
- PostgreSQL

Zusätzlich relevant:
- REST APIs
- saubere Architektur
- Backend/Frontend-Trennung
- relationale Datenmodellierung
- State Management

---

# 10. Vorläufiger MVP-Scope

## Enthalten

- Login/Auth
- Kontoverwaltung
- Transaktionen erfassen
- Kategorien verwalten
- monatliche Budgets
- Sparziele
- Fixkostenverwaltung
- Rücklagenberechnung
- Dashboard

---

## Nicht im MVP

- Bank APIs
- CSV-Import
- KI-Funktionen
- automatische Kategorisierung
- Multi-User-Betrieb
- Push Notifications
- Forecasting
- Multi-Currency
- Echtzeit-Updates
- komplexes Rollenmodell

---

# 11. Erste Architektur-Empfehlung

## Backend

Empfohlener Stack:
- Flask
- SQLAlchemy
- Flask-JWT-Extended
- Alembic
- Marshmallow oder Pydantic

### Architekturprinzip

Business-Logik soll im Backend liegen.

Das Backend verantwortet:
- Budgetberechnungen
- Rücklagenlogik
- Validierung
- Konsistenz
- Regeln

---

## Frontend

Empfohlener Stack:
- Angular
- TypeScript
- Angular Material
- Reactive Forms
- Standalone Components

Das Frontend verantwortet primär:
- Darstellung
- Benutzerinteraktion
- Formularvalidierung
- State Management

---

## Datenbank

PostgreSQL wird als relationale Hauptdatenbank verwendet.

Vorteile:
- starke relationale Modellierung
- Constraints
- gute Query-Möglichkeiten
- geeignet für finanzielle Daten

---

# 12. Nächster Schritt – Phase 2

In Phase 2 werden modelliert:

1. Fachliche Prozesse
2. Entity-Beziehungen
3. Datenmodell / ERD
4. API-Design
5. Backend-Schichten
6. Angular-Struktur
7. Entwicklungs-Roadmap

