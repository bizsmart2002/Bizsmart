export interface InventoryItem {
  id: number;
  productId: number;
  currentStock: number;
  updatedAt: string;
}

export type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT' | 'SALE';

export interface InventoryMovement {
  id: number;
  productId: number;
  movementType: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reference?: string;
  createdAt: string;
}

export interface StockAlert {
  id: number;
  productId: number;
  alertType: string;
  message: string;
  resolved: boolean;
  createdAt: string;
}
