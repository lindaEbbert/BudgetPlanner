import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
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
  ],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransactionsComponent {
  private readonly transactionService = inject(TransactionService);
  private readonly dialog = inject(MatDialog);

  readonly transactions = signal<Transaction[]>([]);
  readonly balance = signal<BalanceSummary>({ income: 0, expense: 0, initialBalance: 0, balance: 0 });
  readonly displayedColumns = ['date', 'name', 'type', 'amount', 'status', 'actions'];

  constructor() {
    this.loadAll();
  }

  loadAll(): void {
    this.transactionService.getTransactions().subscribe((t) => this.transactions.set(t));
    this.transactionService.getBalance().subscribe((b) => this.balance.set(b));
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(TransactionFormComponent, { width: '520px' });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadAll();
    });
  }

  openEditDialog(transaction: Transaction): void {
    const ref = this.dialog.open(TransactionFormComponent, {
      width: '520px',
      data: transaction,
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadAll();
    });
  }

  voidTransaction(id: string): void {
    if (
      confirm(
        'Transaktion wirklich stornieren? Sie bleibt sichtbar, wird aber nicht mehr gewertet.',
      )
    ) {
      this.transactionService.voidTransaction(id).subscribe(() => this.loadAll());
    }
  }
}
