import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  protected readonly baseUrl = environment.apiBaseUrl;

  constructor(protected http: HttpClient) {}
}
