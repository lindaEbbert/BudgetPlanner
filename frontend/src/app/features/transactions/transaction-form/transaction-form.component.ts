import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { TransactionService } from '../transaction.service';
import { CategoryService } from '../../categories/category.service';
import { FixedCostService} from '../../fixed-costs/fixed-cost.service';
import { FixedCost } from '../../../shared/models';
import { Transaction, Category, CreateTransactionDto, TransactionType } from '../../../shared/models';

@Component({
  selector: 'app-transaction-form',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
  ],
  templateUrl: './transaction-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransactionFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly transactionService = inject(TransactionService);
  private readonly categoryService = inject(CategoryService);
  private readonly fixedCostService = inject(FixedCostService);
  private readonly dialogRef = inject(MatDialogRef<TransactionFormComponent>);
  readonly data: Transaction | null = inject(MAT_DIALOG_DATA, { optional: true });

  readonly categories = signal<Category[]>([]);
  readonly fixedCosts = signal<FixedCost[]>([]);
  readonly isEdit = !!this.data;

  readonly form = this.fb.group({
    name: [this.data?.name ?? '', Validators.required],
    amount: [this.data?.amount ?? '', [Validators.required, Validators.min(0.01)]],
    type: [this.data?.type ?? '', Validators.required],
    categoryId: [this.data?.categoryId ?? ''],
    transactionDate: [
      this.data?.transactionDate ? new Date(this.data.transactionDate) : new Date(),
      Validators.required,
    ],
    fixedCostId: [this.data?.fixedCostId ?? ''],
    description: [this.data?.description ?? ''],
  });

  constructor() {
    this.categoryService.getCategories().subscribe((cats) => this.categories.set(cats));
    this.fixedCostService.getFixedCosts().subscribe((fc) => this.fixedCosts.set(fc));

    this.form.get('type')?.valueChanges.subscribe((type) => {
      const categoryControl = this.form.get('categoryId');
      if (type === 'INITIAL') {
        categoryControl?.clearValidators();
        categoryControl?.setValue('');
      } else {
        categoryControl?.setValidators(Validators.required);
      }
      categoryControl?.updateValueAndValidity();
    });
    this.form.get('fixedCostId')?.valueChanges.subscribe((fixedCostId) => {
      if (fixedCostId) {
        const fc = this.fixedCosts().find((f) => f.id === fixedCostId);
        if (fc) {
          this.form.get('amount')?.setValue(fc.amount);
          if (fc.categoryId) {
            this.form.get('categoryId')?.setValue(fc.categoryId);
          }
        }
      }
    });
  }


  save(): void {
    if (this.form.invalid) return;

    const raw = this.form.getRawValue();
    const payload: CreateTransactionDto = {
      name: raw.name!,
      amount: Number(raw.amount),
      type: raw.type as TransactionType,
      transactionDate: (raw.transactionDate as Date).toISOString().split('T')[0],
      categoryId: raw.categoryId || undefined,
      fixedCostId: raw.fixedCostId || undefined,
      description: raw.description || undefined,
    };

    const action = this.isEdit
      ? this.transactionService.updateTransaction(this.data!.id, payload)
      : this.transactionService.createTransaction(payload);

    action.subscribe({
      next: () => this.dialogRef.close(true),
      error: (err) => console.error('Fehler:', err),
    });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
