export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  category: Category | null;
  price: number;
  minimumStock: number;
  active: boolean;
}
