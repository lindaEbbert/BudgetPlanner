# 05: Manueller Vorschlag per Button (belegtes Feld, inkl. Bearbeiten)

**What to build:** Ein Button neben dem Category-Feld ruft den Vorschlag
gezielt ab, wenn das Feld bereits belegt ist (z. B. beim Bearbeiten, oder
nach einer Fixkosten-Zuordnung). Das Ergebnis wird zur Bestätigung
angezeigt, bevor es das bestehende Feld überschreibt.

**Blocked by:** 03, 04

**Status:** ready-for-agent

- [ ] Button ist im Anlegen- und im Bearbeiten-Formular verfügbar
- [ ] Button ist deaktiviert, solange eine Fixkosten-Zuordnung gesetzt ist
- [ ] Klick ruft den Vorschlag unabhängig vom aktuellen Zustand des
      Category-Felds ab
- [ ] Ergebnis wird zur Bestätigung angezeigt statt das Feld direkt zu
      überschreiben (sowohl bei Treffer als auch bei
      `new_category_name`-Vorschlag)
- [ ] Accept übernimmt die vorgeschlagene bzw. neu angelegte Category;
      Reject lässt das Feld unverändert
- [ ] Verhalten ist im Bearbeiten-Formular identisch zum Anlegen-Formular
