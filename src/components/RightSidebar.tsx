'use client';

import { useTransition, useState, type ReactNode } from 'react';
import { Bell, Minus, Plus, Trash2, Banknote, CreditCard, Wallet } from 'lucide-react';

import PrintReceipt from '@/components/PrintReceipt';
import { createOrder } from '@/lib/actions/order-actions';
import { useCart } from '@/lib/cart-context';
import { formatRupiah } from '@/lib/format';
import type { PaymentMethod, ReceiptData } from '@/lib/types';

const paymentOptions: Array<{ key: PaymentMethod; label: string; icon: ReactNode }> = [
  {
    key: 'cash',
    label: 'Tunai',
    icon: <Banknote className="w-6 h-6" />,
  },
  {
    key: 'debit',
    label: 'Debit',
    icon: <CreditCard className="w-6 h-6" />,
  },
  {
    key: 'ewallet',
    label: 'E-Wallet',
    icon: <Wallet className="w-6 h-6" />,
  },
];

type RightSidebarProps = {
  storeAddress: string;
  storePhone: string;
};

export default function RightSidebar({ storeAddress, storePhone }: RightSidebarProps) {
  const {
    items,
    paymentMethod,
    setPaymentMethod,
    subtotal,
    taxAmount,
    total,
    taxRate,
    storeName,
    setQty,
    removeItem,
    clearCart,
  } = useCart();
  const [isPending, startTransition] = useTransition();
  const [lastReceipt, setLastReceipt] = useState<ReceiptData | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const createOrderAndPrint = () => {
    if (!items.length || isPending) {
      return;
    }

    setErrorMessage('');
    startTransition(async () => {
      try {
        const receipt = await createOrder({
          paymentMethod,
          taxRate,
          items,
        });

        setLastReceipt({
          ...receipt,
          storeName,
          storeAddress,
          storePhone,
        });
        clearCart();

        setTimeout(() => {
          window.print();
        }, 120);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Gagal menyimpan order.';
        setErrorMessage(message);
      }
    });
  };

  return (
    <aside className="w-[380px] bg-white border-l border-ui-border flex flex-col h-full flex-shrink-0 z-20 shadow-sm relative">
      <div className="flex justify-between items-center px-8 pt-10 mb-6">
        <h2 className="text-2xl font-bold text-ui-text font-display">Tagihan</h2>
        <button
          type="button"
          className="w-10 h-10 rounded-full border border-brand-100 flex items-center justify-center hover:bg-brand-50 transition-colors relative"
        >
          <Bell className="w-5 h-5 text-ui-text" />
          <span className="absolute top-2.5 right-3 w-2 h-2 bg-brand-400 rounded-full border-2 border-white" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-8 hide-scroll">
        {items.length === 0 ? (
          <div className="h-full rounded-2xl border border-dashed border-ui-border flex items-center justify-center text-center p-6 text-ui-muted text-sm">
            Belum ada item di keranjang.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {items.map((item) => (
              <div key={item.lineId} className="flex gap-3 border border-ui-border rounded-2xl p-3">
                <div className="w-16 h-16 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0">
                  <img
                    src={
                      item.imageUrl ||
                      'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=500&auto=format&fit=crop&q=60'
                    }
                    alt={item.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-ui-text truncate">{item.name}</p>
                  <p className="text-[11px] text-ui-muted">
                    {item.options.size} • {item.options.mood === 'hot' ? 'Panas' : 'Dingin'} • Gula{' '}
                    {item.options.sugarLevel}%
                  </p>
                  <p className="font-bold text-sm mt-1">{formatRupiah(item.price)}</p>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                        onClick={() => setQty(item.lineId, item.qty - 1)}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center font-semibold text-sm">{item.qty}</span>
                      <button
                        type="button"
                        className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                        onClick={() => setQty(item.lineId, item.qty + 1)}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      className="w-7 h-7 rounded-full text-red-500 hover:bg-red-50 flex items-center justify-center"
                      onClick={() => removeItem(item.lineId)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-8 pb-8 pt-4 bg-white no-print">
        <div className="space-y-3 mb-6 border-t border-dashed border-gray-200 pt-5">
          <div className="flex justify-between items-center text-sm">
            <span className="text-ui-muted">Subtotal</span>
            <span className="font-bold text-ui-text">{formatRupiah(subtotal)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-ui-muted">Pajak ({taxRate}%)</span>
            <span className="font-bold text-ui-text">{formatRupiah(taxAmount)}</span>
          </div>
          <div className="pt-3 border-t border-dashed border-gray-200 flex justify-between items-center">
            <span className="text-lg font-bold text-ui-text">Total</span>
            <span className="text-xl font-bold text-ui-text">{formatRupiah(total)}</span>
          </div>
        </div>

        <div className="mb-5">
          <h3 className="text-[15px] font-bold text-ui-text mb-3">Metode Pembayaran</h3>
          <div className="flex gap-3">
            {paymentOptions.map((option) => {
              const isActive = paymentMethod === option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  className={`flex-1 py-3 px-2 rounded-2xl border flex flex-col items-center gap-2 transition-colors text-ui-muted bg-white ${
                    isActive
                      ? 'border-brand-700 bg-brand-50 text-brand-700 shadow-sm'
                      : 'border-gray-200 hover:border-brand-700 hover:bg-brand-50'
                  }`}
                  onClick={() => setPaymentMethod(option.key)}
                >
                  {option.icon}
                  <span className="text-[11px] font-semibold">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {errorMessage ? <p className="text-sm text-red-500 mb-3">{errorMessage}</p> : null}

        <button
          type="button"
          onClick={createOrderAndPrint}
          disabled={!items.length || isPending}
          className="w-full bg-brand-700 text-white font-bold py-4 rounded-2xl hover:bg-brand-800 transition-colors text-[15px] shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isPending ? 'Menyimpan...' : 'Cetak Struk'}
        </button>
      </div>

      <PrintReceipt receipt={lastReceipt} />
    </aside>
  );
}
