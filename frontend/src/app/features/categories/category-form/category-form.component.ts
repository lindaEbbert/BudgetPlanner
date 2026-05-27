import { Component, Inject, Optional } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { CategoryService } from '../category.service';
import { Category } from '../../../shared/models';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './category-form.component.html',
})
export class CategoryFormComponent {
  form: FormGroup;
  isEdit: boolean;

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private dialogRef: MatDialogRef<CategoryFormComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: Category,
  ) {
    this.isEdit = !!data;
    this.form = this.fb.group({
      name: [data?.name ?? '', Validators.required],
      type: [data?.type ?? '', Validators.required],
    });
  }

  save(): void {
    if (this.form.invalid) return;

    const action = this.isEdit
      ? this.categoryService.updateCategory(this.data.id, this.form.value)
      : this.categoryService.createCategory(this.form.value);

    action.subscribe({
      next: () => this.dialogRef.close(true),
      error: (err) => console.error('Fehler:', err),
    });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
