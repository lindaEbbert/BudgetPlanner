import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Transaction, CreateTransactionDto, BalanceSummary } from '../../shared/models';
import { ApiService } from '../../core/services/api.service';

@Injectable({ providedIn: 'root' })
export class TransactionService extends ApiService {
  constructor(http: HttpClient) {
    super(http);
  }

  getTransactions(month?: number, year?: number, includeVoided = false): Observable<Transaction[]> {
    const params: Record<string, string> = {
      include_voided: includeVoided.toString(),
    };
    if (month) params['month'] = month.toString();
    if (year) params['year'] = year.toString();
    return this.http.get<Transaction[]>(`${this.baseUrl}/transactions`, { params });
  }

  createTransaction(dto: CreateTransactionDto): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.baseUrl}/transactions`, dto);
  }

  updateTransaction(id: string, dto: Partial<CreateTransactionDto>): Observable<Transaction> {
    return this.http.put<Transaction>(`${this.baseUrl}/transactions/${id}`, dto);
  }

  voidTransaction(id: string): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.baseUrl}/transactions/${id}/void`, {});
  }

  getBalance(month?: number, year?: number): Observable<BalanceSummary> {
    const params: Record<string, string> = {};
    if (month) params['month'] = month.toString();
    if (year) params['year'] = year.toString();
    return this.http.get<BalanceSummary>(`${this.baseUrl}/transactions/balance`, { params });
  }
}
