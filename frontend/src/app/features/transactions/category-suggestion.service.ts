import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CategorySuggestion, SuggestCategoryDto } from '../../shared/models';
import { ApiService } from '../../core/services/api.service';

@Injectable({ providedIn: 'root' })
export class CategorySuggestionService extends ApiService {
  constructor(http: HttpClient) {
    super(http);
  }

  suggestCategory(request: SuggestCategoryDto): Observable<CategorySuggestion> {
    return this.http.post<CategorySuggestion>(
      `${this.baseUrl}/transactions/category-suggestion`,
      request,
    );
  }
}
