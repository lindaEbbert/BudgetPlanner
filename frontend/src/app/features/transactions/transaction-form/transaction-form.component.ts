import { Component, ChangeDetectionStrategy, inject, signal, viewChild } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { Subscription } from 'rxjs';
import { TransactionService } from '../transaction.service';
import { CategoryService } from '../../categories/category.service';
import { FixedCostService} from '../../fixed-costs/fixed-cost.service';
import { CategorySuggestionService } from '../category-suggestion.service';
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
  private readonly categorySuggestionService = inject(CategorySuggestionService);
  private readonly dialogRef = inject(MatDialogRef<TransactionFormComponent>);
  readonly data: Transaction | null = inject(MAT_DIALOG_DATA, { optional: true });
  private readonly categorySelect = viewChild<MatSelect>('categorySelect');

  readonly categories = signal<Category[]>([]);
  readonly fixedCosts = signal<FixedCost[]>([]);
  readonly isEdit = !!this.data;
  private pendingSuggestion?: Subscription;
  readonly newCategoryOffer = signal<'none' | 'open' | 'creating' | 'failed'>('none');
  readonly newCategoryName = this.fb.nonNullable.control('', Validators.required);

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

    this.form.controls.type.valueChanges.subscribe((type) => {
      const categoryControl = this.form.controls.categoryId;
      if (type === 'INITIAL') {
        categoryControl.clearValidators();
        categoryControl.setValue('');
      } else {
        categoryControl.setValidators(Validators.required);
      }
      categoryControl.updateValueAndValidity();
      this.withdrawNewCategoryOfferIfObsolete();
      this.suggestCategoryIfOpen();
    });
    this.form.controls.categoryId.valueChanges.subscribe(() =>
      this.withdrawNewCategoryOfferIfObsolete(),
    );
    this.form.controls.fixedCostId.valueChanges.subscribe((fixedCostId) => {
      const fc = this.fixedCosts().find((f) => f.id === fixedCostId);
      if (!fc) return;
      this.form.controls.amount.setValue(fc.amount);
      if (fc.categoryId) {
        this.form.controls.categoryId.setValue(fc.categoryId);
      }
      this.withdrawNewCategoryOfferIfObsolete();
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

  // Runs when the name field is left or the type is chosen, whichever comes last.
  suggestCategoryIfOpen(): void {
    const { name, description, type } = this.form.getRawValue();
    if (!name?.trim() || !type || !this.categoryIsOpenForSuggestion()) return;
    // An open offer has to be accepted or rejected first; a new answer would discard it.
    if (this.newCategoryOffer() !== 'none') return;

    // A newer name or type makes a pending answer outdated.
    this.pendingSuggestion?.unsubscribe();
    this.pendingSuggestion = this.categorySuggestionService
      .suggestCategory({
        name,
        description: description || undefined,
        type: type as TransactionType,
      })
      .subscribe({
        next: ({ categoryId, newCategoryName }) => {
          // Answers can take over 10 s, so check again what the user changed meanwhile.
          if (!this.categoryIsOpenForSuggestion()) return;
          if (categoryId) {
            this.form.controls.categoryId.setValue(categoryId);
          } else if (newCategoryName) {
            this.newCategoryName.setValue(newCategoryName);
            this.newCategoryOffer.set('open');
          }
        },
        // A suggestion is optional; on failure the user simply picks the category.
        error: () => {},
      });
  }

  acceptNewCategory(): void {
    this.newCategoryOffer.set('creating');
    this.categoryService.createCategory({ name: this.newCategoryName.value }).subscribe({
      next: (category) => {
        this.categories.update((categories) => [...categories, category]);
        this.form.controls.categoryId.setValue(category.id);
        this.closeNewCategoryOffer();
      },
      // Keep the offer open so the user can change the name, try again or reject it.
      error: () => this.newCategoryOffer.set('failed'),
    });
  }

  rejectNewCategory(): void {
    this.closeNewCategoryOffer();
  }

  // Whatever set the category, hid it or took it over, the offer no longer applies.
  // The focus stays where the user is working, so this does not hand it on.
  private withdrawNewCategoryOfferIfObsolete(): void {
    if (!this.categoryIsOpenForSuggestion()) {
      this.newCategoryOffer.set('none');
    }
  }

  // Removing the offer takes the focused button with it, so hand the focus on.
  private closeNewCategoryOffer(): void {
    this.newCategoryOffer.set('none');
    this.categorySelect()?.focus();
  }

  // A suggestion only fills an empty, visible category that no fixed cost determines.
  private categoryIsOpenForSuggestion(): boolean {
    const { type, categoryId, fixedCostId } = this.form.getRawValue();
    return type !== 'INITIAL' && !categoryId && !fixedCostId;
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
