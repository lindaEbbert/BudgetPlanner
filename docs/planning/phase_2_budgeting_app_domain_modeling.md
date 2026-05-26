# Budgeting App – Phase 2 Domain Modeling

## Ziel von Phase 2

In Phase 2 wurde die fachliche Modellierung der Anwendung konkretisiert.

Fokus:
- fachliche Regeln
- zentrale Domänenobjekte
- Geldflussmodell
- Verantwortlichkeiten
- Kernprozesse

Noch ohne technische Implementierungsdetails.

---

# 1. Grundlegendes Finanzmodell

Während der Modellierung wurde deutlich, dass die Anwendung keine klassische Banking-App ist.

Die App dient primär:
- der Finanzplanung
- der Budgetverwaltung
- der Rücklagenbildung
- der logischen Aufteilung von Geld

Die Anwendung soll nicht mehrere reale Bankkonten abbilden, sondern:
- einen realen Gesamtbetrag verwalten
- virtuelle Geldtöpfe darstellen
- Verfügbarkeiten und Reservierungen berechnen

---

# 2. Zentrales Domänenkonzept

Die Anwendung basiert auf:

## Einem realen Hauptbetrag

Beispiel:

```text
4200€ Kontostand
```

Und mehreren virtuellen Reservierungen:
- Budgets
- Sparziele
- Fixkostenrücklagen

---

# 3. Geldmodell

## Real Balance

Der tatsächliche Geldbestand.

Beispiel:

```text
4200€
```

---

## Allocated Money

Logisch reserviertes Geld.

Beispiele:

```text
Urlaub: 500€
Gaming PC: 300€
Versicherung: 250€
```

---

## Freely Available Money

Tatsächlich frei verfügbares Geld.

Berechnung:

```text
Real Balance
- reserviertes Geld
= frei verfügbarer Betrag
```

Diese Kennzahl wurde als zentrale Kennzahl der Anwendung identifiziert.

---

# 4. Kontenmodell

## Entscheidung

Es werden zunächst keine echten Mehrfach-Konten unterstützt.

Stattdessen:
- ein Hauptkonto
- virtuelle Unterteilungen

Dies reduziert die Komplexität erheblich und passt besser zum gewünschten Finanzmodell.

---

# 5. Budgets

## Modell

Ein Budget repräsentiert:
- ein monatliches Ausgabenlimit
- pro Kategorie

Beispiele:

```text
Food → 400€
Entertainment → 150€
```

---

## Wichtige Regel

Budgets speichern nur:
- das Limit

Der Verbrauch wird automatisch aus Transaktionen berechnet.

Beispiel:

```text
Transaction:
-42€
Kategorie: Food

=> reduziert automatisch das Food-Budget
```

Budgets werden daher nicht manuell „verbraucht“.

---

# 6. Kategorien

## Entscheidung

Kategorien werden vom Benutzer erstellt.

---

## Zweck

Kategorien dienen für:
- Budgetzuordnung
- Filterung
- Statistiken
- Diagramme
- Auswertungen

---

# 7. Sparziele

## Modell

Sparziele sind virtuelle Geldtöpfe.

Beispiele:
- Urlaub
- Notgroschen
- Hardware

---

## Eigenschaften

Sparziele besitzen:
- Zielbetrag
- reservierten Betrag
- Fortschritt

---

## Wichtige Entscheidung

Sparziele werden zunächst nicht als echte Konten modelliert.

Die App zeigt lediglich:
- wie viel Geld logisch reserviert wurde
- wie sich das Geld zusammensetzt

---

# 8. Fixed Costs / Wiederkehrende Kosten

## Zentrale Besonderheit der Anwendung

Fixed Costs stellen die wichtigste fachliche Besonderheit der Anwendung dar.

Die Anwendung soll zukünftige Verpflichtungen planen und Rücklagen berechnen.

---

## Beispiele

```text
Netflix → monatlich
KFZ Versicherung → jährlich
GEZ → quartalsweise
```

---

# 9. Modellierungsentscheidung für Fixed Costs

## Gewählter Ansatz

Fixed Costs werden als eigenständige Planungsobjekte modelliert.

Nicht als normale Transactions.

---

## Beispiel

```text
name: Car Insurance
amount: 600€
frequency: yearly
next_due_date: 2026-12-01
```

---

# 10. Berechnungen für Fixed Costs

Die Anwendung soll automatisch berechnen:

## Required Reserve

Wie viel aktuell bereits zurückgelegt sein sollte.

---

## Monthly Contribution

Wie viel monatlich zurückgelegt werden muss.

---

## Coverage Status

Ob die Rücklage ausreichend gedeckt ist.

Beispiel:

```text
OK
WARNING
INSUFFICIENT
```

---

# 11. Preisänderungen bei Fixed Costs

Fixed Costs können sich zukünftig ändern.

Beispiele:
- Preiserhöhung bei Abos
- Versicherungsanpassungen

---

## Wichtige Regel

Änderungen dürfen historische Transaktionen nicht verändern.

Neue Werte gelten nur für zukünftige Berechnungen.

---

# 12. Startkapital

## Entscheidung

Das Startkapital wird nicht separat gespeichert.

Stattdessen wird eine spezielle Initial-Transaction verwendet.

Beispiel:

```text
INITIAL_BALANCE
4000€
```

---

## Vorteil

Dadurch bleibt:
- der Kontostand vollständig berechenbar
- die Historie nachvollziehbar
- das Datenmodell konsistent

---

# 13. Kern-Entities

## Transaction

Reale Geldbewegung.

Mögliche Felder:

```text
id
amount
type
category_id
date
description
```

---

## Category

Benutzerdefinierte Kategorien.

Mögliche Felder:

```text
id
name
type
color
```

---

## Budget

Monatliches Budget pro Kategorie.

Mögliche Felder:

```text
id
category_id
month
limit_amount
```

Verbrauch wird berechnet.

---

## SavingsGoal

Virtueller Geldtopf.

Mögliche Felder:

```text
id
name
target_amount
allocated_amount
```

---

## FixedCost

Planungsobjekt für wiederkehrende Kosten.

Mögliche Felder:

```text
id
name
amount
frequency
next_due_date
category_id
is_active
```

---

# 14. Allocation-Konzept

## Problemstellung

Die Anwendung soll ermöglichen:
- Budgetreste zu übertragen
- Sparziele aufzufüllen
- Geld logisch zu reservieren

Dies sind keine echten Banktransaktionen.

---

# 15. Allocation-Entity

Es wurde entschieden, eine separate Allocation-Entity zu verwenden.

---

## Beispiel

```text
50€
von: Freizeit-Budgetrest
nach: Sparziel Urlaub
```

---

## Vorteil

Dies ermöglicht:
- Historisierung
- Nachvollziehbarkeit
- saubere Domänentrennung
- bessere fachliche Modellierung

---

# 16. Monatsabschluss-Prozess

Ein zentraler fachlicher Prozess ist der Monatsabschluss.

---

## Ablauf

```text
Monat endet
→ Budgetreste berechnen
→ Benutzer entscheidet:
   - frei lassen
   - Sparziel zuweisen
→ Allocation speichern
```

---

## Entscheidung

Die Übertragung erfolgt zunächst manuell.

Die App soll primär informieren und unterstützen.

Keine automatische Umbuchung im MVP.

---

# 17. Kernprozesse der Anwendung

## Transaction erfassen

```text
User erstellt Transaction
→ Kategorie wählen
→ speichern
→ Budget aktualisiert sich automatisch
→ Dashboard aktualisiert sich
```

---

## Budget überwachen

```text
Transactions summieren
→ gegen Budgetlimit prüfen
→ Restbetrag berechnen
```

---

## Sparziel besparen

```text
Benutzer reserviert Geld
→ SavingsGoal erhöht sich
```

---

## Budgetreste übertragen

```text
Restbetrag ermitteln
→ Sparziel auswählen
→ Allocation speichern
```

---

## Rücklagen berechnen

```text
FixedCost analysieren
→ benötigte Rücklage berechnen
→ monatliche Rücklage berechnen
→ Status bestimmen
```

---

# 18. Architektur-Relevante Erkenntnisse

## Fachliche Trennung

Es existieren zwei unterschiedliche Konzepte:

### Reale Geldbewegungen

Transactions.

---

### Logische Geldreservierungen

Allocations.

---

## Vorteil

Diese Trennung verbessert:
- Nachvollziehbarkeit
- Datenkonsistenz
- Erweiterbarkeit
- Wartbarkeit

---

# 19. Vorläufige Architektur-Richtung

Die Anwendung entwickelt sich in Richtung:

## Personal Finance Allocation System

Mit Fokus auf:
- Budgetierung
- Rücklagenbildung
- Finanzplanung
- Geldreservierung
- Transparenz über verfügbare Mittel

