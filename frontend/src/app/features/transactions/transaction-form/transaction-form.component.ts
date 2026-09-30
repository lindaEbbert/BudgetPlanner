import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  Injector,
  afterNextRender,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { Observable, Subscription } from 'rxjs';
import { TransactionService } from '../transaction.service';
import { CategoryService, deletedCategoryIn } from '../../categories/category.service';
import { DeletedCategoryChoiceComponent } from '../../categories/deleted-category-choice/deleted-category-choice.component';
import { FixedCostService} from '../../fixed-costs/fixed-cost.service';
import { CategorySuggestionService } from '../category-suggestion.service';
import { FixedCost } from '../../../shared/models';
import { fromIsoDate, toIsoDate } from '../../../shared/utils/iso-date';
import {
  Transaction,
  Category,
  CategorySuggestion,
  DeletedCategory,
  CreateTransactionDto,
  TransactionType,
} from '../../../shared/models';

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
    DeletedCategoryChoiceComponent,
  ],
  templateUrl: './transaction-form.component.html',
  // The .scss next to this component is not wired up, and wiring it would change
  // the layout of the whole dialog, so the one rule the button needs lives here.
  styles: '.suggest-category { margin-left: 12px; }',
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
  private readonly injector = inject(Injector);
  private readonly categorySelect = viewChild<MatSelect>('categorySelect');
  private readonly newCategoryNameInput = viewChild('newCategoryNameInput', { read: ElementRef });

  readonly categories = signal<Category[]>([]);
  readonly fixedCosts = signal<FixedCost[]>([]);
  readonly isEdit = !!this.data;
  private openSuggestionRequest?: Subscription;
  readonly newCategoryOffer = signal<'none' | 'open' | 'creating' | 'failed'>('none');
  // A deleted category with the offered name; while set, the offer asks what to do about it.
  readonly deletedCategory = signal<DeletedCategory | null>(null);
  readonly offeredCategory = signal<Category | null>(null);
  // What became of the suggestion the user asked for: on its way, or nothing found.
  readonly requestedSuggestion = signal<'none' | 'waiting' | 'nothing'>('none');
  readonly newCategoryName = this.fb.nonNullable.control('', Validators.required);

  readonly form = this.fb.group({
    name: [this.data?.name ?? '', Validators.required],
    amount: [this.data?.amount ?? '', [Validators.required, Validators.min(0.01)]],
    type: [this.data?.type ?? '', Validators.required],
    categoryId: [this.data?.categoryId ?? ''],
    transactionDate: [
      this.data?.transactionDate ? fromIsoDate(this.data.transactionDate) : new Date(),
      Validators.required,
    ],
    fixedCostId: [this.data?.fixedCostId ?? ''],
    description: [this.data?.description ?? ''],
  });

  constructor() {
    // A report about one name and type says nothing about the next.
    this.form.valueChanges.subscribe(() => {
      if (this.requestedSuggestion() === 'nothing') this.requestedSuggestion.set('none');
    });
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
      this.withdrawOffersIfObsolete();
      this.suggestCategoryIfOpen();
    });
    this.form.controls.categoryId.valueChanges.subscribe(() => this.withdrawOffersIfObsolete());
    this.form.controls.fixedCostId.valueChanges.subscribe((fixedCostId) => {
      const fc = this.fixedCosts().find((f) => f.id === fixedCostId);
      if (!fc) return;
      this.form.controls.amount.setValue(fc.amount);
      if (fc.categoryId) {
        this.form.controls.categoryId.setValue(fc.categoryId);
      }
      this.withdrawOffersIfObsolete();
    });
  }


  save(): void {
    if (this.form.invalid) return;

    const raw = this.form.getRawValue();
    const payload: CreateTransactionDto = {
      name: raw.name!,
      amount: Number(raw.amount),
      type: raw.type as TransactionType,
      transactionDate: toIsoDate(raw.transactionDate as Date),
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
    if (!this.categoryIsOpenForSuggestion() || this.hasOpenOffer()) return;
    // A suggestion the user asked for is theirs to answer, so nothing overtakes it.
    if (this.requestedSuggestion() === 'waiting') return;

    this.requestSuggestion((suggestion) => {
      // Check again what the user changed while the answer was on its way.
      if (!suggestion || !this.categoryIsOpenForSuggestion()) return;
      if (suggestion.categoryId) {
        this.form.controls.categoryId.setValue(suggestion.categoryId);
      } else if (suggestion.newCategoryName) {
        this.offerNewCategory(suggestion.newCategoryName);
      }
    });
  }

  // Runs when the user asks for a suggestion, whatever the category field holds.
  suggestCategoryOnRequest(): void {
    // The button stays enabled while waiting so it keeps the focus it was given,
    // which leaves it to this to ignore a second click.
    if (!this.canSuggestCategory() || this.requestedSuggestion() === 'waiting') return;

    this.requestedSuggestion.set('waiting');
    this.requestSuggestion((suggestion) => {
      this.requestedSuggestion.set('none');
      // Check again what the user changed while the answer was on its way.
      if (!this.categoryIsEditable()) return;
      const suggested = this.categories().find((c) => c.id === suggestion?.categoryId);
      // Accepting is left to the user, as either answer replaces what the field holds.
      if (suggested) {
        this.offeredCategory.set(suggested);
      } else if (suggestion?.newCategoryName) {
        this.offerNewCategory(suggestion.newCategoryName);
      } else {
        // The user asked for this one, so an empty answer is worth saying out loud.
        this.requestedSuggestion.set('nothing');
      }
    });
  }

  acceptSuggestedCategory(): void {
    const suggested = this.offeredCategory();
    if (!suggested) return;
    this.form.controls.categoryId.setValue(suggested.id);
    this.closeSuggestedCategoryOffer();
  }

  rejectSuggestedCategory(): void {
    this.closeSuggestedCategoryOffer();
  }

  // Both triggers ask the same question and differ in what they do with the answer,
  // which can take over 10 s to arrive. A failed call answers with nothing: a
  // suggestion is optional, so the user simply picks the category.
  private requestSuggestion(useAnswer: (suggestion: CategorySuggestion | null) => void): void {
    const { name, description, type } = this.form.getRawValue();
    if (!name?.trim() || !type) return;

    // A newer request makes a pending answer outdated.
    this.openSuggestionRequest?.unsubscribe();
    this.openSuggestionRequest = this.categorySuggestionService
      .suggestCategory({
        name,
        description: description || undefined,
        type: type as TransactionType,
      })
      .subscribe({
        next: useAnswer,
        error: () => useAnswer(null),
      });
  }

  private offerNewCategory(name: string): void {
    this.newCategoryName.setValue(name);
    this.deletedCategory.set(null);
    this.newCategoryOffer.set('open');
  }

  acceptNewCategory(): void {
    this.selectCategoryFrom(this.categoryService.createCategory({ name: this.newCategoryName.value }));
  }

  restoreDeletedCategory(): void {
    const deletedCategory = this.deletedCategory();
    if (!deletedCategory) return;
    this.selectCategoryFrom(this.categoryService.restoreCategory(deletedCategory.id));
  }

  // Create the offered category although a deleted one has the name; that one stays deleted.
  createDespiteDeletedCategory(): void {
    this.selectCategoryFrom(
      this.categoryService.createCategory({
        name: this.newCategoryName.value,
        ignoreDeletedCategory: true,
      }),
    );
  }

  // Back to the offer with its editable name, nothing created.
  dismissDeletedCategory(): void {
    this.deletedCategory.set(null);
    // Removing the choice takes the focused button with it, so hand the focus on
    // once the offer's name field is back.
    afterNextRender(() => this.newCategoryNameInput()?.nativeElement.focus(), {
      injector: this.injector,
    });
  }

  private selectCategoryFrom(action: Observable<Category>): void {
    this.newCategoryOffer.set('creating');
    action.subscribe({
      next: (category) => {
        this.categories.update((categories) => [...categories, category]);
        this.form.controls.categoryId.setValue(category.id);
        this.closeNewCategoryOffer();
      },
      error: (err) => {
        const deletedCategory = deletedCategoryIn(err);
        this.deletedCategory.set(deletedCategory);
        // Either ask first whether the deleted category should come back instead, or keep
        // the offer open so the user can change the name, try again or reject it.
        this.newCategoryOffer.set(deletedCategory ? 'open' : 'failed');
      },
    });
  }

  rejectNewCategory(): void {
    this.closeNewCategoryOffer();
  }

  // Whatever set the category, hid it or took it over, an offer no longer applies.
  // The focus stays where the user is working, so this does not hand it on.
  private withdrawOffersIfObsolete(): void {
    // A new category is only ever offered for an empty field.
    if (!this.categoryIsOpenForSuggestion()) {
      this.dropNewCategoryOffer();
    }
    // Replacing the category stays on offer until the field is out of the user's hands.
    if (!this.categoryIsEditable()) {
      this.offeredCategory.set(null);
    }
  }

  // Removing the offer takes the focused button with it, so hand the focus on.
  private closeNewCategoryOffer(): void {
    this.dropNewCategoryOffer();
    this.categorySelect()?.focus();
  }

  // A deleted category only ever belongs to an open offer, so it goes with it.
  private dropNewCategoryOffer(): void {
    this.newCategoryOffer.set('none');
    this.deletedCategory.set(null);
  }

  private closeSuggestedCategoryOffer(): void {
    this.offeredCategory.set(null);
    this.categorySelect()?.focus();
  }

  // The button needs the fields a suggestion is built from, and it keeps out of the
  // way while a fixed cost determines the category or an offer waits to be answered.
  canSuggestCategory(): boolean {
    const { name, type } = this.form.getRawValue();
    if (!name?.trim() || !type) return false;
    return this.categoryIsEditable() && !this.hasOpenOffer();
  }

  // The user fills in the category as long as it is shown and no fixed cost determines it.
  private categoryIsEditable(): boolean {
    const { type, fixedCostId } = this.form.getRawValue();
    return type !== 'INITIAL' && !fixedCostId;
  }

  // A suggestion only fills an empty, visible category that no fixed cost determines.
  private categoryIsOpenForSuggestion(): boolean {
    return this.categoryIsEditable() && !this.form.getRawValue().categoryId;
  }

  // An open offer has to be accepted or rejected first; a new answer would discard it.
  private hasOpenOffer(): boolean {
    return this.newCategoryOffer() !== 'none' || !!this.offeredCategory();
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
