import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { CreateSaleRequest, Sale } from '../../models/sale.model';

@Injectable({ providedIn: 'root' })
export class SalesService {
  constructor(private http: HttpClient) {}

  findAll() {
    return this.http.get<Sale[]>(`${environment.apiUrl}/sales`);
  }

  create(payload: CreateSaleRequest) {
    return this.http.post<Sale>(`${environment.apiUrl}/sales`, payload);
  }
}
