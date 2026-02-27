import { getOrders, updateOrderStatusFromForm } from '@/lib/actions/order-actions';
import { formatDateTime, formatRupiah } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  const orders = await getOrders({ status: 'Diproses', outletId: 1 });

  return (
    <div className="flex-1 overflow-y-auto w-full p-8 space-y-6">
      <header>
        <h1 className="text-2xl font-bold font-display text-ui-text">Pesanan Aktif</h1>
        <p className="text-sm text-ui-muted mt-1">Kelola pesanan yang sedang diproses.</p>
      </header>

      <section className="space-y-3">
        {orders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ui-border bg-white p-8 text-center text-ui-muted">
            Belum ada pesanan aktif.
          </div>
        ) : (
          orders.map((order) => (
            <article
              key={order.id}
              className="bg-white border border-ui-border rounded-2xl p-5 flex flex-wrap justify-between gap-4"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{order.orderNumber}</p>
                <h2 className="text-lg font-bold text-ui-text">{order.cashierName}</h2>
                <p className="text-sm text-ui-muted">{formatDateTime(order.createdAt)}</p>
                <p className="text-sm text-ui-muted">Pembayaran: {order.paymentMethod.toUpperCase()}</p>
              </div>

              <div className="text-right">
                <p className="text-sm text-ui-muted">Total</p>
                <p className="text-2xl font-bold text-ui-text">{formatRupiah(order.total)}</p>
                <form action={updateOrderStatusFromForm} className="mt-3">
                  <input type="hidden" name="orderId" value={order.id} />
                  <input type="hidden" name="status" value="Selesai" />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-brand-700 text-white font-semibold hover:bg-brand-800"
                  >
                    Tandai Selesai
                  </button>
                </form>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
