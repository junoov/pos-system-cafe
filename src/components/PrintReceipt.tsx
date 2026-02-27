'use client';

import { formatDateTime, formatRupiah } from '@/lib/format';
import type { ReceiptData } from '@/lib/types';

type PrintReceiptProps = {
  receipt: ReceiptData | null;
};

function paymentLabel(value: ReceiptData['paymentMethod']) {
  if (value === 'cash') return 'Tunai';
  if (value === 'debit') return 'Debit';
  return 'E-Wallet';
}

export default function PrintReceipt({ receipt }: PrintReceiptProps) {
  if (!receipt) {
    return null;
  }

  return (
    <section className="receipt-print" aria-hidden>
      <div className="text-center mb-3 border-b border-dashed border-black pb-2">
        <h3 className="font-bold uppercase tracking-wide">{receipt.storeName}</h3>
        <p>{receipt.storeAddress}</p>
        <p>{receipt.storePhone}</p>
      </div>

      <div className="mb-3 border-b border-dashed border-black pb-2 text-[11px]">
        <p>No. Order: {receipt.orderNumber}</p>
        <p>Waktu: {formatDateTime(receipt.createdAt)}</p>
        <p>Pembayaran: {paymentLabel(receipt.paymentMethod)}</p>
      </div>

      <table className="w-full text-[11px] mb-3 border-b border-dashed border-black pb-2">
        <tbody>
          {receipt.items.map((item, idx) => (
            <tr key={`${idx}-${item.name}-${item.qty}-${item.price}`}>
              <td className="py-1 align-top">
                <p className="font-semibold">{item.name}</p>
                <p>
                  {item.qty} x {formatRupiah(item.price)}
                </p>
                <p>
                  {item.size ?? '-'} / {item.mood ?? '-'} / Gula {item.sugarLevel ?? 0}% / Es{' '}
                  {item.iceLevel ?? 0}%
                </p>
                {item.notes ? <p>Catatan: {item.notes}</p> : null}
              </td>
              <td className="py-1 text-right align-top">
                {formatRupiah(item.price * item.qty)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="text-[11px] space-y-1 border-b border-dashed border-black pb-2 mb-2">
        <p className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatRupiah(receipt.subtotal)}</span>
        </p>
        <p className="flex justify-between">
          <span>Pajak</span>
          <span>{formatRupiah(receipt.tax)}</span>
        </p>
        <p className="flex justify-between font-bold text-[12px]">
          <span>Total</span>
          <span>{formatRupiah(receipt.total)}</span>
        </p>
      </div>

      <p className="text-center text-[11px]">Terima kasih sudah berkunjung.</p>
    </section>
  );
}
