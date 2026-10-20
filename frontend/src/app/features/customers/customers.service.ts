import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Customer } from '../../models/customer.model';
import { Sale } from '../../models/sale.model';

@Injectable({ providedIn: 'root' })
export class CustomersService {
  constructor(private http: HttpClient) {}

  findAll() {
    return this.http.get<Customer[]>(`${environment.apiUrl}/customers`);
  }

  create(payload: Partial<Customer>) {
    return this.http.post<Customer>(`${environment.apiUrl}/customers`, payload);
  }

  update(id: number, payload: Partial<Customer>) {
    return this.http.patch<Customer>(`${environment.apiUrl}/customers/${id}`, payload);
  }

  purchaseHistory(id: number) {
    return this.http.get<Sale[]>(`${environment.apiUrl}/customers/${id}/purchases`);
  }
}
