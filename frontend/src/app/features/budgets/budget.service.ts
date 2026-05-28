import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { Budget, CreateBudgetDto } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class BudgetService extends ApiService {
  constructor(http: HttpClient) {
    super(http);
  }

  getBudgets(month: number, year: number): Observable<Budget[]> {
    return this.http.get<Budget[]>(`${this.baseUrl}/budgets`, {
      params: { month: month.toString(), year: year.toString() },
    });
  }

  createBudget(dto: CreateBudgetDto): Observable<Budget> {
    return this.http.post<Budget>(`${this.baseUrl}/budgets`, dto);
  }

  deleteBudget(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/budgets/${id}`);
  }
}
