export type Status = 'Aguardando' | 'Em curso' | 'Pronto' | 'Entregue';
export const STATUSES: Status[] = ['Aguardando', 'Em curso', 'Pronto', 'Entregue'];

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
}

export interface Vehicle {
  id: string;
  customerId: string;
  plate: string;
  model: string;
  year: number | null;
  km: number;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  phone: string;
  active: boolean;
}

export interface Part {
  id: string;
  sku: string;
  name: string;
  qty: number;
  min: number;
  cost: number;
  price: number;
}

export interface OrderItem {
  kind: 'servico' | 'peca';
  description: string;
  qty: number;
  unitPrice: number;
  partId?: string;
}

export interface Order {
  id: string;
  customerId: string;
  vehicleId: string;
  mechanicId: string;
  description: string;
  status: Status;
  createdAt: string;
  dueDate: string;
  items: OrderItem[];
}

export interface Invoice {
  id: string;
  orderId: string;
  issuedAt: string;
  total: number;
  paid: boolean;
  paidAt: string | null;
}

export interface Db {
  seq: number;
  customers: Customer[];
  vehicles: Vehicle[];
  staff: Staff[];
  parts: Part[];
  orders: Order[];
  invoices: Invoice[];
}
