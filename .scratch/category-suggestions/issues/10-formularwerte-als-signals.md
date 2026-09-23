# 10: Formularwerte des Transaktionsformulars als Signals

**What to build:** Das `TransactionFormComponent` liest seine Formularwerte
überall über `form.getRawValue()`. Die daraus abgeleiteten Zustände
(`canSuggestCategory()`, `categoryIsEditable()`,
`categoryIsOpenForSuggestion()`, `hasOpenOffer()`) sind deshalb Methoden, die
das Template bei jeder Change Detection erneut aufruft, statt `computed()`.
`frontend/AGENTS.md` verlangt „Use `computed()` for derived state“, und
[ADR 0008](../../../docs/adr/0008-frontend-state-signals-rxjs-no-ngrx.md)
legt Signals als Frontend-State fest.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Die Formularwerte, von denen das Template abhängt, liegen als Signal vor
      (z. B. `toSignal(form.valueChanges)` mit Startwert)
- [ ] Die abgeleiteten Zustände sind `computed()` statt Methoden
- [ ] Geprüft, ob die `valueChanges`-Subscriptions im Konstruktor dadurch
      entfallen oder bleiben
- [ ] Die Tests zu [Ticket 04](04-auto-vorschlag-leeres-feld.md) und
      [Ticket 05](05-manueller-vorschlag-button.md) laufen unverändert weiter
      (sie prüfen nur äußeres Verhalten)

## Comments

- 2026-09-23: Angelegt beim Review zu
  [Ticket 05](05-manueller-vorschlag-button.md). Kein Fehlverhalten: Die
  Methoden werden ausgewertet, weil jede Nutzereingabe im Dialog ohnehin eine
  Change Detection auslöst. Es geht um die Konvention und darum, dass das
  Template nicht mehr von einem Zeitpunkt abhängt.
