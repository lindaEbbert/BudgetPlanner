import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CategoryService } from './category.service';
import { Category } from '../../shared/models';
import { CategoryFormComponent } from './category-form/category-form.component';

@Component({
  selector: 'app-categories',
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatDialogModule],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriesComponent {
  private readonly categoryService = inject(CategoryService);
  private readonly dialog = inject(MatDialog);

  readonly categories = signal<Category[]>([]);
  readonly displayedColumns = ['name', 'actions'];

  constructor() {
    this.loadCategories();
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe((cats) => this.categories.set(cats));
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(CategoryFormComponent, { width: '400px' });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadCategories();
    });
  }

  openEditDialog(category: Category): void {
    const ref = this.dialog.open(CategoryFormComponent, {
      width: '400px',
      data: category,
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadCategories();
    });
  }

  deleteCategory(id: string): void {
    if (confirm('Kategorie wirklich löschen?')) {
      this.categoryService.deleteCategory(id).subscribe(() => this.loadCategories());
    }
  }
}
