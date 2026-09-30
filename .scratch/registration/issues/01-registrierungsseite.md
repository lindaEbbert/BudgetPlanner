# 01: Registrierungsseite im Frontend

**What to build:** Neue Nutzer können sich heute nur über die API
(`POST /auth/register`) ein Konto anlegen; das Frontend hat nur die
Login-Seite. Künftig gibt es unter `/register` eine eigene Seite, auf der man
sich mit Name, E-Mail und Passwort registriert und danach direkt eingeloggt
auf dem Dashboard landet.

Das Backend bleibt unverändert: `POST /auth/register` erwartet
`{ email, name, password }`, antwortet mit `201` bei Erfolg, `400` bei
fehlenden Feldern und `409` mit `{ error: "E-Mail bereits vergeben" }`, wenn
die E-Mail schon existiert. Einen Token liefert der Endpoint nicht, deshalb
meldet das Frontend den Nutzer anschließend über `POST /auth/login` an.

**Blocked by:** None (can start immediately)

**Status:** done

## Acceptance criteria

- [x] Route `/register` ist ohne Login erreichbar (wie `/login`, außerhalb
      des `authGuard`) und lädt die Komponente lazy
- [x] Das Formular hat die Felder Name, E-Mail, Passwort und „Passwort
      wiederholen“ (Reactive Forms, Angular Material, Aufbau und Stil wie die
      Login-Seite)
- [x] Validierung mit sichtbaren Fehlermeldungen: alle Felder Pflicht,
      E-Mail im gültigen Format, Passwort mindestens 6 Zeichen (dieselbe
      Grenze wie beim Login, sonst könnte man ein Konto anlegen, mit dem man
      sich im Frontend nicht anmelden kann)
- [x] Stimmen Passwort und Wiederholung nicht überein, erscheint eine
      Fehlermeldung am Wiederholungsfeld und das Formular lässt sich nicht
      absenden
- [x] Während der Anfrage ist der Absenden-Button deaktiviert und zeigt
      einen Spinner
- [x] Nach erfolgreicher Registrierung meldet das Frontend den Nutzer mit
      denselben Zugangsdaten an, speichert den Token wie beim Login und leitet
      zum Dashboard weiter
- [x] Bei `409` erscheint die Meldung aus der API („E-Mail bereits
      vergeben“); bei anderen Fehlern eine allgemeine Meldung
      („Registrierung fehlgeschlagen“). Die Eingaben bleiben erhalten
- [x] Klappt die Registrierung, aber das anschließende Login nicht, landet
      der Nutzer auf `/login` statt auf einer Fehlermeldung, die ein
      erneutes Registrieren nahelegt (das Konto existiert ja bereits)
- [x] Die Login-Seite verlinkt auf `/register` („Noch kein Konto?
      Registrieren“) und die Registrierungsseite zurück auf `/login`
- [x] `AuthService` bekommt eine Methode `register(...)`; der
      Registrierungsaufruf läuft nicht direkt über `HttpClient` in der
      Komponente
- [x] Barrierefreiheit wie in `frontend/AGENTS.md` gefordert: Labels an allen
      Feldern, Fehlermeldungen per `mat-error`, API-Fehler für Screenreader
      angekündigt (z. B. `role="alert"`)
- [x] Unit-Tests für die Komponente und `AuthService.register`: Passwort-
      Abgleich, erfolgreicher Ablauf inkl. Login und Weiterleitung, Anzeige
      der 409-Meldung

## Out of scope

- Änderungen am Backend (z. B. Passwortregeln serverseitig prüfen oder den
  Token direkt aus `/auth/register` liefern)
- E-Mail-Bestätigung, Passwort-Stärke-Anzeige
- Umleitung bereits eingeloggter Nutzer weg von `/login` bzw. `/register`

## Comments

- 2026-09-24: Umgesetzt in `features/auth/register/`. Der Passwort-Abgleich
  sitzt als Validator am Wiederholungsfeld und wird bei jeder Änderung des
  Passworts neu geprüft. Die Fehlerfarbe ist `#d32f2f` statt `#f44336` wie
  auf der Login-Seite, weil `#f44336` auf Weiß bei 13px den WCAG-AA-Kontrast
  (4.5:1) knapp verfehlt.
