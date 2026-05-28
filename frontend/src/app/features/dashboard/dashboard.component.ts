import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { MonthSelectorComponent } from '../../shared/components/month-selector/month-selector.component';

interface DashboardSummary {
  month: number;
  year: number;
  monthIncome: number;
  monthExpenses: number;
  projectedFixedCosts: number;
  freeToUse: number;
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
  imports: [
    CurrencyPipe,
    DatePipe,
    MatCardModule,
    MatIconModule,
    MatTableModule,
    MonthSelectorComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private readonly http = inject(HttpClient);

  readonly summary = signal<DashboardSummary | null>(null);
  readonly recentColumns = ['date', 'name', 'type', 'amount'];

  constructor() {
    const now = new Date();
    this.loadSummary(now.getMonth() + 1, now.getFullYear());
  }

  loadSummary(month: number, year: number): void {
    this.http
      .get<DashboardSummary>(`${environment.apiBaseUrl}/dashboard`, {
        params: { month: month.toString(), year: year.toString() },
      })
      .subscribe((data) => this.summary.set(data));
  }

  onMonthChange(event: { month: number; year: number }): void {
    this.loadSummary(event.month, event.year);
  }
}
