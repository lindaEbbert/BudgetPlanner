# 02: Fixkosten-Zuordnung befüllt Category automatisch

**What to build:** Wählt der Nutzer im Transaktionsformular (Anlegen oder
Bearbeiten) eine Fixkosten-Zuordnung, wird die Category automatisch aus der
Category der Fixed Cost übernommen — wie heute schon der Betrag —, bleibt
aber weiterhin manuell änderbar.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Wählt der Nutzer eine Fixkosten-Zuordnung mit hinterlegter Category,
      wird das Category-Feld automatisch auf diese Category gesetzt
- [x] Der Nutzer kann die automatisch gesetzte Category danach weiterhin
      manuell ändern
- [x] Hat die gewählte Fixed Cost keine Category hinterlegt, bleibt das
      Category-Feld unverändert
- [x] Verhalten ist im Anlegen- und im Bearbeiten-Formular identisch

## Comments

- 2026-09-17: Abgeschlossen. Umgesetzt in `7d61930`: Der bestehende
  `fixedCostId`-Listener im `TransactionFormComponent` setzt neben dem Betrag
  auch `categoryId`, sofern die Fixed Cost eine Category hat. Nacharbeiten
  aus dem Code-Review:
  - `14856ff`: Der Test für "manuell änderbar" wählt jetzt über
    `MatSelectHarness` im Dropdown; nach jedem Test prüft
    `HttpTestingController.verify()` auf unerwartete Requests; Testdaten
    `rentPayment` → `rentTransaction` (Glossar).
  - `84f686b`: `form.get('…')?` durch typisierte `form.controls.…` ersetzt.
  - `b3cf753`: Listener mit Guard Clause statt verschachtelter `if`s.
  - Bewusst beibehalten: erwartete Category-IDs als String-Literale in den
    Tests.
  - Bekannte Lücke: Zeigt die Fixed Cost auf eine soft-gelöschte Category,
    wird deren ID gesetzt; das Feld wirkt leer, besteht aber die
    `required`-Prüfung. Das Backend soll solche IDs künftig ablehnen, siehe
    Ticket 06; ein Frontend-Schutz wurde bewusst nicht umgesetzt.
