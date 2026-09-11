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
  balance: number;
  remainingBudgets: number;
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
    const d = this.selectedDate();
    this.loadSummary(d.getMonth() + 1, d.getFullYear(), d.getDate());
  }

  loadSummary(month: number, year: number, day: number): void {
    this.http
      .get<DashboardSummary>(`${environment.apiBaseUrl}/dashboard`, {
        params: {
          month: month.toString(),
          year: year.toString(),
          day: day.toString(),
        },
      })
      .subscribe((data) => this.summary.set(data));
  }

  onDateChange(date: Date | null): void {
    if (!date) return;
    this.selectedDate.set(date);
    this.loadSummary(date.getMonth() + 1, date.getFullYear(), date.getDate());
  }
}
