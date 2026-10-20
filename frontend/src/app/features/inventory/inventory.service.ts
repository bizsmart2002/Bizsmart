import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { InventoryItem, InventoryMovement, StockAlert } from '../../models/inventory.model';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  constructor(private http: HttpClient) {}

  findAll() {
    return this.http.get<InventoryItem[]>(`${environment.apiUrl}/inventory`);
  }

  movements(productId?: number) {
    const params = productId ? { productId } : {};
    return this.http.get<InventoryMovement[]>(`${environment.apiUrl}/inventory/movements`, { params: params as any });
  }

  registerMovement(payload: { productId: number; movementType: 'IN' | 'OUT' | 'ADJUSTMENT'; quantity: number; reference?: string }) {
    return this.http.post(`${environment.apiUrl}/inventory/movements`, payload);
  }

  alerts() {
    return this.http.get<StockAlert[]>(`${environment.apiUrl}/alerts`);
  }

  resolveAlert(id: number) {
    return this.http.patch(`${environment.apiUrl}/alerts/${id}/resolve`, {});
  }
}
