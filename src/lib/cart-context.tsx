'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type { CartItem, CartItemOption, PaymentMethod, Product } from '@/lib/types';

const STORAGE_KEY = 'pos-kasir-cafe-cart-v1';

type AddItemInput = {
  product: Pick<Product, 'id' | 'name' | 'price' | 'imageUrl'>;
  options?: Partial<CartItemOption>;
};

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  paymentMethod: PaymentMethod;
  taxRate: number;
  storeName: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  addItem: (input: AddItemInput) => void;
  setQty: (lineId: string, qty: number) => void;
  removeItem: (lineId: string) => void;
  clearCart: () => void;
  setPaymentMethod: (method: PaymentMethod) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const defaultOptions: CartItemOption = {
  size: 'M',
  mood: 'hot',
  sugarLevel: 50,
  iceLevel: 50,
  notes: '',
};

function toLineKey(productId: number, options: CartItemOption) {
  return `${productId}-${options.size}-${options.mood}-${options.sugarLevel}-${options.iceLevel}-${options.notes ?? ''}`;
}

type CartProviderProps = {
  children: React.ReactNode;
  initialTaxRate: number;
  storeName: string;
};

export function CartProvider({ children, initialTaxRate, storeName }: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [isHydrated, setIsHydrated] = useState(false);

  // Load state from local storage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { items?: CartItem[]; paymentMethod?: PaymentMethod };
        if (Array.isArray(parsed.items)) setItems(parsed.items);
        if (parsed.paymentMethod) setPaymentMethod(parsed.paymentMethod);
      }
    } catch {
      // Ignore errors
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Sync to local storage on changes
  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        items,
        paymentMethod,
      }),
    );
  }, [items, paymentMethod, isHydrated]);

  const addItem = useCallback(({ product, options }: AddItemInput) => {
    const mergedOptions: CartItemOption = {
      ...defaultOptions,
      ...options,
    };

    setItems((current) => {
      const lineKey = toLineKey(product.id, mergedOptions);
      const existing = current.find((item) => item.lineId === lineKey);

      if (existing) {
        return current.map((item) =>
          item.lineId === lineKey
            ? {
                ...item,
                qty: item.qty + 1,
              }
            : item,
        );
      }

      const newItem: CartItem = {
        lineId: lineKey,
        productId: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        qty: 1,
        options: mergedOptions,
      };

      return [...current, newItem];
    });
  }, []);

  const setQty = useCallback((lineId: string, qty: number) => {
    setItems((current) => {
      if (qty <= 0) {
        return current.filter((item) => item.lineId !== lineId);
      }

      return current.map((item) =>
        item.lineId === lineId
          ? {
              ...item,
              qty,
            }
          : item,
      );
    });
  }, []);

  const removeItem = useCallback((lineId: string) => {
    setItems((current) => current.filter((item) => item.lineId !== lineId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const subtotal = useMemo(
    () => items.reduce((totalValue, item) => totalValue + item.price * item.qty, 0),
    [items],
  );

  const taxAmount = useMemo(() => (subtotal * initialTaxRate) / 100, [initialTaxRate, subtotal]);

  const total = useMemo(() => subtotal + taxAmount, [subtotal, taxAmount]);

  const itemCount = useMemo(
    () => items.reduce((totalValue, item) => totalValue + item.qty, 0),
    [items],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount,
      paymentMethod,
      taxRate: initialTaxRate,
      storeName,
      subtotal,
      taxAmount,
      total,
      addItem,
      setQty,
      removeItem,
      clearCart,
      setPaymentMethod,
    }),
    [
      addItem,
      clearCart,
      initialTaxRate,
      itemCount,
      items,
      paymentMethod,
      removeItem,
      setQty,
      storeName,
      subtotal,
      taxAmount,
      total,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart harus dipakai di dalam CartProvider');
  }
  return context;
}
