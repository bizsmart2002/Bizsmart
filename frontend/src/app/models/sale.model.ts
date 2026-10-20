export interface SaleItemInput {
  productId: number;
  quantity: number;
}

export interface CreateSaleRequest {
  customerId?: number;
  items: SaleItemInput[];
}

export interface SaleDetail {
  id: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Sale {
  id: number;
  customerId: number | null;
  sellerId: number;
  saleDate: string;
  subtotal: number;
  total: number;
  status: 'COMPLETED' | 'CANCELLED';
  details?: SaleDetail[];
}
