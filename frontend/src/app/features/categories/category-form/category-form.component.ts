import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CategoryService } from '../category.service';
import { Category } from '../../../shared/models';

@Component({
  selector: 'app-category-form',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './category-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly categoryService = inject(CategoryService);
  private readonly dialogRef = inject(MatDialogRef<CategoryFormComponent>);
  readonly data: Category | null = inject(MAT_DIALOG_DATA, { optional: true });

  readonly isEdit = !!this.data;

  readonly form = this.fb.group({
    name: [this.data?.name ?? '', Validators.required],
  });

  save(): void {
    if (this.form.invalid) return;

    const name = this.form.getRawValue().name ?? '';
    const action = this.isEdit
      ? this.categoryService.updateCategory(this.data!.id, { name })
      : this.categoryService.createCategory({ name });

    action.subscribe({
      next: () => this.dialogRef.close(true),
      error: (err) => console.error('Fehler:', err),
    });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
