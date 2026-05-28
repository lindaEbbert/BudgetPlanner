import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { BudgetService } from './budget.service';
import { CategoryService } from '../categories/category.service';
import { Budget, Category } from '../../shared/models';
import { BudgetFormComponent } from './budget-form/budget-form.component';

@Component({
  selector: 'app-budgets',
  imports: [
    CurrencyPipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatDialogModule,
  ],
  templateUrl: './budgets.component.html',
  styleUrl: './budgets.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BudgetsComponent {
  private readonly budgetService = inject(BudgetService);
  private readonly categoryService = inject(CategoryService);
  private readonly dialog = inject(MatDialog);

  readonly budgets = signal<Budget[]>([]);
  readonly categories = signal<Category[]>([]);

  readonly categoryMap = computed(() => new Map(this.categories().map((c) => [c.id, c.name])));

  private readonly now = new Date();
  readonly currentMonth = this.now.getMonth() + 1;
  readonly currentYear = this.now.getFullYear();

  constructor() {
    this.loadAll();
  }

  loadAll(): void {
    this.budgetService
      .getBudgets(this.currentMonth, this.currentYear)
      .subscribe((b) => this.budgets.set(b));
    this.categoryService.getCategories().subscribe((c) => this.categories.set(c));
  }

  getProgressColor(percentage: number): 'primary' | 'accent' | 'warn' {
    if (percentage >= 90) return 'warn'; // rot: gefährlich
    if (percentage >= 70) return 'accent'; // gelb: Achtung
    return 'primary'; // grün: ok
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(BudgetFormComponent, {
      width: '440px',
      data: { categories: this.categories() },
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadAll();
    });
  }

  deleteBudget(id: string): void {
    if (confirm('Budget wirklich löschen?')) {
      this.budgetService.deleteBudget(id).subscribe(() => this.loadAll());
    }
  }
}
