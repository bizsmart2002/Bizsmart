export interface Customer {
  id: number;
  name: string;
  document: string;
  email?: string;
  phone?: string;
  address?: string;
  active: boolean;
}
