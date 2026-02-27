'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';

import type { Order, OrderItem } from '@/lib/types';

function formatDateTimeText(isoString: string) {
  const dateObj = new Date(isoString);
  return dateObj.toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

type ExportExcelButtonProps = {
  data: Array<{
    order: Order;
    items: OrderItem[];
  }>;
  date: string;
};

export default function ExportExcelButton({ data, date }: ExportExcelButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (isExporting) {
      return;
    }

    setIsExporting(true);

    try {
      const XLSX = await import('xlsx');
      const rows: Array<Record<string, number | string>> = [];

      data.forEach((entry) => {
        const { order, items } = entry;

        items.forEach((item, index) => {
          rows.push({
            'No Order': index === 0 ? order.orderNumber : '',
            'Tanggal Transaksi': index === 0 ? formatDateTimeText(order.createdAt) : '',
            Kasir: index === 0 ? order.cashierName : '',
            'Metode Pembayaran': index === 0 ? String(order.paymentMethod).toUpperCase() : '',
            'Nama Produk': item.productNameSnapshot,
            'Varian Ukuran': item.size || '-',
            Mood: item.mood === 'hot' ? 'Panas' : item.mood === 'cold' ? 'Dingin' : '-',
            'Tingkat Gula (%)': item.sugarLevel ?? '-',
            Catatan: item.notes || '-',
            'Harga Satuan': item.price,
            'Jumlah (Qty)': item.qty,
            'Subtotal Produk': item.price * item.qty,
            'Subtotal Transaksi': index === 0 ? order.subtotal : '',
            'Pajak (10%)': index === 0 ? order.tax : '',
            'Total Akhir (Dibayar)': index === 0 ? order.total : '',
          });
        });
      });

      if (rows.length === 0) {
        alert('Tidak ada data pesanan untuk di-export.');
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Riwayat Pesanan');

      worksheet['!cols'] = [
        { wch: 18 },
        { wch: 20 },
        { wch: 15 },
        { wch: 18 },
        { wch: 25 },
        { wch: 12 },
        { wch: 10 },
        { wch: 15 },
        { wch: 20 },
        { wch: 15 },
        { wch: 10 },
        { wch: 15 },
        { wch: 18 },
        { wch: 15 },
        { wch: 20 },
      ];

      XLSX.writeFile(workbook, `Pesanan-Selesai-${date}.xlsx`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={isExporting}
      className="flex items-center gap-2 h-[42px] px-4 rounded-xl bg-[#107c41] text-white font-semibold hover:bg-[#185c37] transition-colors shadow-sm"
    >
      <Download className="w-[18px] h-[18px]" />
      <span>{isExporting ? 'Memproses...' : 'Export Excel'}</span>
    </button>
  );
}
