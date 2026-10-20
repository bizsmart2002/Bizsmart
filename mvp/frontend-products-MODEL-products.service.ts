import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Category, Product } from '../../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  constructor(private http: HttpClient) {}

  findAll() {
    return this.http.get<Product[]>(`${environment.apiUrl}/products`);
  }

  categories() {
    return this.http.get<Category[]>(`${environment.apiUrl}/categories`);
  }

  create(payload: Partial<Product> & { categoryId?: number }) {
    return this.http.post<Product>(`${environment.apiUrl}/products`, payload);
  }

  update(id: number, payload: Partial<Product> & { categoryId?: number }) {
    return this.http.patch<Product>(`${environment.apiUrl}/products/${id}`, payload);
  }

  deactivate(id: number) {
    return this.http.patch(`${environment.apiUrl}/products/${id}/deactivate`, {});
  }
}
