import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

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
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private readonly http = inject(HttpClient);

  readonly summary = signal<DashboardSummary | null>(null);
  readonly recentColumns = ['date', 'name', 'type', 'amount'];

  readonly selectedDate = signal(new Date());

  constructor() {
    this.loadSummary(this.selectedDate().getMonth() + 1, this.selectedDate().getFullYear());
  }

  loadSummary(month: number, year: number): void {
    this.http
      .get<DashboardSummary>(`${environment.apiBaseUrl}/dashboard`, {
        params: { month: month.toString(), year: year.toString() },
      })
      .subscribe((data) => this.summary.set(data));
  }

  onDateChange(date: Date | null): void {
    if (!date) return;
    this.selectedDate.set(date);
    this.loadSummary(date.getMonth() + 1, date.getFullYear());
  }
}
