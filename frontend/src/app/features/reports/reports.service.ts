import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  constructor(private http: HttpClient) {}

  sales(filter: { startDate?: string; endDate?: string }) {
    return this.http.get<any[]>(`${environment.apiUrl}/reports/sales`, { params: filter as any });
  }

  products() {
    return this.http.get<any[]>(`${environment.apiUrl}/reports/products`);
  }

  inventory() {
    return this.http.get<any[]>(`${environment.apiUrl}/reports/inventory`);
  }

  topSelling() {
    return this.http.get<any[]>(`${environment.apiUrl}/reports/top-selling`);
  }
}
