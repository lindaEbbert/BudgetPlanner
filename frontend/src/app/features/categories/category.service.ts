import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Category, CreateCategoryDto } from '../../shared/models';
import { ApiService } from '../../core/services/api.service';
import { HttpClient } from '@angular/common/http';

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
}
