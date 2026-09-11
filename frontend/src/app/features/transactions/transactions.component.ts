import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TransactionService } from './transaction.service';
import { Transaction, BalanceSummary } from '../../shared/models';
import { TransactionFormComponent } from './transaction-form/transaction-form.component';
import { CategoryService } from '../categories/category.service';
import { Category } from '../../shared/models';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-transactions',
  imports: [
    CurrencyPipe,
    DatePipe,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatCardModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransactionsComponent {
  private readonly transactionService = inject(TransactionService);
  private readonly categoryService = inject(CategoryService);
  private readonly dialog = inject(MatDialog);

  readonly selectedDate = signal(new Date());
  readonly selectedMonth = computed(() => this.selectedDate().getMonth() + 1);
  readonly selectedYear = computed(() => this.selectedDate().getFullYear());
  readonly selectedDay = computed(() => this.selectedDate().getDate());
  readonly transactions = signal<Transaction[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly categoryMap = computed(() => new Map(this.categories().map((c) => [c.id, c.name])));
  readonly balance = signal<BalanceSummary>({
    income: 0,
    expense: 0,
    initialBalance: 0,
    balance: 0,
  });
  readonly displayedColumns = ['date', 'name', 'type', 'amount', 'status', 'actions'];

  constructor() {
    const d = this.selectedDate();
    this.loadAll(d.getMonth() + 1, d.getFullYear(), d.getDate());
  }

  loadAll(month: number, year: number, day: number): void {
    this.transactionService
      .getTransactions(month, year, day)
      .subscribe((t) => this.transactions.set(t));
    this.transactionService.getBalance(month, year, day).subscribe((b) => this.balance.set(b));
    this.categoryService.getCategories().subscribe((cats) => this.categories.set(cats));
  }

  onDateChange(date: Date | null): void {
    if (!date) return;
    this.selectedDate.set(date);
    this.loadAll(date.getMonth() + 1, date.getFullYear(), date.getDate());
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(TransactionFormComponent, { width: '520px' });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadAll(this.selectedMonth(), this.selectedYear(), this.selectedDay());
    });
  }

  openEditDialog(transaction: Transaction): void {
    const ref = this.dialog.open(TransactionFormComponent, {
      width: '520px',
      data: transaction,
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadAll(this.selectedMonth(), this.selectedYear(), this.selectedDay());
    });
  }

  voidTransaction(id: string): void {
    if (
      confirm(
        'Transaktion wirklich stornieren? Sie bleibt sichtbar, wird aber nicht mehr gewertet.',
      )
    ) {
      this.transactionService
        .voidTransaction(id)
        .subscribe(() => this.loadAll(this.selectedMonth(), this.selectedYear(), this.selectedDay()));
    }
  }
}
