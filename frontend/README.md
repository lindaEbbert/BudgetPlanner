# BudgetPlanner — Frontend

Angular 20 SPA with JWT authentication, lazy-loaded routing, and standalone components.

## Tech Stack

- **Angular** 20 (standalone components, signals, OnPush)
- **TypeScript** 5.8
- **Angular CLI** 21.2

## Architecture

```
src/app/
├── core/                        # Singleton infrastructure (loaded once)
│   ├── guards/
│   │   └── auth.guard.ts        # Blocks unauthenticated access to protected routes
│   ├── interceptors/
│   │   └── jwt.interceptor.ts   # Attaches Authorization header to every request
│   ├── services/
│   │   ├── auth.service.ts      # Login, logout, token management
│   │   └── api.service.ts       # Base HTTP service
│   └── layout/
│       └── layout.component     # App shell for authenticated pages (nav, router-outlet)
├── features/                    # Lazy-loaded feature areas
│   ├── auth/login/              # Login page (public)
│   ├── dashboard/               # Overview (protected)
│   ├── transactions/            # Transaction list (protected)
│   ├── categories/              # Category management (protected)
│   └── budgets/                 # Budget planning (protected)
└── shared/
    └── models/                  # TypeScript interfaces (User, Category, Transaction, ...)
```

## Routing

| Path | Component | Auth required |
|---|---|---|
| `/login` | `LoginComponent` | No |
| `/` | Redirects to `/dashboard` | Yes |
| `/dashboard` | `DashboardComponent` | Yes |
| `/transactions` | `TransactionsComponent` | Yes |
| `/categories` | `CategoriesComponent` | Yes |
| `/budgets` | `BudgetsComponent` | Yes |
| `/**` | Redirects to `/` | — |

All protected routes are wrapped by the `LayoutComponent` and guarded by `authGuard`.

## Auth Flow

1. User logs in via `POST /auth/login` → receives `access_token`
2. Token is stored as `access_token` in `localStorage`
3. `JwtInterceptor` reads the token and adds `Authorization: Bearer <token>` to every outgoing HTTP request
4. `authGuard` checks for a valid token on each route change — redirects to `/login` if missing

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

## Development

**Start dev server**
```bash
ng serve
```
App runs at `http://localhost:4200` with hot reload.

**Build for production**
```bash
ng build
```
Output goes to `dist/`. Production builds are optimized and minified.

**Run unit tests**
```bash
ng test
```
Uses [Vitest](https://vitest.dev/) as the test runner.

**Generate a component**
```bash
ng generate component features/my-feature/my-feature
```

## Code Conventions

- **Standalone components** — no NgModules
- **Signals** for local state (`signal()`, `computed()`)
- **OnPush** change detection on all components
- **Native control flow** (`@if`, `@for`) instead of `*ngIf` / `*ngFor`
- **`inject()`** instead of constructor injection
- **Reactive Forms** instead of template-driven forms
