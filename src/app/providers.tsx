'use client';

import { CartProvider } from '@/lib/cart-context';

type ProvidersProps = {
  children: React.ReactNode;
  initialTaxRate: number;
  storeName: string;
};

export default function Providers({ children, initialTaxRate, storeName }: ProvidersProps) {
  return (
    <CartProvider initialTaxRate={initialTaxRate} storeName={storeName}>
      {children}
    </CartProvider>
  );
}
