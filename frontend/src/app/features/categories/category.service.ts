import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Category, CreateCategoryDto, DeletedCategory } from '../../shared/models';
import { ApiService } from '../../core/services/api.service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

// The deleted category a create or rename was refused for, if that was the reason.
export function deletedCategoryIn(error: unknown): DeletedCategory | null {
  if (!(error instanceof HttpErrorResponse) || error.status !== 409) return null;
  return error.error?.deletedCategory ?? null;
}

@Injectable({ providedIn: 'root' })
export class CategoryService extends ApiService {

  constructor(http: HttpClient) {
    super(http);
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.baseUrl}/categories`);
  }

  createCategory(dto: CreateCategoryDto): Observable<Category> {
    return this.http.post<Category>(`${this.baseUrl}/categories`, dto);
  }

  updateCategory(id: string, dto: Partial<CreateCategoryDto>): Observable<Category> {
    return this.http.put<Category>(`${this.baseUrl}/categories/${id}`, dto);
  }

  deleteCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/categories/${id}`);
  }

  restoreCategory(id: string): Observable<Category> {
    return this.http.post<Category>(`${this.baseUrl}/categories/${id}/restore`, null);
  }
}
