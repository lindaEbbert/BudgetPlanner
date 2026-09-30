# BudgetPlanner — Frontend

Angular 21 single-page app with Angular Material, JWT authentication, lazy-loaded routing, and standalone components.
The UI is in German.

## Tech Stack

- **Angular** 21 (standalone components, signals, OnPush)
- **Angular Material** 21 + Angular CDK (sidenav layout, tables, dialogs, datepickers)
- **TypeScript** 5.9
- **Vitest** + jsdom for unit tests
- **Prettier** for formatting

## Setup

**Prerequisites:** Node.js with npm, and the backend running at `http://localhost:5000`
(see [Backend README](../backend/README.md#setup)).

```bash
cd frontend
npm install
npm start          # same as: ng serve
```

The app runs at `http://localhost:4200` with hot reload.

## Architecture

```
src/app/
├── core/                              # Singleton infrastructure (loaded once)
│   ├── guards/
│   │   └── auth.guard.ts              # Blocks unauthenticated access to protected routes
│   ├── interceptors/
│   │   └── jwt.interceptor.ts         # Attaches the Authorization header to every request
│   ├── services/
│   │   ├── auth.service.ts            # Register, login, logout, token management
│   │   └── api.service.ts             # Base HTTP service
│   └── layout/
│       └── layout.component           # App shell for authenticated pages (sidenav, toolbar, router-outlet)
├── features/                          # Lazy-loaded feature areas
│   ├── auth/
│   │   ├── login/                     # Login page (public)
│   │   └── register/                  # Registration page, logs the new user in right away (public)
│   ├── dashboard/                     # "Free to Use" overview for a chosen date
│   ├── transactions/                  # Transaction list, balance, create/edit dialog, voiding
│   │   ├── transaction-form/          # Dialog incl. category suggestion flow
│   │   └── category-suggestion.service.ts
│   ├── fixed-costs/                   # Fixed-cost list and monthly preview
│   │   └── fixed-costs-form/
│   ├── categories/                    # Category management
│   │   ├── category-form/
│   │   └── deleted-category-choice/   # Restore-or-create choice when a deleted category has the name
│   └── budgets/                       # Monthly budgets with progress
│       └── budget-form/
└── shared/
    ├── components/
    │   └── month-selector/            # Month/year switcher used by budgets and fixed costs
    ├── models/                        # TypeScript interfaces (User, Category, Transaction, ...)
    └── utils/
        └── iso-date.ts                # Local date ↔ ISO date string (no timezone shift)
```

Each feature has its own HTTP service (e.g. `transaction.service.ts`) next to its components.

## Routing

| Path | Component | Auth required |
|---|---|---|
| `/login` | `LoginComponent` | No |
| `/register` | `RegisterComponent` | No |
| `/` | Redirects to `/dashboard` | Yes |
| `/dashboard` | `DashboardComponent` | Yes |
| `/transactions` | `TransactionsComponent` | Yes |
| `/fixed-costs` | `FixedCostsComponent` | Yes |
| `/categories` | `CategoriesComponent` | Yes |
| `/budgets` | `BudgetsComponent` | Yes |
| `/**` | Redirects to `/` | — |

All protected routes are children of `LayoutComponent` and guarded by `authGuard`.

## Auth Flow

1. The user registers via `POST /auth/register` (and is then logged in automatically) or logs in via `POST /auth/login` → receives `access_token`
2. The token is stored as `access_token` in `localStorage`
3. `jwtInterceptor` reads the token and adds `Authorization: Bearer <token>` to every outgoing HTTP request
4. `authGuard` checks on each route change that a token exists — redirects to `/login` if it is missing
5. Logout (toolbar button) removes the token and navigates to `/login`

## Environment Configuration

| File | Used for |
|---|---|
| `src/environments/environment.ts` | Production build |
| `src/environments/environment.development.ts` | Local development (`ng serve`) |

```ts
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:5000'
};
```

For a production build, set `apiBaseUrl` in `environment.ts` to the real API URL.

## Development

| Command | Purpose |
|---|---|
| `npm start` / `ng serve` | Dev server at `http://localhost:4200` with hot reload |
| `npm run build` / `ng build` | Production build into `dist/` (optimized and minified) |
| `npm run watch` | Development build that rebuilds on changes |
| `npm test` / `ng test` | Unit tests with [Vitest](https://vitest.dev/) |
| `ng generate component features/my-feature/my-feature` | Generate a component |

## Code Conventions

Full guidelines for agents and contributors: [`.claude/CLAUDE.md`](.claude/CLAUDE.md) and [`AGENTS.md`](AGENTS.md).

- **Standalone components** — no NgModules
- **Signals** for local state (`signal()`, `computed()`)
- **OnPush** change detection on all components
- **Native control flow** (`@if`, `@for`) instead of `*ngIf` / `*ngFor`
- **`inject()`** instead of constructor injection
- **Reactive Forms** instead of template-driven forms
- **Dates** are sent to the API as local ISO dates via `shared/utils/iso-date.ts`, never via `toISOString()`
