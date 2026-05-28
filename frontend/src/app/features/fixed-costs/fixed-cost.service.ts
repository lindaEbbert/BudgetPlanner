import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { FixedCost, CreateFixedCostDto, ProjectionResponse } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class FixedCostService extends ApiService {
  constructor(http: HttpClient) {
    super(http);
  }

  getFixedCosts(): Observable<FixedCost[]> {
    return this.http.get<FixedCost[]>(`${this.baseUrl}/fixed-costs`);
  }

  createFixedCost(dto: CreateFixedCostDto): Observable<FixedCost> {
    return this.http.post<FixedCost>(`${this.baseUrl}/fixed-costs`, dto);
  }

  updateFixedCost(id: string, dto: Partial<CreateFixedCostDto>): Observable<FixedCost> {
    return this.http.put<FixedCost>(`${this.baseUrl}/fixed-costs/${id}`, dto);
  }

  deleteFixedCost(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/fixed-costs/${id}`);
  }

  getProjections(month: number, year: number): Observable<ProjectionResponse> {
    return this.http.get<ProjectionResponse>(`${this.baseUrl}/fixed-costs/projections`, {
      params: { month: month.toString(), year: year.toString() },
    });
  }
}
