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

  getTransactions(includeVoided = false): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(
      `${this.baseUrl}/transactions?include_voided=${includeVoided}`,
    );
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

  getBalance(): Observable<BalanceSummary> {
    return this.http.get<BalanceSummary>(`${this.baseUrl}/transactions/balance`);
  }
}
