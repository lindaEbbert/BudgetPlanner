import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Observable } from 'rxjs';
import { CategoryService, deletedCategoryIn } from '../category.service';
import { DeletedCategoryChoiceComponent } from '../deleted-category-choice/deleted-category-choice.component';
import { Category, DeletedCategory } from '../../../shared/models';

@Component({
  selector: 'app-category-form',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    DeletedCategoryChoiceComponent,
  ],
  templateUrl: './category-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly categoryService = inject(CategoryService);
  private readonly dialogRef = inject(MatDialogRef<CategoryFormComponent>);
  readonly data: Category | null = inject(MAT_DIALOG_DATA, { optional: true });
  private readonly nameInput = viewChild.required('nameInput', { read: ElementRef });

  readonly isEdit = !!this.data;
  // A deleted category with the entered name, reported by the backend and waiting for a choice.
  readonly deletedCategory = signal<DeletedCategory | null>(null);
  readonly busy = signal(false);

  readonly form = this.fb.group({
    name: [this.data?.name ?? '', Validators.required],
  });

  constructor() {
    // The choice is about the name it was reported for, not an edited one.
    this.form.controls.name.valueChanges.subscribe(() => this.deletedCategory.set(null));
  }

  save(): void {
    if (this.form.invalid) return;
    this.submit(false);
  }

  // Create or rename although a deleted category has the name; the deleted one stays deleted.
  saveDespiteDeletedCategory(): void {
    this.submit(true);
  }

  restoreDeletedCategory(): void {
    const deletedCategory = this.deletedCategory();
    if (!deletedCategory) return;
    this.run(this.categoryService.restoreCategory(deletedCategory.id));
  }

  // Back to the form with the entered name, nothing saved.
  dismissDeletedCategory(): void {
    this.deletedCategory.set(null);
    // Removing the choice takes the focused button with it, so hand the focus on.
    this.nameInput().nativeElement.focus();
  }

  private submit(ignoreDeletedCategory: boolean): void {
    const name = this.form.getRawValue().name ?? '';
    const dto = ignoreDeletedCategory ? { name, ignoreDeletedCategory } : { name };
    this.run(
      this.isEdit
        ? this.categoryService.updateCategory(this.data!.id, dto)
        : this.categoryService.createCategory(dto),
    );
  }

  private run(action: Observable<Category>): void {
    this.busy.set(true);
    action.subscribe({
      next: () => this.dialogRef.close(true),
      error: (err) => {
        this.busy.set(false);
        const deletedCategory = deletedCategoryIn(err);
        if (deletedCategory) {
          this.deletedCategory.set(deletedCategory);
        } else {
          console.error('Fehler:', err);
        }
      },
    });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
