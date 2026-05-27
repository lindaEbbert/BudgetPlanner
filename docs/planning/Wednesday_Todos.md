# 🗓️ Mittwoch 27.5. — Erster vollständiger Vertical Slice

## Tagesziel

Heute entsteht der erste echte End-to-End-Flow:

```
Datenbank → Repository → Service → Controller → API → Angular Service → Component → UI
```

Am Abend kannst du Kategorien und Transaktionen vollständig über die UI anlegen, anzeigen und verwalten — und das Dashboard zeigt echte Zahlen.

## Tagesübersicht

| Block | Zeit | Thema | Ziel |
|-------|------|-------|------|
| 1 | ~1.5h | Backend Categories | GET/POST/PUT/DELETE `/categories` läuft |
| 2 | ~2h | Backend Transactions | CRUD + Balance-Endpoint läuft |
| 3 | ~1h | Angular Categories UI | Kategorienliste + Create/Edit Dialog |
| 4 | ~2.5h | Angular Transactions UI | Transaktions-Tabelle + Balance-Anzeige |
| 5 | ~1h | Dashboard | Backend-Summary + Angular 3-Karten-View |

> ⚠️ **Voraussetzung:** Block 5 von gestern (Repository Layer) muss erledigt sein — insbesondere `CategoryRepository`. Falls noch nicht, erst das fertigstellen.

---

## 🟥 BLOCK 1 — Backend Categories (ca. 1.5h)

### Schritt 1.1 — `category_service.py` erstellen

> 💡 **Warum?**
> Der Service enthält die **Businesslogik** — also die Regeln, die deine App durchsetzt. Hier: "Eine Kategorie darf nicht zweimal denselben Namen haben (pro User)." Diese Regel gehört nicht in den Controller (der sollte nur HTTP kennen) und nicht ins Repository (das soll nur DB-Zugriffe kapseln) — sie gehört in den Service.
>
> Beachte, dass `CategoryType` aus dem Model importiert wird. So gibt es nur eine einzige Definition des Enums — in der DB-Model-Datei. Alles andere importiert von dort. Das nennt sich **Single Source of Truth**.

- [ ] Neue Datei anlegen: `backend/src/app/services/category_service.py`

```python
from src.app.repositories.category_repository import CategoryRepository
from src.app.models.categories import CategoryType

category_repository = CategoryRepository()


def get_user_categories(user_id):
    return category_repository.get_all_by_user(user_id)


def create_category(user_id, name: str, category_type: str):
    if category_repository.name_exists_for_user(user_id, name):
        return None, "Kategorie mit diesem Namen existiert bereits"

    category = category_repository.create_category(
        user_id=user_id,
        name=name,
        category_type=CategoryType[category_type]
    )
    return category, None


def update_category(category_id, user_id, name: str = None, category_type: str = None):
    category = category_repository.get_by_id(category_id)
    if not category:
        return None, "Kategorie nicht gefunden"
    if str(category.user_id) != str(user_id):
        return None, "Keine Berechtigung"

    data = {}
    if name and name != category.name:
        if category_repository.name_exists_for_user(user_id, name):
            return None, "Name bereits vergeben"
        data['name'] = name
    if category_type:
        data['type'] = CategoryType[category_type]

    updated = category_repository.update(category, data)
    return updated, None


def delete_category(category_id, user_id):
    category = category_repository.get_by_id(category_id)
    if not category:
        return False, "Kategorie nicht gefunden"
    if str(category.user_id) != str(user_id):
        return False, "Keine Berechtigung"

    category_repository.soft_delete(category_id)
    return True, None
```

---

### Schritt 1.2 — `category_controller.py` erstellen

> 💡 **Warum `@jwt_required()` auf jedem Endpoint?**
> Kategorien gehören einem User. Ohne JWT-Prüfung könnte jeder beliebige die Kategorien aller anderen sehen oder löschen. `@jwt_required()` prüft den Token im `Authorization`-Header. `get_jwt_identity()` liest die `user_id` heraus, die wir beim Login in den Token geschrieben haben.
>
> **Warum `category_to_dict()`?** SQLAlchemy-Objekte können nicht direkt als JSON serialisiert werden — `jsonify()` weiß nicht, wie es ein Python-Objekt in JSON umwandeln soll. Die Hilfsfunktion konvertiert das Objekt manuell in ein Dictionary. Außerdem konvertieren wir UUIDs zu Strings und Enums zu ihrem `.value` — beides wäre sonst nicht JSON-serialisierbar.

- [ ] Neue Datei anlegen: `backend/src/app/controller/category_controller.py`

```python
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.app.services import category_service

category_blueprint = Blueprint('categories', __name__, url_prefix='/categories')


def category_to_dict(cat):
    return {
        'id': str(cat.id),
        'name': cat.name,
        'type': cat.type.value,
        'userId': str(cat.user_id),
        'createdAt': cat.created_at.isoformat() if cat.created_at else None
    }


@category_blueprint.route('', methods=['GET'])
@jwt_required()
def get_categories():
    user_id = get_jwt_identity()
    categories = category_service.get_user_categories(user_id)
    return jsonify([category_to_dict(c) for c in categories]), 200


@category_blueprint.route('', methods=['POST'])
@jwt_required()
def create_category():
    user_id = get_jwt_identity()
    data = request.get_json()
    name = data.get('name')
    category_type = data.get('type')

    if not name or not category_type:
        return jsonify({'error': 'Name und Typ erforderlich'}), 400

    category, error = category_service.create_category(user_id, name, category_type)
    if error:
        return jsonify({'error': error}), 409

    return jsonify(category_to_dict(category)), 201


@category_blueprint.route('/<category_id>', methods=['PUT'])
@jwt_required()
def update_category(category_id):
    user_id = get_jwt_identity()
    data = request.get_json()

    category, error = category_service.update_category(
        category_id=category_id,
        user_id=user_id,
        name=data.get('name'),
        category_type=data.get('type')
    )
    if error:
        return jsonify({'error': error}), 404

    return jsonify(category_to_dict(category)), 200


@category_blueprint.route('/<category_id>', methods=['DELETE'])
@jwt_required()
def delete_category(category_id):
    user_id = get_jwt_identity()
    success, error = category_service.delete_category(category_id, user_id)

    if not success:
        return jsonify({'error': error}), 404

    return jsonify({'message': 'Kategorie gelöscht'}), 200
```

---

### Schritt 1.3 — Blueprint in `main.py` registrieren

> 💡 **Warum muss das jedes Mal gemacht werden?**
> Flask weiß von deinen Blueprints nur, wenn du sie explizit registrierst. Es gibt keine Magie, die Blueprints automatisch findet. Jedes Mal wenn du einen neuen Controller erstellst, kommen zwei Zeilen in `main.py` dazu: der Import und `app.register_blueprint(...)`.

- [ ] In `backend/src/app/main.py` ergänzen:

```python
# Import oben hinzufügen:
from src.app.controller.category_controller import category_blueprint

# Nach den anderen register_blueprint-Zeilen:
app.register_blueprint(category_blueprint)
```

---

### Schritt 1.4 — Endpoints testen

> 💡 **Jetzt testen, nicht später.** Wenn du erst alle 5 Blocks baust und dann testest, weißt du bei einem Fehler nicht, wo er liegt. Test nach jedem Block = du weißt genau, was funktioniert.

- [ ] Backend starten: `python -m flask --app src/app/main.py run`
- [ ] Erst einloggen → JWT Token kopieren
- [ ] GET `/categories` mit Token testen → leere Liste `[]`
- [ ] POST `/categories` testen → neue Kategorie kommt zurück
- [ ] GET `/categories` nochmal → Kategorie erscheint
- [ ] DELETE `/categories/<id>` testen → 200

```
# Header für alle Requests:
Authorization: Bearer <dein-token-von-heute-früh>

POST http://localhost:5000/categories
Body: { "name": "Gehalt", "type": "INCOME" }
→ 201 { "id": "...", "name": "Gehalt", "type": "INCOME", ... }

POST http://localhost:5000/categories
Body: { "name": "Miete", "type": "EXPENSE" }
→ 201

GET http://localhost:5000/categories
→ 200 [ {...}, {...} ]
```

✅ **Block 1 fertig wenn:** CRUD für Kategorien funktioniert.

---

## 🟧 BLOCK 2 — Backend Transactions (ca. 2h)

### Schritt 2.1 — `transaction_repository.py` erstellen

> 💡 **Warum ein eigenes Repository für Transactions?**
> Transactions haben andere Abfragebedürfnisse als andere Models: gefiltert nach User, sortiert nach Datum, ohne stornierte. Diese domänenspezifischen Abfragen gehören ins Repository. Außerdem brauchen wir Aggregationen (Summen) für die Balance-Berechnung — das ist SQL-Logik, kein Business-Logik, also Repository.
>
> `func.sum()` ist SQLAlchemy's Weg, `SUM()` in SQL zu schreiben. Das erzeugt exakt dieses SQL:
> ```sql
> SELECT SUM(amount) FROM transactions
> WHERE user_id = ? AND type = 'INCOME' AND is_voided = FALSE
> ```
> Das ist performanter als alle Transaktionen zu laden und in Python zu summieren.

- [ ] Neue Datei anlegen: `backend/src/app/repositories/transaction_repository.py`

```python
from src.app.repositories.base_repository import BaseRepository
from src.app.models.transactions import Transactions, TransactionType
from src.app.db import db
from sqlalchemy import func


class TransactionRepository(BaseRepository):
    def __init__(self):
        super().__init__(Transactions)

    def get_by_user(self, user_id, include_voided=False):
        query = Transactions.query.filter_by(user_id=user_id)
        if not include_voided:
            query = query.filter_by(is_voided=False)
        return query.order_by(Transactions.transaction_date.desc()).all()

    def get_income_sum(self, user_id) -> float:
        result = db.session.query(func.sum(Transactions.amount)).filter(
            Transactions.user_id == user_id,
            Transactions.type == TransactionType.INCOME,
            Transactions.is_voided == False
        ).scalar()
        return float(result or 0)

    def get_expense_sum(self, user_id) -> float:
        result = db.session.query(func.sum(Transactions.amount)).filter(
            Transactions.user_id == user_id,
            Transactions.type == TransactionType.EXPENSE,
            Transactions.is_voided == False
        ).scalar()
        return float(result or 0)
```

---

### Schritt 2.2 — `transaction_service.py` erstellen

> 💡 **Warum `void` statt `delete`?**
> Transaktionen sollte man in einer Finanz-App **niemals löschen** — das zerstört die Buchungshistorie. `is_voided = True` markiert die Transaktion als storniert, sie bleibt aber in der DB. Die Balance-Berechnung ignoriert stornierte Transaktionen. Das entspricht dem Buchungsprinzip: Fehler werden durch Gegenbuchung korrigiert, nicht durch Löschen.
>
> **Warum `calculate_balance` im Service und nicht im Repository?** Die *Berechnung* (income − expenses) ist Businesslogik. Das Repository liefert die Rohdaten (Summen), der Service rechnet damit. Klare Aufgabentrennung.

- [ ] Neue Datei anlegen: `backend/src/app/services/transaction_service.py`

```python
import uuid
from datetime import datetime
from src.app.repositories.transaction_repository import TransactionRepository
from src.app.models.transactions import Transactions, TransactionType
from src.app.db import db

transaction_repository = TransactionRepository()


def get_user_transactions(user_id, include_voided=False):
    return transaction_repository.get_by_user(user_id, include_voided)


def create_transaction(user_id, name, amount, transaction_type,
                       category_id, transaction_date, description=None, fixed_cost_id=None):
    transaction = Transactions(
        id=uuid.uuid4(),
        user_id=user_id,
        category_id=category_id,
        fixed_cost_id=fixed_cost_id,
        name=name,
        amount=amount,
        type=TransactionType[transaction_type],
        transaction_date=datetime.fromisoformat(transaction_date),
        description=description,
        is_voided=False
    )
    db.session.add(transaction)
    db.session.commit()
    return transaction, None


def update_transaction(transaction_id, user_id, data: dict):
    transaction = transaction_repository.get_by_id(transaction_id)
    if not transaction:
        return None, "Transaktion nicht gefunden"
    if str(transaction.user_id) != str(user_id):
        return None, "Keine Berechtigung"

    update_data = {}
    if 'name' in data:
        update_data['name'] = data['name']
    if 'amount' in data:
        update_data['amount'] = data['amount']
    if 'description' in data:
        update_data['description'] = data['description']
    if 'transactionDate' in data:
        update_data['transaction_date'] = datetime.fromisoformat(data['transactionDate'])

    updated = transaction_repository.update(transaction, update_data)
    return updated, None


def void_transaction(transaction_id, user_id):
    transaction = transaction_repository.get_by_id(transaction_id)
    if not transaction:
        return None, "Transaktion nicht gefunden"
    if str(transaction.user_id) != str(user_id):
        return None, "Keine Berechtigung"

    transaction_repository.update(transaction, {'is_voided': True})
    return transaction, None


def calculate_balance(user_id):
    income = transaction_repository.get_income_sum(user_id)
    expenses = transaction_repository.get_expense_sum(user_id)
    return {
        'income': income,
        'expenses': expenses,
        'balance': income - expenses
    }
```

---

### Schritt 2.3 — `transaction_controller.py` erstellen

> 💡 **Warum ein eigener `/void`-Endpoint statt DELETE?**
> `DELETE /transactions/<id>` würde semantisch bedeuten: "Lösche diese Transaktion." Aber wir löschen nicht — wir stornieren. Der Endpoint `POST /transactions/<id>/void` drückt das klar aus. REST-konforme Benennung macht APIs selbstdokumentierend.
>
> **Warum `/balance` als eigener Endpoint?** Der Client braucht die Balance oft separat (z.B. im Dashboard) — ohne alle Transaktionen zu laden. Eigener Endpoint = weniger Datentransfer, bessere Performance.

- [ ] Neue Datei anlegen: `backend/src/app/controller/transaction_controller.py`

```python
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.app.services import transaction_service

transaction_blueprint = Blueprint('transactions', __name__, url_prefix='/transactions')


def transaction_to_dict(t):
    return {
        'id': str(t.id),
        'userId': str(t.user_id),
        'categoryId': str(t.category_id),
        'fixedCostId': str(t.fixed_cost_id) if t.fixed_cost_id else None,
        'name': t.name,
        'amount': float(t.amount),
        'type': t.type.value,
        'transactionDate': t.transaction_date.isoformat() if t.transaction_date else None,
        'description': t.description,
        'isVoided': t.is_voided,
        'createdAt': t.created_at.isoformat() if t.created_at else None
    }


@transaction_blueprint.route('/balance', methods=['GET'])
@jwt_required()
def get_balance():
    user_id = get_jwt_identity()
    balance = transaction_service.calculate_balance(user_id)
    return jsonify(balance), 200


@transaction_blueprint.route('', methods=['GET'])
@jwt_required()
def get_transactions():
    user_id = get_jwt_identity()
    include_voided = request.args.get('include_voided', 'false').lower() == 'true'
    transactions = transaction_service.get_user_transactions(user_id, include_voided)
    return jsonify([transaction_to_dict(t) for t in transactions]), 200


@transaction_blueprint.route('', methods=['POST'])
@jwt_required()
def create_transaction():
    user_id = get_jwt_identity()
    data = request.get_json()

    required = ['name', 'amount', 'type', 'categoryId', 'transactionDate']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'{field} ist erforderlich'}), 400

    transaction, error = transaction_service.create_transaction(
        user_id=user_id,
        name=data['name'],
        amount=data['amount'],
        transaction_type=data['type'],
        category_id=data['categoryId'],
        transaction_date=data['transactionDate'],
        description=data.get('description'),
        fixed_cost_id=data.get('fixedCostId')
    )
    if error:
        return jsonify({'error': error}), 400

    return jsonify(transaction_to_dict(transaction)), 201


@transaction_blueprint.route('/<transaction_id>', methods=['PUT'])
@jwt_required()
def update_transaction(transaction_id):
    user_id = get_jwt_identity()
    data = request.get_json()

    transaction, error = transaction_service.update_transaction(transaction_id, user_id, data)
    if error:
        return jsonify({'error': error}), 404

    return jsonify(transaction_to_dict(transaction)), 200


@transaction_blueprint.route('/<transaction_id>/void', methods=['POST'])
@jwt_required()
def void_transaction(transaction_id):
    user_id = get_jwt_identity()
    transaction, error = transaction_service.void_transaction(transaction_id, user_id)

    if error:
        return jsonify({'error': error}), 404

    return jsonify(transaction_to_dict(transaction)), 200


@transaction_blueprint.route('/<transaction_id>', methods=['DELETE'])
@jwt_required()
def delete_transaction(transaction_id):
    user_id = get_jwt_identity()
    transaction = transaction_service.get_user_transactions(user_id)
    # Hinweis: In einer Finanz-App lieber void_transaction verwenden!
    return jsonify({'message': 'Nicht erlaubt — bitte stornieren statt löschen'}), 405
```

---

### Schritt 2.4 — Blueprints in `main.py` registrieren

- [ ] In `backend/src/app/main.py` ergänzen:

```python
# Import oben:
from src.app.controller.transaction_controller import transaction_blueprint

# Nach den anderen register_blueprint-Zeilen:
app.register_blueprint(transaction_blueprint)
```

---

### Schritt 2.5 — Endpoints testen

- [ ] GET `/transactions/balance` → `{ "income": 0, "expenses": 0, "balance": 0 }`
- [ ] POST `/transactions` → neue Transaktion wird zurückgegeben
- [ ] GET `/transactions` → Transaktion erscheint
- [ ] POST `/transactions/<id>/void` → `isVoided: true`
- [ ] GET `/transactions/balance` nochmal → Balance hat sich verändert

```
POST http://localhost:5000/transactions
Body:
{
  "name": "Januargehalt",
  "amount": 2500.00,
  "type": "INCOME",
  "categoryId": "<id-deiner-einnahme-kategorie>",
  "transactionDate": "2026-05-01"
}
→ 201 { "id": "...", "amount": 2500.0, "isVoided": false, ... }

GET http://localhost:5000/transactions/balance
→ 200 { "income": 2500.0, "expenses": 0.0, "balance": 2500.0 }
```

✅ **Block 2 fertig wenn:** Balance stimmt nach Transaktionen anlegen.

---

## 🟨 BLOCK 3 — Angular Categories UI (ca. 1h)

### Schritt 3.1 — `category.service.ts` erstellen

> 💡 **Warum erbt der Service von `ApiService`?**
> Wir haben gestern eine `ApiService`-Basisklasse gebaut, die `baseUrl` und `http` bereitstellt. Alle Feature-Services erben davon — sie bekommen `this.baseUrl` und `this.http` kostenlos via `super()`. Das ist das **Template-Method-Pattern**: Gemeinsamkeiten einmal definieren, Unterschiede in Unterklassen.
>
> Beachte: Der `HttpClient` kommt über `super(http)` an die Basisklasse weiter. Angular's Dependency Injection löst das automatisch auf.

- [ ] Neue Datei anlegen: `frontend/src/app/features/categories/category.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Category, CreateCategoryDto } from '../../shared/models';
import { ApiService } from '../../core/services/api.service';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class CategoryService extends ApiService {

  constructor(http: HttpClient) {
    super(http);
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.baseUrl}/categories`);
  }

  createCategory(dto: CreateCategoryDto): Observable<Category> {
    return this.http.post<Category>(`${this.baseUrl}/categories`, dto);
  }

  updateCategory(id: string, dto: Partial<CreateCategoryDto>): Observable<Category> {
    return this.http.put<Category>(`${this.baseUrl}/categories/${id}`, dto);
  }

  deleteCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/categories/${id}`);
  }
}
```

---

### Schritt 3.2 — `categories.component.ts` / `.html` / `.scss`

> 💡 **Warum `ngOnInit` statt Constructor für das Laden der Daten?**
> Der Constructor ist für Dependency Injection — er soll keine Logik enthalten. `ngOnInit` ist ein Angular **Lifecycle Hook**, der aufgerufen wird, wenn die Component vollständig initialisiert ist. Erst dann ist es sicher, Services aufzurufen. Das ist ein häufiger Interview-Punkt.
>
> **Warum `loadCategories()` als eigene Methode?** Weil wir sie von mehreren Stellen aus aufrufen (beim Start und nach Create/Edit/Delete). DRY-Prinzip.

- [ ] `frontend/src/app/features/categories/categories.component.ts` ersetzen:

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CategoryService } from './category.service';
import { Category } from '../../shared/models';
import { CategoryFormComponent } from './category-form/category-form.component';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatDialogModule],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss'
})
export class CategoriesComponent implements OnInit {
  categories: Category[] = [];
  displayedColumns = ['name', 'type', 'actions'];

  constructor(
    private categoryService: CategoryService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe(cats => this.categories = cats);
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(CategoryFormComponent, { width: '400px' });
    ref.afterClosed().subscribe(result => {
      if (result) this.loadCategories();
    });
  }

  openEditDialog(category: Category): void {
    const ref = this.dialog.open(CategoryFormComponent, {
      width: '400px',
      data: category
    });
    ref.afterClosed().subscribe(result => {
      if (result) this.loadCategories();
    });
  }

  deleteCategory(id: string): void {
    if (confirm('Kategorie wirklich löschen?')) {
      this.categoryService.deleteCategory(id).subscribe(() => this.loadCategories());
    }
  }
}
```

- [ ] `frontend/src/app/features/categories/categories.component.html` anlegen:

```html
<div class="page-header">
  <h1>Kategorien</h1>
  <button mat-raised-button color="primary" (click)="openCreateDialog()">
    <mat-icon>add</mat-icon> Neue Kategorie
  </button>
</div>

<mat-table [dataSource]="categories" class="mat-elevation-z2">

  <ng-container matColumnDef="name">
    <mat-header-cell *matHeaderCellDef>Name</mat-header-cell>
    <mat-cell *matCellDef="let cat">{{ cat.name }}</mat-cell>
  </ng-container>

  <ng-container matColumnDef="type">
    <mat-header-cell *matHeaderCellDef>Typ</mat-header-cell>
    <mat-cell *matCellDef="let cat">
      <span [class]="'type-badge ' + cat.type.toLowerCase()">
        {{ cat.type === 'INCOME' ? 'Einnahme' : 'Ausgabe' }}
      </span>
    </mat-cell>
  </ng-container>

  <ng-container matColumnDef="actions">
    <mat-header-cell *matHeaderCellDef></mat-header-cell>
    <mat-cell *matCellDef="let cat">
      <button mat-icon-button (click)="openEditDialog(cat)">
        <mat-icon>edit</mat-icon>
      </button>
      <button mat-icon-button color="warn" (click)="deleteCategory(cat.id)">
        <mat-icon>delete</mat-icon>
      </button>
    </mat-cell>
  </ng-container>

  <mat-header-row *matHeaderRowDef="displayedColumns"></mat-header-row>
  <mat-row *matRowDef="let row; columns: displayedColumns;"></mat-row>
</mat-table>

<p *ngIf="categories.length === 0" class="empty-state">
  Noch keine Kategorien. Erstelle deine erste Kategorie!
</p>
```

- [ ] `frontend/src/app/features/categories/categories.component.scss` anlegen:

```scss
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  h1 { margin: 0; }
}

.type-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;

  &.income { background: #e8f5e9; color: #2e7d32; }
  &.expense { background: #ffebee; color: #c62828; }
}

.empty-state {
  text-align: center;
  color: #999;
  margin-top: 48px;
}
```

---

### Schritt 3.3 — `CategoryFormComponent` erstellen (Dialog)

> 💡 **Warum ein Dialog und nicht eine eigene Seite?**
> Für eine einfache Create/Edit-Form mit 2 Feldern ist ein Dialog ideal — der User bleibt auf der Liste, sieht das Ergebnis direkt. Eine eigene Route wäre Overhead.
>
> **Wie funktioniert der Dialog?** `MatDialog.open()` gibt eine `MatDialogRef` zurück. Mit `dialogRef.close(true)` übergibst du beim Schließen ein Ergebnis. Das Parent-Component wartet auf `ref.afterClosed()` und weiß damit, ob etwas gespeichert wurde — dann lädt es die Liste neu.
>
> **`@Optional() @Inject(MAT_DIALOG_DATA)`** — wenn der Dialog ohne Daten geöffnet wird (Create-Fall), wäre `data` normalerweise ein Fehler. `@Optional()` macht den Parameter optional, `@Inject(MAT_DIALOG_DATA)` sagt Angular: "Hol diesen Wert aus dem Dialog-Kontext, nicht aus dem normalen DI-System."

- [ ] Ordner erstellen: `frontend/src/app/features/categories/category-form/`
- [ ] `category-form.component.ts` anlegen:

```typescript
import { Component, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { CategoryService } from '../category.service';
import { Category } from '../../../shared/models';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule
  ],
  templateUrl: './category-form.component.html'
})
export class CategoryFormComponent {
  form: FormGroup;
  isEdit: boolean;

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private dialogRef: MatDialogRef<CategoryFormComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: Category
  ) {
    this.isEdit = !!data;
    this.form = this.fb.group({
      name: [data?.name ?? '', Validators.required],
      type: [data?.type ?? '', Validators.required]
    });
  }

  save(): void {
    if (this.form.invalid) return;

    const action = this.isEdit
      ? this.categoryService.updateCategory(this.data.id, this.form.value)
      : this.categoryService.createCategory(this.form.value);

    action.subscribe({
      next: () => this.dialogRef.close(true),
      error: err => console.error('Fehler:', err)
    });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
```

- [ ] `category-form.component.html` anlegen:

```html
<h2 mat-dialog-title>{{ isEdit ? 'Kategorie bearbeiten' : 'Neue Kategorie' }}</h2>

<mat-dialog-content>
  <form [formGroup]="form">

    <mat-form-field appearance="outline" class="full-width">
      <mat-label>Name</mat-label>
      <input matInput formControlName="name">
      <mat-error *ngIf="form.get('name')?.hasError('required')">Name erforderlich</mat-error>
    </mat-form-field>

    <mat-form-field appearance="outline" class="full-width">
      <mat-label>Typ</mat-label>
      <mat-select formControlName="type">
        <mat-option value="INCOME">Einnahme</mat-option>
        <mat-option value="EXPENSE">Ausgabe</mat-option>
      </mat-select>
      <mat-error *ngIf="form.get('type')?.hasError('required')">Typ erforderlich</mat-error>
    </mat-form-field>

  </form>
</mat-dialog-content>

<mat-dialog-actions align="end">
  <button mat-button (click)="cancel()">Abbrechen</button>
  <button mat-raised-button color="primary" (click)="save()" [disabled]="form.invalid">
    {{ isEdit ? 'Speichern' : 'Erstellen' }}
  </button>
</mat-dialog-actions>
```

✅ **Block 3 fertig wenn:** Kategorien können über die UI erstellt, bearbeitet und gelöscht werden.

---

## 🟩 BLOCK 4 — Angular Transactions UI (ca. 2.5h)

### Schritt 4.1 — `transaction.service.ts` erstellen

> 💡 **Warum `getBalance()` als eigene Methode?**
> Das Dashboard und die Transactions-Seite brauchen beide die Balance. Wenn die Balance im TransactionService liegt, können beide Components sie aufrufen — ohne Code zu duplizieren. Services sind die zentrale Anlaufstelle für Daten in Angular.

- [ ] Neue Datei anlegen: `frontend/src/app/features/transactions/transaction.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Transaction, CreateTransactionDto, BalanceSummary } from '../../shared/models';
import { ApiService } from '../../core/services/api.service';

@Injectable({ providedIn: 'root' })
export class TransactionService extends ApiService {

  constructor(http: HttpClient) {
    super(http);
  }

  getTransactions(includeVoided = false): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(
      `${this.baseUrl}/transactions?include_voided=${includeVoided}`
    );
  }

  createTransaction(dto: CreateTransactionDto): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.baseUrl}/transactions`, dto);
  }

  updateTransaction(id: string, dto: Partial<CreateTransactionDto>): Observable<Transaction> {
    return this.http.put<Transaction>(`${this.baseUrl}/transactions/${id}`, dto);
  }

  voidTransaction(id: string): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.baseUrl}/transactions/${id}/void`, {});
  }

  getBalance(): Observable<BalanceSummary> {
    return this.http.get<BalanceSummary>(`${this.baseUrl}/transactions/balance`);
  }
}
```

---

### Schritt 4.2 — `transactions.component.ts` / `.html` / `.scss`

> 💡 **Warum `loadAll()` beides lädt?**
> Nach jeder Änderung (Create, Edit, Void) müssen sowohl die Transaktionsliste als auch die Balance aktualisiert werden. Indem `loadAll()` beides aufruft, reicht ein einziger Aufruf aus — egal welche Aktion den Reload auslöst.
>
> **Warum `[class.voided-row]="row.isVoided"`?** Angular-Property-Binding kann CSS-Klassen dynamisch setzen. Stornierte Transaktionen bekommen visuell eine andere Darstellung (durchgestrichen, ausgegraut) — ohne JavaScript-Logik im Template. Das ist **deklaratives** Angular.

- [ ] `frontend/src/app/features/transactions/transactions.component.ts` ersetzen:

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TransactionService } from './transaction.service';
import { Transaction, BalanceSummary } from '../../shared/models';
import { TransactionFormComponent } from './transaction-form/transaction-form.component';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule, MatButtonModule, MatIconModule,
    MatDialogModule, MatCardModule, MatTooltipModule
  ],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.scss'
})
export class TransactionsComponent implements OnInit {
  transactions: Transaction[] = [];
  balance: BalanceSummary = { income: 0, expenses: 0, balance: 0 };
  displayedColumns = ['date', 'name', 'type', 'amount', 'status', 'actions'];

  constructor(
    private transactionService: TransactionService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.transactionService.getTransactions().subscribe(t => this.transactions = t);
    this.transactionService.getBalance().subscribe(b => this.balance = b);
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(TransactionFormComponent, { width: '520px' });
    ref.afterClosed().subscribe(result => { if (result) this.loadAll(); });
  }

  openEditDialog(transaction: Transaction): void {
    const ref = this.dialog.open(TransactionFormComponent, {
      width: '520px',
      data: transaction
    });
    ref.afterClosed().subscribe(result => { if (result) this.loadAll(); });
  }

  voidTransaction(id: string): void {
    if (confirm('Transaktion wirklich stornieren? Sie bleibt sichtbar, wird aber nicht mehr gewertet.')) {
      this.transactionService.voidTransaction(id).subscribe(() => this.loadAll());
    }
  }
}
```

- [ ] `frontend/src/app/features/transactions/transactions.component.html` anlegen:

```html
<div class="page-header">
  <h1>Transaktionen</h1>
  <button mat-raised-button color="primary" (click)="openCreateDialog()">
    <mat-icon>add</mat-icon> Neue Transaktion
  </button>
</div>

<!-- Balance Summary -->
<div class="balance-row">
  <mat-card class="balance-card income">
    <mat-card-content>
      <p class="label">Einnahmen</p>
      <p class="amount">{{ balance.income | currency:'EUR':'symbol':'1.2-2':'de' }}</p>
    </mat-card-content>
  </mat-card>

  <mat-card class="balance-card expense">
    <mat-card-content>
      <p class="label">Ausgaben</p>
      <p class="amount">{{ balance.expenses | currency:'EUR':'symbol':'1.2-2':'de' }}</p>
    </mat-card-content>
  </mat-card>

  <mat-card class="balance-card" [class.positive]="balance.balance >= 0" [class.negative]="balance.balance < 0">
    <mat-card-content>
      <p class="label">Kontostand</p>
      <p class="amount">{{ balance.balance | currency:'EUR':'symbol':'1.2-2':'de' }}</p>
    </mat-card-content>
  </mat-card>
</div>

<!-- Transactions Table -->
<mat-table [dataSource]="transactions" class="mat-elevation-z2">

  <ng-container matColumnDef="date">
    <mat-header-cell *matHeaderCellDef>Datum</mat-header-cell>
    <mat-cell *matCellDef="let t">{{ t.transactionDate | date:'dd.MM.yyyy' }}</mat-cell>
  </ng-container>

  <ng-container matColumnDef="name">
    <mat-header-cell *matHeaderCellDef>Bezeichnung</mat-header-cell>
    <mat-cell *matCellDef="let t" [class.voided-text]="t.isVoided">{{ t.name }}</mat-cell>
  </ng-container>

  <ng-container matColumnDef="type">
    <mat-header-cell *matHeaderCellDef>Typ</mat-header-cell>
    <mat-cell *matCellDef="let t">
      <span [class]="'type-badge ' + t.type.toLowerCase()">
        {{ t.type === 'INCOME' ? 'Einnahme' : 'Ausgabe' }}
      </span>
    </mat-cell>
  </ng-container>

  <ng-container matColumnDef="amount">
    <mat-header-cell *matHeaderCellDef>Betrag</mat-header-cell>
    <mat-cell *matCellDef="let t">
      <span [class]="t.type === 'INCOME' ? 'income-amount' : 'expense-amount'">
        {{ t.type === 'INCOME' ? '+' : '−' }}{{ t.amount | currency:'EUR':'symbol':'1.2-2':'de' }}
      </span>
    </mat-cell>
  </ng-container>

  <ng-container matColumnDef="status">
    <mat-header-cell *matHeaderCellDef>Status</mat-header-cell>
    <mat-cell *matCellDef="let t">
      <span *ngIf="t.isVoided" class="voided-badge">Storniert</span>
    </mat-cell>
  </ng-container>

  <ng-container matColumnDef="actions">
    <mat-header-cell *matHeaderCellDef></mat-header-cell>
    <mat-cell *matCellDef="let t">
      <button mat-icon-button (click)="openEditDialog(t)" [disabled]="t.isVoided" matTooltip="Bearbeiten">
        <mat-icon>edit</mat-icon>
      </button>
      <button mat-icon-button color="warn" (click)="voidTransaction(t.id)" [disabled]="t.isVoided" matTooltip="Stornieren">
        <mat-icon>block</mat-icon>
      </button>
    </mat-cell>
  </ng-container>

  <mat-header-row *matHeaderRowDef="displayedColumns"></mat-header-row>
  <mat-row *matRowDef="let row; columns: displayedColumns;" [class.voided-row]="row.isVoided"></mat-row>

</mat-table>

<p *ngIf="transactions.length === 0" class="empty-state">
  Noch keine Transaktionen. Lege deine erste Buchung an!
</p>
```

- [ ] `frontend/src/app/features/transactions/transactions.component.scss` anlegen:

```scss
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  h1 { margin: 0; }
}

.balance-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;

  .balance-card {
    text-align: center;
    .label { color: #666; font-size: 13px; margin: 0 0 4px; }
    .amount { font-size: 22px; font-weight: 600; margin: 0; }
    &.income .amount  { color: #2e7d32; }
    &.expense .amount { color: #c62828; }
    &.positive .amount { color: #2e7d32; }
    &.negative .amount { color: #c62828; }
  }
}

.type-badge {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  &.income  { background: #e8f5e9; color: #2e7d32; }
  &.expense { background: #ffebee; color: #c62828; }
}

.income-amount  { color: #2e7d32; font-weight: 500; }
.expense-amount { color: #c62828; font-weight: 500; }

.voided-text { text-decoration: line-through; opacity: 0.5; }
.voided-row  { opacity: 0.6; background: #fafafa; }
.voided-badge {
  background: #ef9a9a;
  color: #b71c1c;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
}

.empty-state { text-align: center; color: #999; margin-top: 48px; }
```

---

### Schritt 4.3 — `TransactionFormComponent` erstellen (Dialog)

> 💡 **Warum lädt das Formular die Kategorien selbst (`ngOnInit`)?**
> Das Formular braucht die Kategorien für das Dropdown. Es holt sie selbst über den `CategoryService` — anstatt sie vom Parent-Component übergeben zu bekommen. Das macht die Component in sich geschlossen (**Self-Contained**).
>
> **Warum `MatNativeDateModule`?** Angular Material's Datepicker braucht einen Date Adapter — eine Klasse, die weiß, wie Datums-Objekte zu behandeln sind. `MatNativeDateModule` liefert den nativen JavaScript-`Date`-Adapter. Ohne ihn würde der Datepicker crashen.
>
> **`toISOString().split('T')[0]`** — Das Date-Objekt aus dem Datepicker hat Zeit- und Zeitzoneninformationen. `2026-05-27T22:00:00.000Z` wäre ein Problem. `.split('T')[0]` gibt nur den Datumsteil zurück: `2026-05-27`.

- [ ] Ordner erstellen: `frontend/src/app/features/transactions/transaction-form/`
- [ ] `transaction-form.component.ts` anlegen:

```typescript
import { Component, Inject, OnInit, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { TransactionService } from '../transaction.service';
import { CategoryService } from '../../categories/category.service';
import { Transaction, Category } from '../../../shared/models';

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule,
    MatDatepickerModule, MatNativeDateModule
  ],
  templateUrl: './transaction-form.component.html'
})
export class TransactionFormComponent implements OnInit {
  form: FormGroup;
  isEdit: boolean;
  categories: Category[] = [];

  constructor(
    private fb: FormBuilder,
    private transactionService: TransactionService,
    private categoryService: CategoryService,
    private dialogRef: MatDialogRef<TransactionFormComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: Transaction
  ) {
    this.isEdit = !!data;
    this.form = this.fb.group({
      name:            [data?.name ?? '',                        Validators.required],
      amount:          [data?.amount ?? '',                      [Validators.required, Validators.min(0.01)]],
      type:            [data?.type ?? '',                        Validators.required],
      categoryId:      [data?.categoryId ?? '',                  Validators.required],
      transactionDate: [data?.transactionDate ? new Date(data.transactionDate) : new Date(), Validators.required],
      description:     [data?.description ?? '']
    });
  }

  ngOnInit(): void {
    this.categoryService.getCategories().subscribe(cats => this.categories = cats);
  }

  save(): void {
    if (this.form.invalid) return;

    const raw = this.form.value;
    const payload = {
      ...raw,
      transactionDate: (raw.transactionDate as Date).toISOString().split('T')[0]
    };

    const action = this.isEdit
      ? this.transactionService.updateTransaction(this.data.id, payload)
      : this.transactionService.createTransaction(payload);

    action.subscribe({
      next: () => this.dialogRef.close(true),
      error: err => console.error('Fehler:', err)
    });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
```

- [ ] `transaction-form.component.html` anlegen:

```html
<h2 mat-dialog-title>{{ isEdit ? 'Transaktion bearbeiten' : 'Neue Transaktion' }}</h2>

<mat-dialog-content>
  <form [formGroup]="form" class="form-layout">

    <mat-form-field appearance="outline" class="full-width">
      <mat-label>Bezeichnung</mat-label>
      <input matInput formControlName="name">
      <mat-error *ngIf="form.get('name')?.hasError('required')">Bezeichnung erforderlich</mat-error>
    </mat-form-field>

    <div class="two-col">
      <mat-form-field appearance="outline">
        <mat-label>Betrag (€)</mat-label>
        <input matInput formControlName="amount" type="number" step="0.01" min="0">
        <mat-error *ngIf="form.get('amount')?.hasError('required')">Betrag erforderlich</mat-error>
        <mat-error *ngIf="form.get('amount')?.hasError('min')">Muss größer 0 sein</mat-error>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Typ</mat-label>
        <mat-select formControlName="type">
          <mat-option value="INCOME">Einnahme</mat-option>
          <mat-option value="EXPENSE">Ausgabe</mat-option>
        </mat-select>
        <mat-error *ngIf="form.get('type')?.hasError('required')">Typ erforderlich</mat-error>
      </mat-form-field>
    </div>

    <mat-form-field appearance="outline" class="full-width">
      <mat-label>Kategorie</mat-label>
      <mat-select formControlName="categoryId">
        <mat-option *ngFor="let cat of categories" [value]="cat.id">
          {{ cat.name }}
        </mat-option>
      </mat-select>
      <mat-error *ngIf="form.get('categoryId')?.hasError('required')">Kategorie erforderlich</mat-error>
    </mat-form-field>

    <mat-form-field appearance="outline" class="full-width">
      <mat-label>Datum</mat-label>
      <input matInput [matDatepicker]="picker" formControlName="transactionDate">
      <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
      <mat-datepicker #picker></mat-datepicker>
    </mat-form-field>

    <mat-form-field appearance="outline" class="full-width">
      <mat-label>Beschreibung (optional)</mat-label>
      <textarea matInput formControlName="description" rows="2"></textarea>
    </mat-form-field>

  </form>
</mat-dialog-content>

<mat-dialog-actions align="end">
  <button mat-button (click)="cancel()">Abbrechen</button>
  <button mat-raised-button color="primary" (click)="save()" [disabled]="form.invalid">
    {{ isEdit ? 'Speichern' : 'Erstellen' }}
  </button>
</mat-dialog-actions>
```

- [ ] `transaction-form.component.scss` anlegen:

```scss
.form-layout {
  display: flex;
  flex-direction: column;
  padding-top: 8px;
}

.full-width {
  width: 100%;
}

.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
```

✅ **Block 4 fertig wenn:** Transaktionen anlegen/stornieren funktioniert, Balance-Karten zeigen korrekte Werte.

---

## 🟦 BLOCK 5 — Dashboard (ca. 1h)

### Schritt 5.1 — Backend `dashboard_service.py` erstellen

> 💡 **Warum ein eigener DashboardService?**
> Das Dashboard aggregiert Daten aus mehreren Quellen — Transaktionen heute, Budgets, vielleicht bald Fixkosten. Es ist die Aufgabe des DashboardService, diese Daten zusammenzuführen und als eine einzige kompakte Antwort zurückzugeben. Der Frontend-Client braucht nur **einen** API-Call statt fünf verschiedene.
>
> Das ist das **Backend for Frontend (BFF)**-Pattern im Kleinen: Eine API, die genau die Daten liefert, die das Frontend in der Form braucht, in der es sie braucht.

- [ ] Neue Datei anlegen: `backend/src/app/services/dashboard_service.py`

```python
from src.app.repositories.transaction_repository import TransactionRepository

transaction_repository = TransactionRepository()


def get_summary(user_id: str) -> dict:
    income = transaction_repository.get_income_sum(user_id)
    expenses = transaction_repository.get_expense_sum(user_id)
    recent = transaction_repository.get_by_user(user_id)[:5]

    return {
        'balance': income - expenses,
        'totalIncome': income,
        'totalExpenses': expenses,
        'recentTransactions': [
            {
                'id': str(t.id),
                'name': t.name,
                'amount': float(t.amount),
                'type': t.type.value,
                'transactionDate': t.transaction_date.isoformat() if t.transaction_date else None,
                'isVoided': t.is_voided
            }
            for t in recent
        ]
    }
```

---

### Schritt 5.2 — Backend `dashboard_controller.py` + `main.py`

- [ ] Neue Datei anlegen: `backend/src/app/controller/dashboard_controller.py`

```python
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.app.services import dashboard_service

dashboard_blueprint = Blueprint('dashboard', __name__, url_prefix='/dashboard')


@dashboard_blueprint.route('', methods=['GET'])
@jwt_required()
def get_dashboard():
    user_id = get_jwt_identity()
    summary = dashboard_service.get_summary(user_id)
    return jsonify(summary), 200
```

- [ ] In `backend/src/app/main.py` ergänzen:

```python
# Import:
from src.app.controller.dashboard_controller import dashboard_blueprint

# Registrieren:
app.register_blueprint(dashboard_blueprint)
```

- [ ] Testen: `GET /dashboard` → gibt Balance + 5 letzte Transaktionen zurück

---

### Schritt 5.3 — Angular `DashboardComponent` befüllen

> 💡 **Warum `HttpClient` direkt im Component statt ein DashboardService?**
> Für einen einzelnen Endpoint, den nur das Dashboard nutzt, ist ein eigener Service Overkill. Sauberer wäre es trotzdem — du kannst ihn gerne anlegen. Für die Demo hier nutzen wir `HttpClient` direkt, um Tempo zu machen. Im Interview kannst du sagen: "Im nächsten Schritt würde ich das in einen DashboardService auslagern."
>
> **`| currency:'EUR':'symbol':'1.2-2':'de'`** — Angular's Built-in Currency Pipe. `1.2-2` bedeutet: mindestens 1 Vorkommastelle, genau 2 Nachkommastellen. `'de'` formatiert nach deutschem Standard: `2.500,00 €` statt `€2,500.00`.

- [ ] `frontend/src/app/features/dashboard/dashboard.component.ts` ersetzen:

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { environment } from '../../../environments/environment';

interface DashboardSummary {
  balance: number;
  totalIncome: number;
  totalExpenses: number;
  recentTransactions: {
    id: string;
    name: string;
    amount: number;
    type: string;
    transactionDate: string;
    isVoided: boolean;
  }[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatTableModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  summary: DashboardSummary | null = null;
  recentColumns = ['date', 'name', 'type', 'amount'];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<DashboardSummary>(`${environment.apiBaseUrl}/dashboard`)
      .subscribe(data => this.summary = data);
  }
}
```

- [ ] `frontend/src/app/features/dashboard/dashboard.component.html` anlegen:

```html
<h1>Dashboard</h1>

<div *ngIf="summary">

  <!-- Summary Cards -->
  <div class="summary-cards">

    <mat-card [class.positive]="summary.balance >= 0" [class.negative]="summary.balance < 0">
      <mat-card-content>
        <mat-icon>account_balance_wallet</mat-icon>
        <p class="card-label">Kontostand</p>
        <p class="card-amount">{{ summary.balance | currency:'EUR':'symbol':'1.2-2':'de' }}</p>
      </mat-card-content>
    </mat-card>

    <mat-card class="income-card">
      <mat-card-content>
        <mat-icon>trending_up</mat-icon>
        <p class="card-label">Einnahmen gesamt</p>
        <p class="card-amount">{{ summary.totalIncome | currency:'EUR':'symbol':'1.2-2':'de' }}</p>
      </mat-card-content>
    </mat-card>

    <mat-card class="expense-card">
      <mat-card-content>
        <mat-icon>trending_down</mat-icon>
        <p class="card-label">Ausgaben gesamt</p>
        <p class="card-amount">{{ summary.totalExpenses | currency:'EUR':'symbol':'1.2-2':'de' }}</p>
      </mat-card-content>
    </mat-card>

  </div>

  <!-- Recent Transactions -->
  <mat-card class="recent-card">
    <mat-card-header>
      <mat-card-title>Letzte Transaktionen</mat-card-title>
    </mat-card-header>
    <mat-card-content>
      <mat-table [dataSource]="summary.recentTransactions">

        <ng-container matColumnDef="date">
          <mat-header-cell *matHeaderCellDef>Datum</mat-header-cell>
          <mat-cell *matCellDef="let t">{{ t.transactionDate | date:'dd.MM.yy' }}</mat-cell>
        </ng-container>

        <ng-container matColumnDef="name">
          <mat-header-cell *matHeaderCellDef>Bezeichnung</mat-header-cell>
          <mat-cell *matCellDef="let t">{{ t.name }}</mat-cell>
        </ng-container>

        <ng-container matColumnDef="type">
          <mat-header-cell *matHeaderCellDef>Typ</mat-header-cell>
          <mat-cell *matCellDef="let t">
            <span [class]="'type-badge ' + t.type.toLowerCase()">
              {{ t.type === 'INCOME' ? 'Einnahme' : 'Ausgabe' }}
            </span>
          </mat-cell>
        </ng-container>

        <ng-container matColumnDef="amount">
          <mat-header-cell *matHeaderCellDef>Betrag</mat-header-cell>
          <mat-cell *matCellDef="let t" [class.income-amount]="t.type === 'INCOME'" [class.expense-amount]="t.type === 'EXPENSE'">
            {{ t.type === 'INCOME' ? '+' : '−' }}{{ t.amount | currency:'EUR':'symbol':'1.2-2':'de' }}
          </mat-cell>
        </ng-container>

        <mat-header-row *matHeaderRowDef="recentColumns"></mat-header-row>
        <mat-row *matRowDef="let row; columns: recentColumns;"></mat-row>
      </mat-table>
    </mat-card-content>
  </mat-card>

</div>
```

- [ ] `frontend/src/app/features/dashboard/dashboard.component.scss` anlegen:

```scss
h1 { margin-bottom: 24px; }

.summary-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;

  mat-card {
    text-align: center;
    padding: 8px;

    mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      opacity: 0.5;
      margin-bottom: 8px;
    }

    .card-label  { color: #888; font-size: 13px; margin: 0 0 4px; }
    .card-amount { font-size: 26px; font-weight: 700; margin: 0; }

    &.income-card  .card-amount { color: #2e7d32; }
    &.expense-card .card-amount { color: #c62828; }
    &.positive     .card-amount { color: #2e7d32; }
    &.negative     .card-amount { color: #c62828; }
  }
}

.recent-card { margin-top: 8px; }

.type-badge {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  &.income  { background: #e8f5e9; color: #2e7d32; }
  &.expense { background: #ffebee; color: #c62828; }
}

.income-amount  { color: #2e7d32; font-weight: 500; }
.expense-amount { color: #c62828; font-weight: 500; }
```

✅ **Block 5 fertig wenn:** Dashboard zeigt Kontostand, Einnahmen, Ausgaben und die 5 letzten Transaktionen.

---

## ✅ Abend-Check — End-to-End-Test

- [ ] Backend läuft ohne Fehler
- [ ] Kategorien anlegen → in Liste sichtbar
- [ ] Transaktion anlegen (Kategorie wählen, Betrag, Datum) → in Tabelle sichtbar
- [ ] Balance-Karten zeigen korrekte Werte
- [ ] Transaktion stornieren → Zeile ausgegraut, Balance ändert sich
- [ ] Dashboard öffnen → 3 Karten + letzte Transaktionen korrekt
- [ ] Direkt `GET /dashboard` in Postman → Summary-JSON stimmt

> 🎉 **Wenn das alles steht:** Dein erstes echtes Full-Stack-Feature läuft. Datenbank → Repository → Service → API → Angular → UI. Das ist genau, was ein Interviewer sehen will.
