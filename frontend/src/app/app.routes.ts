import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: '',
    loadComponent: () => import('./core/layout/layout.component').then((m) => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'fixed-costs',
        loadComponent: () =>
          import('./features/fixed-costs/fixed-costs.component').then((m) => m.FixedCostsComponent),
      },
      {
        path: 'transactions',
        loadComponent: () =>
          import('./features/transactions/transactions.component').then(
            (m) => m.TransactionsComponent,
          ),
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./features/categories/categories.component').then((m) => m.CategoriesComponent),
      },
      {
        path: 'budgets',
        loadComponent: () =>
          import('./features/budgets/budgets.component').then((m) => m.BudgetsComponent),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];
