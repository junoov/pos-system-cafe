export type PaymentMethod = 'cash' | 'debit' | 'ewallet';
export type OrderStatus = 'Diproses' | 'Selesai' | 'Dibatalkan';

export interface Category {
  id: number;
  name: string;
  icon: string | null;
  sortOrder: number;
}

export interface Product {
  id: number;
  categoryId: number;
  categoryName: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  stockQty: number;
  minStock: number;
}

export interface ProductInput {
  categoryId: number;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isAvailable?: boolean;
  stockQty?: number;
  minStock?: number;
  outletId?: number;
}

export interface Partner {
  id: number;
  name: string;
  contact: string | null;
  address: string | null;
}

export interface Outlet {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
}

export interface UserSummary {
  id: number;
  outletId: number;
  outletName: string;
  name: string;
  email: string;
  role: 'admin' | 'cashier';
  avatarUrl: string | null;
}

export interface SettingsMap {
  store_name: string;
  store_address: string;
  store_phone: string;
  tax_rate: string;
  receipt_paper: string;
  [key: string]: string;
}

export interface CartItemOption {
  size: 'S' | 'M' | 'L';
  mood: 'hot' | 'cold';
  sugarLevel: number;
  iceLevel: number;
  notes?: string;
}

export interface CartItem {
  lineId: string;
  productId: number;
  name: string;
  price: number;
  imageUrl: string | null;
  qty: number;
  options: CartItemOption;
}

export interface CreateOrderInput {
  outletId?: number;
  userId?: number;
  paymentMethod: PaymentMethod;
  taxRate: number;
  items: CartItem[];
}

export interface Order {
  id: number;
  outletId: number;
  outletName: string;
  userId: number;
  cashierName: string;
  orderNumber: string;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  createdAt: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number | null;
  productNameSnapshot: string;
  qty: number;
  size: string | null;
  mood: string | null;
  sugarLevel: number | null;
  iceLevel: number | null;
  price: number;
  notes: string | null;
}

export interface ReceiptData {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  orderNumber: string;
  createdAt: string;
  paymentMethod: PaymentMethod;
  subtotal: number;
  tax: number;
  total: number;
  items: Array<{
    name: string;
    qty: number;
    price: number;
    notes?: string;
    size?: string;
    mood?: string;
    sugarLevel?: number;
    iceLevel?: number;
  }>;
}
