# 09: Unbekannte Category-ID aus dem automatischen Vorschlag abfangen

**What to build:** Liefert der Vorschlag eine `categoryId`, die nicht zu den
im Formular geladenen Categories gehört, schreibt der automatische Vorschlag
sie heute ungeprüft ins Category-Feld. Das Select zeigt dann nichts an,
während das Formular einen Wert hält — und genau der wird beim Speichern
mitgeschickt. Der Button-Pfad aus
[Ticket 05](05-manueller-vorschlag-button.md) löst die ID bereits gegen die
geladene Liste auf und behandelt eine unbekannte ID als „kein Vorschlag“.
Beide Auslöser sollen sich gleich verhalten.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Der automatische Vorschlag übernimmt eine `categoryId` nur, wenn sie zu
      einer geladenen Category gehört
- [ ] Eine unbekannte ID lässt das Feld unverändert, statt es halb zu füllen
- [ ] Test deckt eine unbekannte ID im automatischen Pfad ab, analog zum
      bestehenden Test für den Button-Pfad
- [ ] Entschieden, ob die Categories vor dem Auflösen neu geladen werden oder
      die beim Öffnen des Formulars geladene Liste genügt

## Comments

- 2026-09-23: Angelegt beim Review zu
  [Ticket 05](05-manueller-vorschlag-button.md). Bestand aus
  [Ticket 04](04-auto-vorschlag-leeres-feld.md); dort nicht aufgefallen, weil
  der Service die Kategorienamen case-insensitiv auf IDs auflöst (siehe
  [Ticket 03](03-backend-suggestion-service.md)) und darum im Normalfall nur
  bekannte IDs liefert. Auseinanderlaufen können die beiden Listen trotzdem:
  Das Formular lädt die Categories einmal beim Öffnen, der Service liest sie
  pro Anfrage frisch aus der Datenbank.
