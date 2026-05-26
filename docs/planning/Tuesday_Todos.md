# 🗓️ Dienstag 26.5. — Vollständiger Schlachtplan

## Tagesübersicht

| Block | Zeit | Thema | Ziel |
|-------|------|-------|------|
| 1 | ~2h | Backend Auth (JWT) | Login-Endpoint läuft, JWT kommt zurück |
| 2 | ~1.5h | Angular initialisieren | `ng serve` öffnet die App im Browser |
| 3 | ~1h | Angular Struktur + Models + BaseService | Alle Ordner & Interfaces vorhanden |
| 4 | ~2.5h | Angular Auth + Layout | Login-Seite funktioniert, Layout steht |
| 5 | ~1h | Backend Repository Layer | BaseRepository + 2 Repositories |

---

## 🟥 BLOCK 1 — Backend Auth (ca. 2h)

### Schritt 1.1 — Dependencies installieren

> 💡 **Warum?**
> Wir brauchen drei neue Pakete:
> - `flask-jwt-extended` — kümmert sich um das Erstellen und Validieren von JWT-Tokens. Ohne das würdest du Token-Logik selbst schreiben müssen.
> - `flask-bcrypt` — hasht Passwörter sicher. **Passwörter dürfen niemals im Klartext gespeichert werden.** Bcrypt ist absichtlich langsam, um Brute-Force-Angriffe zu erschweren.
> - `flask-cors` — dein Angular-Frontend läuft auf Port 4200, dein Backend auf Port 5000. Browser blockieren standardmäßig solche "Cross-Origin"-Anfragen. Flask-CORS sagt dem Browser: "Das ist OK."
>
> `pip freeze > requirements.txt` speichert die exakten Versionen aller installierten Pakete — wie eine `package-lock.json` in Node. Jeder, der das Projekt klont, installiert damit dieselben Versionen.

Terminal im `backend/` Ordner:

- [x] `.venv\Scripts\activate` ausführen
- [x] `pip install flask-jwt-extended flask-bcrypt flask-cors` ausführen
- [x] `pip freeze > requirements.txt`

```bash
.venv\Scripts\activate
pip install flask-jwt-extended flask-bcrypt flask-cors
pip freeze > requirements.txt
```

---

### Schritt 1.2 — `.env` ergänzen

> 💡 **Warum?**
> Der `JWT_SECRET_KEY` ist der geheime Schlüssel, mit dem dein Server Tokens **signiert**. Wer diesen Key kennt, kann beliebige Tokens fälschen und sich als jeder User ausgeben. Deshalb gehört er niemals in den Code — sondern in eine `.env`-Datei, die in `.gitignore` steht und nie ins Repository kommt. Das ist Sicherheits-Grundprinzip Nummer 1.

- [ ] `JWT_SECRET_KEY` in `backend/.env` eintragen

```
JWT_SECRET_KEY=budget-planner-secret-2026-change-in-prod
```

---

### Schritt 1.3 — `auth_service.py` erstellen

> 💡 **Warum?**
> Das ist der **Service Layer**. Services enthalten die Businesslogik — hier: "Wie registriert man einen User? Wie loggt man sich ein?" Der Service kennt die Datenbank und die Models, weiß aber nichts von HTTP, JSON oder Request-Objekten.
>
> Diese Trennung ist wichtig: Der Service ist dadurch testbar (du kannst ihn unabhängig vom Web-Framework testen) und wiederverwendbar (mehrere Controller könnten denselben Service nutzen).
>
> Das Muster `return user, None` / `return None, "Fehlermeldung"` ist ein Python-Idiom für "Entweder Ergebnis oder Fehler" — ohne Exception-Handling im Aufrufenden zu erzwingen.

- [ ] Neue Datei anlegen: `backend/src/app/services/auth_service.py`

```python
import uuid
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token
from datetime import timedelta
from src.app.db import db
from src.app.models.user import User

bcrypt = Bcrypt()


def hash_password(password: str) -> str:
    return bcrypt.generate_password_hash(password).decode('utf-8')


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.check_password_hash(hashed, password)


def register_user(email: str, name: str, password: str):
    if User.query.filter_by(email=email).first():
        return None, "E-Mail bereits vergeben"

    user = User(
        id=uuid.uuid4(),
        name=name,
        email=email,
        hashed_password=hash_password(password)
    )
    db.session.add(user)
    db.session.commit()
    return user, None


def login_user(email: str, password: str):
    user = User.query.filter_by(email=email).first()
    if not user or not verify_password(password, user.hashed_password):
        return None, "Ungültige Anmeldedaten"

    token = create_access_token(
        identity=str(user.id),
        expires_delta=timedelta(days=7)
    )
    return token, None
```

---

### Schritt 1.4 — `auth_controller.py` erstellen

> 💡 **Warum?**
> Der **Controller** ist das Bindeglied zwischen HTTP und deiner Businesslogik. Er empfängt den Request, zieht die Daten heraus, ruft den Service auf und verpackt das Ergebnis als HTTP-Response.
>
> Ein Flask **Blueprint** ist wie eine Mini-App innerhalb der App — eine Gruppe zusammengehöriger Routes mit eigenem Prefix. `url_prefix='/auth'` bedeutet, alle Routes hier bekommen automatisch `/auth/` vorangestellt.
>
> Die HTTP-Statuscodes sind nicht optional — sie sind der Vertrag zwischen Backend und Frontend:
> - `400` = Schlechte Anfrage (fehlende Felder)
> - `401` = Nicht autorisiert (falsches Passwort)
> - `409` = Konflikt (E-Mail existiert bereits)
> - `201` = Erstellt
>
> Wenn du immer nur `200` zurückgibst, weiß das Frontend nicht, was schiefgelaufen ist.

- [ ] Neue Datei anlegen: `backend/src/app/controller/auth_controller.py`

```python
from flask import Blueprint, request, jsonify
from src.app.services import auth_service

auth_blueprint = Blueprint('auth', __name__, url_prefix='/auth')


@auth_blueprint.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    name = data.get('name')
    password = data.get('password')

    if not email or not name or not password:
        return jsonify({'error': 'Alle Felder erforderlich'}), 400

    user, error = auth_service.register_user(email, name, password)
    if error:
        return jsonify({'error': error}), 409

    return jsonify({'message': 'Benutzer erstellt', 'id': str(user.id)}), 201


@auth_blueprint.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'E-Mail und Passwort erforderlich'}), 400

    token, error = auth_service.login_user(email, password)
    if error:
        return jsonify({'error': error}), 401

    return jsonify({'access_token': token}), 200
```

---

### Schritt 1.5 — `main.py` aktualisieren

> 💡 **Warum?**
> Hier registrieren wir alles, was die Flask-App wissen muss:
> - `JWTManager(app)` — aktiviert den `@jwt_required()`-Decorator auf geschützten Routes
> - `bcrypt.init_app(app)` — verbindet Bcrypt mit dem App-Kontext (Flask-Extensions brauchen das)
> - `CORS(app, origins=[...])` — erlaubt nur Anfragen von `localhost:4200` (unser Angular-Dev-Server) — nicht von irgendwo
> - `app.register_blueprint(auth_blueprint)` — hängt die neuen Auth-Routes in die App ein. Ohne diese Zeile existieren `/auth/login` und `/auth/register` nicht.

- [ ] `backend/src/app/main.py` komplett ersetzen

```python
from flask import Flask
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from src.app.db import db
from src.app.services.auth_service import bcrypt
from dotenv import load_dotenv
import os

from src.app.controller import user_controller
from src.app.controller.auth_controller import auth_blueprint
from src.app.models import *

load_dotenv()

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = (
    f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}"
    f"@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
)
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'dev-fallback-secret')

db.init_app(app)
JWTManager(app)
bcrypt.init_app(app)
CORS(app, origins=['http://localhost:4200'])

app.register_blueprint(user_controller.user_controller)
app.register_blueprint(auth_blueprint)


@app.route('/')
def hello_world():
    return 'Hello World!'


if __name__ == '__main__':
    app.run(debug=True)
```

---

### Schritt 1.6 — Backend starten & testen

> 💡 **Warum zuerst mit Postman testen?**
> Immer das Backend isoliert testen, **bevor** du das Frontend anschließt. Wenn später der Login im Browser nicht klappt und du den Backend-Test übersprungen hast, weißt du nicht, wo der Fehler liegt — im Frontend oder im Backend? Teste Backend separat → dann weißt du: wenn das Frontend nicht klappt, liegt es am Frontend.

- [ ] Backend starten: `python -m flask --app src/app/main.py run`
- [ ] `POST /auth/register` testen → 201 kommt zurück
- [ ] `POST /auth/login` testen → JWT Token kommt zurück

```
POST http://localhost:5000/auth/register
Body: { "email": "linda@test.com", "name": "Linda", "password": "test1234" }
→ Erwartet: 201 { "id": "...", "message": "Benutzer erstellt" }

POST http://localhost:5000/auth/login
Body: { "email": "linda@test.com", "password": "test1234" }
→ Erwartet: 200 { "access_token": "eyJ..." }
```

✅ **Block 1 fertig wenn:** JWT Token kommt zurück.

---

## 🟧 BLOCK 2 — Angular initialisieren (ca. 1.5h)

### Schritt 2.1 — Angular CLI prüfen / installieren

> 💡 **Warum Angular CLI?**
> Die Angular CLI (`ng`) ist das offizielle Kommandozeilen-Werkzeug für Angular. Sie erledigt für dich: TypeScript-Kompilierung, Webpack-Konfiguration, Code-Generierung (`ng generate`), Dev-Server (`ng serve`), Build-Optimierung (`ng build`). Ohne CLI würdest du das alles selbst konfigurieren — das kostet Tage.

- [ ] `ng version` ausführen — wenn nicht gefunden: `npm install -g @angular/cli`

```bash
ng version
# wenn nicht gefunden:
npm install -g @angular/cli
```

---

### Schritt 2.2 — Altes Frontend löschen

> 💡 **Warum?**
> Der bestehende `frontend/`-Ordner ist ein einfaches TypeScript-Projekt (nur `tsc` als Build-Tool, keine Angular-Pakete). Das ist kein Angular-Projekt — wir ersetzen es vollständig mit `ng new`.

- [ ] Alten `frontend/` Ordner löschen

```powershell
# PowerShell im BudgetPlanner/ Ordner
Remove-Item -Recurse -Force frontend
```

---

### Schritt 2.3 — Angular Projekt erstellen

> 💡 **Warum diese Flags?**
> - `--routing` → Die Angular CLI legt den Router sofort mit an. Der Router ist das Herzstück einer SPA (Single Page Application): er wechselt zwischen "Seiten" (Components), ohne den Browser neu zu laden.
> - `--style=scss` → SCSS ist CSS mit Variablen, Nesting und Mixins — Industriestandard. Angular Material (das wir gleich installieren) nutzt es ebenfalls.
>
> Angular 17+ erstellt standardmäßig **Standalone Components** — kein `NgModule`-Boilerplate mehr. Das ist das moderne Angular, das Interviewer sehen wollen.

- [ ] `ng new frontend` ausführen
- [ ] Bei "Server-Side Rendering?" → **No** wählen

```bash
# Im BudgetPlanner/ Ordner
ng new frontend --routing --style=scss
cd frontend
```

---

### Schritt 2.4 — Angular Material hinzufügen

> 💡 **Warum Angular Material?**
> Angular Material ist Googles offizielle Component-Library für Angular — professionelle, barrierefreie UI-Komponenten (Tables, Cards, Forms, Dialogs, Buttons, Sidebars). Für ein Interview-Projekt bedeutet das: Du verbringst keine Zeit damit, Buttons zu stylen, sondern zeigst echte Architektur und Logik. Das ist, was zählt.

- [ ] `ng add @angular/material` ausführen
- [ ] Theme wählen (z.B. **Azure/Blue**)
- [ ] Typography → **Yes**, Animations → **Yes**

```bash
ng add @angular/material
```

---

### Schritt 2.5 — Environments einrichten

> 💡 **Warum Environment-Files?**
> Deine App läuft in verschiedenen Kontexten: lokal auf `localhost:5000`, später vielleicht auf einem Server mit einer anderen URL. Environment-Files lösen das sauber: Du definierst Konfiguration pro Umgebung, und Angular **tauscht die Datei beim Build automatisch aus**. Im Code greifst du immer auf `environment.apiBaseUrl` zu — Angular entscheidet, welche Datei das liefert.
>
> Das ist professioneller als `if (isDev)` überall im Code zu streuen.

- [ ] `ng generate environments` ausführen
- [ ] `environment.ts` auf Production-URL setzen
- [ ] `environment.development.ts` auf `http://localhost:5000` setzen

```bash
ng generate environments
```

**`src/environments/environment.ts`:**
```typescript
export const environment = {
  production: true,
  apiBaseUrl: 'http://your-production-api'
};
```

**`src/environments/environment.development.ts`:**
```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:5000'
};
```

---

### Schritt 2.6 — App testen

> 💡 **Warum direkt nach der Installation testen?**
> Wenn `ng serve` mit einem frischen Projekt schon nicht startet, liegt ein Installations- oder Versionsproblem vor. Besser jetzt erkennen als nach 2 Stunden eigenem Code drüber.

- [ ] `ng serve` starten → Browser öffnet `http://localhost:4200` ohne Fehler

```bash
ng serve
```

✅ **Block 2 fertig wenn:** `ng serve` läuft ohne Fehler.

---

## 🟨 BLOCK 3 — Angular Struktur + Typed Models + BaseService (ca. 1h)

### Schritt 3.1 — Ordnerstruktur anlegen

> 💡 **Warum diese drei Ordner?**
> Das ist die Standard-Konvention der Angular-Community — jeder erfahrene Angular-Entwickler erkennt sie sofort:
> - `core/` → Dinge, die **einmal** existieren und app-weit gelten: AuthService, HTTP-Interceptor, Route Guard, Layout. "Singleton"-Schicht.
> - `shared/` → Dinge, die **mehrfach wiederverwendet** werden: Models/Interfaces, generische UI-Komponenten.
> - `features/` → **Ein Ordner pro Feature** (auth, transactions, dashboard...). Jedes Feature ist in sich geschlossen — eigene Components, Services, Routes. Das nennt man "Feature Modules" bzw. heute "Feature Slices".
>
> Diese Trennung macht dein Projekt skalierbar: Wenn du ein neues Feature hinzufügst, weißt du genau wo es hingehört. Und ein Interviewer sieht auf den ersten Blick: Diese Entwicklerin kennt Angular.

- [ ] Alle Ordner anlegen

```powershell
# PowerShell im frontend/src/app/ Ordner
New-Item -ItemType Directory -Force -Path `
  core/services, core/interceptors, core/guards, core/layout, `
  shared/models, shared/components, `
  features/auth/login, `
  features/transactions, `
  features/categories, `
  features/dashboard, `
  features/budgets, `
  features/fixed-costs
```

---

### Schritt 3.2 — Typed Interfaces erstellen

> 💡 **Warum TypeScript Interfaces?**
> Das ist der Kernvorteil von TypeScript gegenüber JavaScript: Du definierst die **Form** deiner Daten. Wenn du auf `transaction.ammount` tippst (Tippfehler), sagt TypeScript sofort: "Das Feld existiert nicht" — noch bevor du die App startest. In JavaScript würde das lautlos `undefined` zurückgeben und später mysteriöse Bugs verursachen.
>
> **Warum separate DTOs?** Ein DTO (Data Transfer Object) beschreibt, was du an die API *schickst*. Das unterscheidet sich von dem, was du *empfängst*: `CreateTransactionDto` hat keine `id` oder `createdAt` — die generiert das Backend. Separate Typen verhindern, dass du versehentlich eine `id` mitschickst.
>
> **Warum `index.ts`?** Statt `import { Transaction } from '../../shared/models/transaction.model'` kannst du danach `import { Transaction } from '../../shared/models'` schreiben. Sauberer, kürzer, und du musst nicht wissen, in welcher Datei genau das Model liegt.

- [ ] `shared/models/user.model.ts` anlegen
- [ ] `shared/models/category.model.ts` anlegen
- [ ] `shared/models/transaction.model.ts` anlegen
- [ ] `shared/models/budget.model.ts` anlegen
- [ ] `shared/models/fixed-cost.model.ts` anlegen
- [ ] `shared/models/index.ts` anlegen

**`shared/models/user.model.ts`:**
```typescript
export interface User {
  id: string;
  name: string;
  email: string;
}
```

**`shared/models/category.model.ts`:**
```typescript
export type CategoryType = 'INCOME' | 'EXPENSE';

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: CategoryType;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateCategoryDto {
  name: string;
  type: CategoryType;
}
```

**`shared/models/transaction.model.ts`:**
```typescript
export type TransactionType = 'INCOME' | 'EXPENSE' | 'INITIAL';

export interface Transaction {
  id: string;
  userId: string;
  categoryId: string;
  fixedCostId?: string;
  name: string;
  amount: number;
  type: TransactionType;
  transactionDate: string;
  description?: string;
  isVoided: boolean;
  createdAt: string;
}

export interface CreateTransactionDto {
  name: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  transactionDate: string;
  description?: string;
}

export interface BalanceSummary {
  income: number;
  expenses: number;
  balance: number;
}
```

**`shared/models/budget.model.ts`:**
```typescript
export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  limitAmount: number;
  month: number;
  year: number;
  spent?: number;
  remaining?: number;
  percentage?: number;
}

export interface CreateBudgetDto {
  categoryId: string;
  limitAmount: number;
  month: number;
  year: number;
}
```

**`shared/models/fixed-cost.model.ts`:**
```typescript
export type IntervalUnit = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';

export interface FixedCost {
  id: string;
  userId: string;
  categoryId: string;
  name: string;
  description?: string;
  amount: number;
  intervalUnit: IntervalUnit;
  intervalValue: number;
  nextDueDate: string;
  isActive: boolean;
}
```

**`shared/models/index.ts`:**
```typescript
export * from './user.model';
export * from './category.model';
export * from './transaction.model';
export * from './budget.model';
export * from './fixed-cost.model';
```

---

### Schritt 3.3 — BaseApiService erstellen

> 💡 **Warum eine Basisklasse?**
> Die `baseUrl` und das `HttpClient`-Objekt braucht jeder Feature-Service (CategoryService, TransactionService, etc.). Anstatt das in jedem Service zu wiederholen, stecken wir es in eine Basisklasse. Feature-Services **erben** davon und haben sofort `this.baseUrl` und `this.http` zur Verfügung. Das ist das **DRY-Prinzip** (Don't Repeat Yourself) — eines der wichtigsten Prinzipien in der Softwareentwicklung.

- [ ] `core/services/api.service.ts` anlegen

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  protected readonly baseUrl = environment.apiBaseUrl;

  constructor(protected http: HttpClient) {}
}
```

✅ **Block 3 fertig wenn:** Alle Ordner existieren, alle `.model.ts` Dateien sind erstellt.

---

## 🟩 BLOCK 4 — Angular Auth + Layout (ca. 2.5h)

### Schritt 4.1 — AuthService erstellen

> 💡 **Warum ein AuthService?**
> In Angular machen **Components keine HTTP-Calls** — das ist Aufgabe von Services. Components sind für die Anzeige zuständig, Services für die Logik. Diese Trennung nennt sich "Separation of Concerns".
>
> **Warum `localStorage`?** Der JWT-Token muss einen Seiten-Reload überleben. `sessionStorage` würde beim Schließen des Tabs verschwinden. `localStorage` bleibt dauerhaft gespeichert.
>
> **Warum `Observable` statt `Promise`?** Angular baut auf RxJS und Observables. Sie sind mächtiger als Promises: abonnierbar, kombinierbar, abbrechbar. `tap()` ist ein RxJS-Operator für Seiteneffekte — er "schaut" auf den Wert vorbei (hier: Token speichern), ohne ihn zu verändern.

- [ ] `core/services/auth.service.ts` anlegen

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

interface LoginResponse {
  access_token: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'jwt_token';
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient, private router: Router) {}

  login(credentials: LoginDto): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/auth/login`, credentials)
      .pipe(tap(res => localStorage.setItem(this.TOKEN_KEY, res.access_token)));
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
```

---

### Schritt 4.2 — JWT Interceptor erstellen

> 💡 **Warum ein Interceptor?**
> Alle geschützten API-Calls brauchen den Header `Authorization: Bearer <token>`. Ohne Interceptor müsstest du diesen Header **in jedem einzelnen HTTP-Call** manuell setzen — das sind am Ende Dutzende Stellen im Code. Der Interceptor sitzt **zwischen Angular und dem Netzwerk** und ergänzt den Header automatisch bei jedem ausgehenden Request. Du schreibst das einmal, und es gilt überall. DRY-Prinzip in Aktion.
>
> `inject()` funktioniert hier anstelle von Constructor-Injection, weil wir uns in einer Funktion befinden, nicht in einer Klasse.

- [ ] `core/interceptors/jwt.interceptor.ts` anlegen

```typescript
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  if (token) {
    const authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
    return next(authReq);
  }

  return next(req);
};
```

---

### Schritt 4.3 — AuthGuard erstellen

> 💡 **Warum ein Guard?**
> Ohne Guard kann jeder User direkt `/dashboard` in die Adressleiste tippen und gelangt rein — egal ob er eingeloggt ist. Der Guard prüft **vor der Navigation**: "Ist der User eingeloggt?" Nein → Redirect auf `/login`. Ja → Navigation erlaubt.
>
> Das ist Client-seitiger Schutz. Das Backend schützt die Daten zusätzlich mit `@jwt_required()`. Beide Schichten sind nötig: der Guard für die UX, das Backend für die echte Sicherheit.

- [ ] `core/guards/auth.guard.ts` anlegen

```typescript
import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }
  return router.createUrlTree(['/login']);
};
```

---

### Schritt 4.4 — `app.config.ts` aktualisieren

> 💡 **Warum `app.config.ts`?**
> In Angular 17+ (Standalone-Architektur) gibt es keine `AppModule` mehr. Stattdessen konfigurierst du die App in `app.config.ts`. Hier sagst du Angular: "Welche Dienste stehen app-weit zur Verfügung?"
>
> `provideHttpClient(withInterceptors([jwtInterceptor]))` — registriert HttpClient und hängt unseren Interceptor ein. `provideAnimations()` — Angular Material braucht das für sanfte Übergänge (Dialoge, Spinner etc.).

- [ ] `src/app/app.config.ts` komplett ersetzen

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([jwtInterceptor])),
    provideAnimations()
  ]
};
```

---

### Schritt 4.5 — Routing einrichten

> 💡 **Warum Lazy Loading (`loadComponent`)?**
> Ohne Lazy Loading würde Angular beim ersten Seitenaufruf den Code für **alle** Features gleichzeitig herunterladen. Mit `loadComponent` wird der Dashboard-Code erst geladen, wenn der User zu `/dashboard` navigiert. Das nennt sich **Code Splitting** — kleinere initiale Bundle-Größe, schnellerer Start.
>
> **Warum Child Routes?** Das Layout (Toolbar + Sidebar) soll auf jeder geschützten Seite erscheinen — aber nicht auf der Login-Seite. Die Layout-Component ist die Eltern-Route, alle Feature-Seiten sind Kinder. Kinder rendern sich in den `<router-outlet>` des Eltern hinein.
>
> **Warum `canActivate` nur auf dem Eltern?** Der Guard wird vererbt — alle Kind-Routes sind automatisch geschützt. Du musst nicht jede einzelne Route absichern.

- [ ] `src/app/app.routes.ts` ersetzen

```typescript
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    loadComponent: () =>
      import('./core/layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'transactions',
        loadComponent: () =>
          import('./features/transactions/transactions.component').then(m => m.TransactionsComponent)
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./features/categories/categories.component').then(m => m.CategoriesComponent)
      },
      {
        path: 'budgets',
        loadComponent: () =>
          import('./features/budgets/budgets.component').then(m => m.BudgetsComponent)
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '' }
];
```

---

### Schritt 4.6 — Placeholder-Components anlegen

> 💡 **Warum Placeholders?**
> Die Routes referenzieren Components, die noch nicht existieren. TypeScript würde einen Kompilierfehler werfen. Wir erstellen leere Hüll-Components — die `ng generate`-Variante erzeugt `.ts`, `.html`, `.scss` mit minimalem Boilerplate. Morgen füllen wir sie mit echtem Inhalt.

- [ ] 4 leere Feature-Components generieren (damit Routing nicht crasht)

```bash
ng generate component features/dashboard/dashboard --standalone --skip-tests
ng generate component features/transactions/transactions --standalone --skip-tests
ng generate component features/categories/categories --standalone --skip-tests
ng generate component features/budgets/budgets --standalone --skip-tests
```

---

### Schritt 4.7 — Login Component erstellen

> 💡 **Warum Reactive Forms?**
> Angular hat zwei Form-Ansätze: Template-Driven und Reactive. **Reactive Forms** sind der Industriestandard — die Formstruktur wird in TypeScript definiert, nicht im HTML. Das macht sie testbar, explizit und gut skalierbar bei komplexer Validierung. Das ist, was ein Interviewer sehen will.
>
> `FormBuilder` ist ein Hilfs-Service, der den Boilerplate für `new FormGroup(new FormControl(...))` kürzer macht.
>
> `subscribe({ next, error })` — HTTP-Calls in Angular sind lazy: Sie passieren nur, wenn du sie abonnierst. `next` läuft bei Erfolg, `error` bei 4xx/5xx-Antworten vom Server.

- [ ] `features/auth/login/login.component.ts` anlegen
- [ ] `features/auth/login/login.component.html` anlegen
- [ ] `features/auth/login/login.component.scss` anlegen

**`login.component.ts`:**
```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatProgressSpinnerModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: () => this.router.navigate(['/']),
      error: err => {
        this.errorMessage = err.error?.error || 'Login fehlgeschlagen';
        this.isLoading = false;
      }
    });
  }
}
```

**`login.component.html`:**
```html
<div class="login-container">
  <mat-card>
    <mat-card-header>
      <mat-card-title>BudgetPlanner</mat-card-title>
      <mat-card-subtitle>Anmelden</mat-card-subtitle>
    </mat-card-header>

    <mat-card-content>
      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>E-Mail</mat-label>
          <input matInput formControlName="email" type="email">
          <mat-error *ngIf="loginForm.get('email')?.hasError('required')">
            E-Mail erforderlich
          </mat-error>
          <mat-error *ngIf="loginForm.get('email')?.hasError('email')">
            Ungültige E-Mail-Adresse
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Passwort</mat-label>
          <input matInput formControlName="password" type="password">
          <mat-error *ngIf="loginForm.get('password')?.hasError('required')">
            Passwort erforderlich
          </mat-error>
          <mat-error *ngIf="loginForm.get('password')?.hasError('minlength')">
            Mindestens 6 Zeichen
          </mat-error>
        </mat-form-field>

        <p class="error-msg" *ngIf="errorMessage">{{ errorMessage }}</p>

        <button
          mat-raised-button color="primary" type="submit"
          class="full-width" [disabled]="loginForm.invalid || isLoading">
          <mat-spinner diameter="20" *ngIf="isLoading" />
          <span *ngIf="!isLoading">Anmelden</span>
        </button>

      </form>
    </mat-card-content>
  </mat-card>
</div>
```

**`login.component.scss`:**
```scss
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f5f5;

  mat-card {
    width: 400px;
    padding: 16px;
  }

  .full-width {
    width: 100%;
    display: block;
    margin-bottom: 12px;
  }

  .error-msg {
    color: #f44336;
    font-size: 13px;
    margin-bottom: 8px;
  }
}
```

---

### Schritt 4.8 — Layout Shell erstellen

> 💡 **Warum eine eigene Layout-Component?**
> Toolbar und Sidebar sollen auf jeder Seite erscheinen — aber nur wenn der User eingeloggt ist. Anstatt Toolbar und Sidebar in jede Feature-Component zu kopieren, baut man eine **Layout-Component**, die die gemeinsame Hülle darstellt. Alle geschützten Seiten rendern sich in ihren `<router-outlet>` hinein. Ändert sich das Layout (z.B. neues Sidebar-Item), ändert man es an einer Stelle.
>
> `routerLink` statt `href` — `href` löst einen kompletten Seiten-Reload aus (wie alte Websites). `routerLink` navigiert innerhalb der Angular-App, ohne Reload: schnell, und der State geht nicht verloren.
>
> `routerLinkActive="active-link"` — Angular setzt diese CSS-Klasse automatisch auf den Link der aktuell aktiven Route. So ist das aktive Menüelement immer hervorgehoben, ohne dass du das manuell tracken musst.

- [ ] `core/layout/layout.component.ts` anlegen
- [ ] `core/layout/layout.component.html` anlegen
- [ ] `core/layout/layout.component.scss` anlegen

**`layout.component.ts`:**
```typescript
import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    MatToolbarModule, MatSidenavModule,
    MatListModule, MatIconModule, MatButtonModule
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent {
  constructor(private authService: AuthService) {}

  logout(): void {
    this.authService.logout();
  }
}
```

**`layout.component.html`:**
```html
<mat-sidenav-container class="app-container">

  <mat-sidenav mode="side" opened class="sidenav">
    <div class="sidenav-header">Budget<strong>Planner</strong></div>
    <mat-nav-list>
      <a mat-list-item routerLink="/dashboard" routerLinkActive="active-link">
        <mat-icon matListItemIcon>dashboard</mat-icon>
        <span matListItemTitle>Dashboard</span>
      </a>
      <a mat-list-item routerLink="/transactions" routerLinkActive="active-link">
        <mat-icon matListItemIcon>receipt_long</mat-icon>
        <span matListItemTitle>Transaktionen</span>
      </a>
      <a mat-list-item routerLink="/categories" routerLinkActive="active-link">
        <mat-icon matListItemIcon>category</mat-icon>
        <span matListItemTitle>Kategorien</span>
      </a>
      <a mat-list-item routerLink="/budgets" routerLinkActive="active-link">
        <mat-icon matListItemIcon>savings</mat-icon>
        <span matListItemTitle>Budgets</span>
      </a>
    </mat-nav-list>
  </mat-sidenav>

  <mat-sidenav-content>
    <mat-toolbar color="primary">
      <span class="spacer"></span>
      <button mat-icon-button (click)="logout()" title="Abmelden">
        <mat-icon>logout</mat-icon>
      </button>
    </mat-toolbar>
    <div class="page-content">
      <router-outlet />
    </div>
  </mat-sidenav-content>

</mat-sidenav-container>
```

**`layout.component.scss`:**
```scss
.app-container {
  height: 100vh;
}

.sidenav {
  width: 220px;
  background-color: #fafafa;
  border-right: 1px solid #e0e0e0;
}

.sidenav-header {
  padding: 20px 16px 12px;
  font-size: 18px;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 8px;
}

.active-link {
  background-color: rgba(63, 81, 181, 0.08);
  color: #3f51b5;
}

.spacer {
  flex: 1 1 auto;
}

.page-content {
  padding: 24px;
}
```

---

### Schritt 4.9 — `app.component.html` aufräumen

> 💡 **Warum nur `<router-outlet />`?**
> Die `AppComponent` ist die Wurzel der gesamten Angular-App. Sie soll keine eigene Darstellung haben — sie ist nur der Einstiegspunkt, der dem Router sagt: "Hier rendere das, was der aktuelle Pfad verlangt." Wenn sie eigenes HTML hätte (z.B. eine Toolbar), würde diese auch auf der Login-Seite erscheinen. Das wollen wir nicht.

- [ ] `src/app/app.component.html` komplett ersetzen (nur eine Zeile):

```html
<router-outlet />
```

✅ **Block 4 fertig wenn:** `ng serve` läuft, Login-Seite öffnet unter `/login`, nach Login erscheint das Layout mit Sidebar.

---

## 🟦 BLOCK 5 — Backend Repository Layer (ca. 1h)

### Schritt 5.1 — Ordner anlegen

> 💡 **Warum ein eigener `repositories/`-Ordner?**
> Physische Trennung spiegelt architektonische Trennung wider. Dateien in `repositories/` greifen auf die Datenbank zu. Dateien in `services/` enthalten Businesslogik. Dateien in `controller/` behandeln HTTP. Wer ins Projekt schaut, versteht sofort, wo was liegt — das nennt sich **Screaming Architecture**.

- [ ] `repositories/` Ordner im Backend anlegen

```bash
# Im backend/src/app/ Ordner
mkdir repositories
```

---

### Schritt 5.2 — `base_repository.py` erstellen

> 💡 **Warum das Repository Pattern?**
> Ohne dieses Pattern würden Services direkt `db.session.add()`, `Model.query.get()` etc. aufrufen — Datenbanklogik wäre überall verstreut. Das **Repository Pattern** kapselt den Datenbankzugriff: Services sprechen nur noch mit Repositories, nie direkt mit der DB. Vorteile:
> - Wenn du den ORM wechselst, änderst du nur die Repositories, nicht alle Services
> - Repositories sind mockbar — du kannst Services testen, ohne eine echte Datenbank zu brauchen
> - Sauberere Trennung: Service = "Was passiert?" / Repository = "Wie holen wir die Daten?"
>
> Die Basisklasse enthält die universellen CRUD-Operationen, die für **jedes** Model gleich sind. Kein Copy-Paste.

- [ ] `backend/src/app/repositories/base_repository.py` anlegen

```python
from src.app.db import db


class BaseRepository:
    def __init__(self, model):
        self.model = model

    def get_by_id(self, entity_id):
        return self.model.query.get(entity_id)

    def get_all(self):
        return self.model.query.all()

    def create(self, data: dict):
        entity = self.model(**data)
        db.session.add(entity)
        db.session.commit()
        return entity

    def update(self, entity, data: dict):
        for key, value in data.items():
            setattr(entity, key, value)
        db.session.commit()
        return entity

    def delete(self, entity):
        db.session.delete(entity)
        db.session.commit()
```

---

### Schritt 5.3 — `user_repository.py` erstellen

> 💡 **Warum `get_by_email` im Repository?**
> Die Auth-Logik braucht "finde User anhand der E-Mail" — das ist eine datenbankspezifische Abfrage, die ins Repository gehört. Services fragen: "Gib mir den User mit dieser E-Mail." Repositories antworten: "OK, ich schaue in der DB nach." Services müssen nicht wissen, dass es `User.query.filter_by(...)` gibt.

- [ ] `backend/src/app/repositories/user_repository.py` anlegen

```python
import uuid
from src.app.repositories.base_repository import BaseRepository
from src.app.models.user import User
from src.app.db import db


class UserRepository(BaseRepository):
    def __init__(self):
        super().__init__(User)

    def get_by_email(self, email: str):
        return User.query.filter_by(email=email).first()

    def create_user(self, name: str, email: str, hashed_password: str) -> User:
        user = User(
            id=uuid.uuid4(),
            name=name,
            email=email,
            hashed_password=hashed_password
        )
        db.session.add(user)
        db.session.commit()
        return user
```

---

### Schritt 5.4 — `category_repository.py` erstellen

> 💡 **Warum `filter_by(deleted_at=None)`?**
> Das ist das **Soft Delete Pattern**: Daten werden nicht wirklich aus der Datenbank gelöscht, sondern nur mit einem Zeitstempel markiert (`deleted_at`). Vorteile: Daten sind wiederherstellbar, die History bleibt erhalten, Fremdschlüssel bleiben intakt. Wer gelöschte Kategorien nicht sehen soll (= alle), filtert einfach auf `deleted_at=None`.
>
> **Warum `name_exists_for_user`?** Die Datenbank hat einen UNIQUE-Constraint auf `(user_id, name)`. Aber lieber im Code prüfen und eine verständliche Fehlermeldung zurückgeben, als den rohen Datenbank-Fehler zum Frontend durchreichen. Das ist defensive Programmierung.

- [ ] `backend/src/app/repositories/category_repository.py` anlegen

```python
import uuid
from datetime import datetime, timezone
from src.app.repositories.base_repository import BaseRepository
from src.app.models.categories import Categories
from src.app.db import db


class CategoryRepository(BaseRepository):
    def __init__(self):
        super().__init__(Categories)

    def get_all_by_user(self, user_id):
        return Categories.query.filter_by(
            user_id=user_id, deleted_at=None
        ).all()

    def name_exists_for_user(self, user_id, name: str) -> bool:
        return Categories.query.filter_by(
            user_id=user_id, name=name, deleted_at=None
        ).first() is not None

    def create_category(self, user_id, name: str, category_type):
        category = Categories(
            id=uuid.uuid4(),
            user_id=user_id,
            name=name,
            type=category_type
        )
        db.session.add(category)
        db.session.commit()
        return category

    def soft_delete(self, category_id) -> bool:
        category = self.get_by_id(category_id)
        if not category:
            return False
        category.deleted_at = datetime.now(timezone.utc)
        db.session.commit()
        return True
```

---

### Schritt 5.5 — `__init__.py` in repositories anlegen

> 💡 **Warum `__init__.py`?**
> In Python macht diese Datei einen Ordner zu einem **Package** — damit andere Dateien daraus importieren können (`from src.app.repositories.user_repository import UserRepository`). Ohne sie würde Python den Ordner nicht als importierbares Modul erkennen.

- [ ] `backend/src/app/repositories/__init__.py` anlegen

```python
from src.app.repositories.base_repository import BaseRepository
from src.app.repositories.user_repository import UserRepository
from src.app.repositories.category_repository import CategoryRepository
```

✅ **Block 5 fertig wenn:** Keine Import-Fehler, Python lädt alle Repositories.

---

## ✅ Abend-Check

- [ ] Backend startet ohne Fehler (`python -m flask run`)
- [ ] Register funktioniert (Postman → 201)
- [ ] Login funktioniert (Postman → JWT Token)
- [ ] Angular startet (`ng serve`)
- [ ] `http://localhost:4200` → redirect auf `/login`
- [ ] Login im Browser funktioniert → Layout mit Sidebar erscheint
- [ ] Logout-Button → zurück auf `/login`
- [ ] Direkt `/dashboard` aufrufen → redirect auf `/login` (Guard funktioniert)
