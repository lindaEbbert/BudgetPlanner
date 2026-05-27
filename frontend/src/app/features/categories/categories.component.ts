import { Component, OnInit } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CategoryService } from './category.service';
import { Category } from '../../shared/models';
import { CategoryFormComponent } from './category-form/category-form.component';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatDialogModule],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss',
})
export class CategoriesComponent implements OnInit {
  dataSource = new MatTableDataSource<Category>([]);
  displayedColumns = ['name', 'type', 'actions'];

  constructor(
    private categoryService: CategoryService,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe((cats) => (this.dataSource.data = cats));
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
