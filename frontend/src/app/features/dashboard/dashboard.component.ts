import { Component, OnInit, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';

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
  imports: [
    CurrencyPipe,
    DatePipe,
    MatCardModule,
    MatIconModule,
    MatTableModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  readonly summary = signal<DashboardSummary | null>(null);
  recentColumns = ['date', 'name', 'type', 'amount'];

  private readonly http = inject(HttpClient);

  ngOnInit(): void {
    this.http
      .get<DashboardSummary>(`${environment.apiBaseUrl}/dashboard`)
      .subscribe((data) => this.summary.set(data));
  }
}
