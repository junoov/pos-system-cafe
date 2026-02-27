import { Fragment } from 'react';
import ExportExcelButton from '@/components/ExportExcelButton';
import { getOrderItemsByOrderIds, getOrders } from '@/lib/actions/order-actions';
import { getRevenueByCategory, getTopProducts } from '@/lib/actions/report-actions';
import { formatDateTime, formatRupiah } from '@/lib/format';

export const dynamic = 'force-dynamic';

type HistoryPageProps = {
  searchParams: Promise<{
    type?: string;
    date?: string;
    month?: string;
  }>;
};

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  const params = await searchParams;
  const filterType = params.type || 'daily';
  const date = params.date || new Date().toISOString().slice(0, 10);
  const month = params.month || new Date().toISOString().slice(0, 7);

  let startDate = date;
  let endDate = date;
  let displayRange = formatDateTime(date).split(' ')[0];

  if (filterType === 'monthly') {
    const [y, m] = month.split('-');
    startDate = `${y}-${m}-01`;
    const lastDay = new Date(parseInt(y), parseInt(m), 0).getDate();
    endDate = `${y}-${m}-${lastDay}`;
    
    // Convert to nice month name (e.g. Februari 2026)
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    displayRange = `${monthNames[parseInt(m) - 1]} ${y}`;
  } else {
    // Pretty print daily format
    const [y, m, d] = date.split('-');
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    displayRange = `${parseInt(d)} ${monthNames[parseInt(m) - 1]} ${y}`;
  }

  // Fetch based on dynamic start & end dates (combining what used to be Daily/Monthly isolated reports)
  const [orders, revenueByCategory, topProducts] = await Promise.all([
    getOrders({ status: 'Selesai', outletId: 1, startDate, endDate }),
    getRevenueByCategory(startDate, endDate, 1),
    getTopProducts(5, startDate, endDate, 1),
  ]);

  const orderItemsMap = await getOrderItemsByOrderIds(orders.map((order) => order.id));
  const ordersWithDetails = orders.map((order) => ({
    order,
    items: orderItemsMap.get(order.id) ?? [],
  }));

  // Compute stats on the fly from actual order data dynamically
  const totalSubtotal = orders.reduce((sum, o) => sum + o.subtotal, 0);
  const totalTax = orders.reduce((sum, o) => sum + o.tax, 0);
  const totalIncome = orders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="flex-1 overflow-y-auto w-full p-8 space-y-6">
      <header>
        <h1 className="text-2xl font-bold font-display text-ui-text">Riwayat & Laporan</h1>
        <p className="text-sm text-ui-muted mt-1">Pantau transaksi selesai dan performa penjualan outlet.</p>
      </header>

      <section className="bg-white border border-ui-border rounded-2xl p-5 shadow-sm">
        <form className="flex flex-wrap gap-4 items-end" method="GET">
          <label className="text-sm text-ui-text font-medium">
            Tipe Laporan
            <select
              name="type"
              defaultValue={filterType}
              className="block mt-1 px-3 py-2 rounded-xl border border-ui-border bg-white outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
            >
              <option value="daily">Harian (Per Tanggal)</option>
              <option value="monthly">Bulanan (Per Bulan)</option>
            </select>
          </label>
          <label className="text-sm text-ui-text font-medium">
            Tanggal
            <input
              name="date"
              type="date"
              defaultValue={date}
              className="block mt-1 px-3 py-2 rounded-xl border border-ui-border bg-white outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
            />
          </label>
          <label className="text-sm text-ui-text font-medium">
            Bulan
            <input
              name="month"
              type="month"
              defaultValue={month}
              className="block mt-1 px-3 py-2 rounded-xl border border-ui-border bg-white outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
            />
          </label>
          <button
            type="submit"
            className="h-[42px] px-4 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 text-white font-semibold hover:from-brand-700 hover:to-brand-800 shadow-sm"
          >
            Terapkan Filter
          </button>
          
          <div className="ml-auto flex items-end">
            <ExportExcelButton data={ordersWithDetails} date={filterType === 'daily' ? date : month} />
          </div>
        </form>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <article className="bg-white border border-ui-border rounded-2xl p-5 border-l-4 border-l-brand-400 shadow-sm transition-transform hover:-translate-y-1">
          <p className="text-xs text-ui-muted font-bold uppercase tracking-wider">Pendapatan Bersih (Subtotal)</p>
          <p className="text-3xl font-bold mt-2 text-ui-text">{formatRupiah(totalSubtotal)}</p>
          <p className="text-xs text-ui-muted mt-2 font-medium">{orders.length} Transaksi Selesai</p>
        </article>
        <article className="bg-white border border-ui-border rounded-2xl p-5 border-l-4 border-l-ui-muted shadow-sm transition-transform hover:-translate-y-1">
          <p className="text-xs text-ui-muted font-bold uppercase tracking-wider">Pajak / Tax</p>
          <p className="text-3xl font-bold mt-2 text-ui-text">{formatRupiah(totalTax)}</p>
          <p className="text-xs text-ui-muted mt-2 font-medium">Masukan pajak sistem</p>
        </article>
        <article className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 border-l-4 border-l-emerald-500 shadow-sm transition-transform hover:-translate-y-1 relative overflow-hidden">
          <p className="text-xs text-emerald-800 font-bold uppercase tracking-wider mb-2 relative z-10">Total Pendapatan Kotor</p>
          <p className="text-3xl font-bold mt-1 text-emerald-700 relative z-10">{formatRupiah(totalIncome)}</p>
          <p className="text-[11px] text-emerald-700/80 font-bold mt-2 uppercase relative z-10">
            {filterType === 'daily' ? 'Hari: ' : 'Bulan: '} {displayRange}
          </p>
        </article>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <article className="bg-white border border-ui-border rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-lg mb-4 text-ui-text border-b border-ui-border pb-3">Pendapatan per Kategori</h2>
          <ul className="space-y-3">
            {revenueByCategory.length === 0 ? (
              <li className="text-sm text-ui-muted italic">Tidak ada pendapatan pada periode ini.</li>
            ) : (
              revenueByCategory.map((item) => (
                <li key={`${item.categoryId}-${item.categoryName}`} className="flex justify-between text-sm group">
                  <span className="font-medium text-ui-text group-hover:text-brand-500 transition-colors">{item.categoryName}</span>
                  <span className="font-bold text-ui-text bg-gray-50 px-2 py-0.5 rounded-md">{formatRupiah(item.revenue)}</span>
                </li>
              ))
            )}
          </ul>
        </article>

        <article className="bg-white border border-ui-border rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-lg mb-4 text-ui-text border-b border-ui-border pb-3">Produk Terlaris (Qty)</h2>
          <ul className="space-y-3">
            {topProducts.length === 0 ? (
              <li className="text-sm text-ui-muted italic">Tidak ada produk terjual pada periode ini.</li>
            ) : (
              topProducts.map((item, id) => (
                <li key={`${item.productId}-${item.productName}`} className="flex justify-between text-sm group items-center">
                  <span className="font-medium text-ui-text flex items-center gap-2 group-hover:text-brand-500 transition-colors">
                    <span className="w-5 h-5 bg-gray-100 rounded text-center text-[10px] flex items-center justify-center font-bold text-ui-muted group-hover:bg-brand-100 group-hover:text-brand-600 transition-colors">{id + 1}</span>
                    {item.productName} 
                    <span className="text-xs text-ui-muted bg-gray-50 px-1.5 py-0.5 rounded-full border border-gray-100">{item.totalQty} pcs</span>
                  </span>
                  <span className="font-bold text-ui-text">{formatRupiah(item.totalRevenue)}</span>
                </li>
              ))
            )}
          </ul>
        </article>
      </section>

      <section className="bg-white border border-ui-border rounded-2xl overflow-hidden shadow-sm pt-2">
        <div className="px-6 py-4 border-b border-ui-border flex justify-between items-center bg-gray-50/50">
          <h2 className="font-bold text-lg text-ui-text">Riwayat Transaksi</h2>
          <span className="text-xs font-bold px-3 py-1 bg-brand-50 text-brand-600 rounded-full">
            {ordersWithDetails.length} Pesanan Ditemukan
          </span>
        </div>

        <div className="overflow-x-auto">
          {ordersWithDetails.length === 0 ? (
            <div className="p-8 text-center text-ui-muted text-sm italic">
              Tidak ada data transaksi pada periode ini. Silakan atur filter.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left bg-white text-ui-muted border-b border-ui-border sticky top-0">
                  <th className="px-6 py-4 font-bold uppercase text-[11px] tracking-wider">No Order</th>
                  <th className="px-6 py-4 font-bold uppercase text-[11px] tracking-wider">Kasir</th>
                  <th className="px-6 py-4 font-bold uppercase text-[11px] tracking-wider">Waktu Selesai</th>
                  <th className="px-6 py-4 font-bold uppercase text-[11px] tracking-wider text-center">Metode</th>
                  <th className="px-6 py-4 font-bold uppercase text-[11px] tracking-wider text-right">Total Transaksi</th>
                </tr>
              </thead>
              <tbody>
                {ordersWithDetails.map((data, idx) => {
                  const { order, items } = data;
                  const isLast = idx === ordersWithDetails.length - 1;
                  return (
                    <Fragment key={order.id}>
                      <tr className="bg-white group cursor-default transition-colors hover:bg-brand-50/30">
                        <td className="px-6 py-4 font-bold text-ui-text">{order.orderNumber}</td>
                        <td className="px-6 py-4 font-medium text-ui-muted">{order.cashierName}</td>
                        <td className="px-6 py-4 font-medium text-ui-muted">{formatDateTime(order.createdAt)}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-block px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider ${
                            order.paymentMethod === 'cash' ? 'bg-green-100 text-green-700' :
                            order.paymentMethod === 'debit' ? 'bg-blue-100 text-blue-700' :
                            'bg-purple-100 text-purple-700'
                          }`}>
                            {order.paymentMethod}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-extrabold text-brand-600 text-right">{formatRupiah(order.total)}</td>
                      </tr>
                      <tr className={isLast ? '' : 'border-b-[4px] border-b-ui-bg'}>
                        <td colSpan={5} className="px-0 pt-0 pb-6">
                          <div className="mx-6 p-5 bg-gray-50/80 rounded-2xl border border-gray-100 shadow-inner">
                            <div className="flex flex-col md:flex-row gap-6 md:gap-10">
                              <div className="flex-1">
                                <h4 className="font-bold text-ui-muted text-[10px] uppercase tracking-wider mb-3 flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-brand-300"></span> 
                                  Detail Order Item
                                </h4>
                                <ul className="space-y-3">
                                  {items.map((item) => (
                                    <li key={item.id} className="flex gap-3 items-start">
                                      <span className="font-extrabold text-ui-text bg-white border border-gray-200 w-7 h-7 flex items-center justify-center rounded-lg text-xs shadow-sm shadow-gray-100 flex-shrink-0">
                                        {item.qty}
                                      </span>
                                      <div className="leading-tight pt-1">
                                        <span className="font-bold text-ui-text text-sm">{item.productNameSnapshot}</span>
                                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                                          {item.size && <span className="bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded text-[10px] font-bold">{item.size}</span>}
                                          {item.mood && (
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${item.mood === 'hot' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                              {item.mood === 'hot' ? 'Panas' : 'Dingin'}
                                            </span>
                                          )}
                                          {(item.sugarLevel || item.sugarLevel === 0) && <span className="bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded text-[10px] font-bold">Gula: {item.sugarLevel}%</span>}
                                        </div>
                                        {item.notes && <p className="text-ui-muted mt-2 text-xs italic bg-white p-2 rounded-lg border border-gray-100">Catatan: {item.notes}</p>}
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              
                              <div className="w-full md:w-64 space-y-2.5 text-xs bg-white p-5 rounded-2xl border border-gray-100 h-fit self-start">
                                <div className="flex justify-between text-ui-muted font-medium">
                                  <span>Subtotal Produk</span>
                                  <span className="font-semibold text-ui-text">{formatRupiah(order.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-ui-muted font-medium">
                                  <span>Pajak Transaksi</span>
                                  <span className="font-semibold text-ui-text">{formatRupiah(order.tax)}</span>
                                </div>
                                <div className="border-t border-dashed border-gray-200 my-2 pt-2"></div>
                                <div className="flex justify-between font-extrabold text-brand-600 text-[15px]">
                                  <span>Total Tagihan</span>
                                  <span>{formatRupiah(order.total)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
