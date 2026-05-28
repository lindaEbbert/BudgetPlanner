import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { BudgetService } from '../budget.service';
import { Category } from '../../../shared/models';

interface DialogData {
  categories: Category[];
}

const MONTH_NAMES = [
  '', 'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
];

@Component({
  selector: 'app-budget-form',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './budget-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BudgetFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly budgetService = inject(BudgetService);
  private readonly dialogRef = inject(MatDialogRef<BudgetFormComponent>);
  readonly data: DialogData = inject(MAT_DIALOG_DATA);

  private readonly now = new Date();

  readonly months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: MONTH_NAMES[i + 1]
  }));

  readonly form = this.fb.group({
    categoryId: ['', Validators.required],
    limitAmount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    month: [this.now.getMonth() + 1, Validators.required],
    year: [this.now.getFullYear(), Validators.required],
  });

  save(): void {
    if (this.form.invalid) return;
    const value = this.form.getRawValue();

    this.budgetService.createBudget({
      categoryId: value.categoryId!,
      limitAmount: value.limitAmount!,
      month: value.month!,
      year: value.year!,
    }).subscribe({
      next: () => this.dialogRef.close(true),
      error: err => console.error('Budget-Fehler:', err),
    });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
