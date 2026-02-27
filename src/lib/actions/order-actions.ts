'use server';

import 'server-only';

import { cookies } from 'next/headers';
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { revalidatePath } from 'next/cache';

import { dbQuery, pool, withTransaction } from '@/lib/db';
import { toNumber } from '@/lib/format';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/session';
import type {
  CreateOrderInput,
  Order,
  OrderItem,
  OrderStatus,
  ReceiptData,
} from '@/lib/types';

interface OrderRow extends RowDataPacket {
  id: number;
  outlet_id: number;
  outlet_name: string;
  user_id: number;
  cashier_name: string;
  order_number: string;
  subtotal: number;
  tax: number;
  total: number;
  payment_method: 'cash' | 'debit' | 'ewallet';
  status: OrderStatus;
  created_at: string;
}

interface OrderItemRow extends RowDataPacket {
  id: number;
  order_id: number;
  product_id: number | null;
  product_name_snapshot: string;
  qty: number;
  size: string | null;
  mood: string | null;
  sugar_level: number | null;
  ice_level: number | null;
  price: number;
  notes: string | null;
}

interface SettingRow extends RowDataPacket {
  setting_key: string;
  setting_value: string;
}

function makeOrderNumber() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const i = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  const random = String(Math.floor(100 + Math.random() * 900));
  return `ORD-${y}${m}${d}-${h}${i}${s}-${random}`;
}

function mapOrder(row: OrderRow): Order {
  return {
    id: row.id,
    outletId: row.outlet_id,
    outletName: row.outlet_name,
    userId: row.user_id,
    cashierName: row.cashier_name,
    orderNumber: row.order_number,
    subtotal: Number(row.subtotal),
    tax: Number(row.tax),
    total: Number(row.total),
    paymentMethod: row.payment_method,
    status: row.status,
    createdAt: row.created_at,
  };
}

type OrderFilter = {
  status?: OrderStatus;
  outletId?: number;
  startDate?: string;
  endDate?: string;
};

async function getAuthenticatedUserId() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  const session = await verifySessionToken(sessionToken);
  return session?.uid ?? null;
}

export async function createOrder(input: CreateOrderInput): Promise<ReceiptData> {
  if (!input.items.length) {
    throw new Error('Keranjang masih kosong.');
  }

  const authenticatedUserId = await getAuthenticatedUserId();
  if (!authenticatedUserId) {
    throw new Error('Sesi login tidak valid. Silakan login ulang.');
  }

  const outletId = input.outletId ?? 1;
  const userId = authenticatedUserId;

  const subtotal = input.items.reduce(
    (totalValue, item) => totalValue + Number(item.price) * Number(item.qty),
    0,
  );
  const taxRate = Math.max(0, toNumber(input.taxRate, 0));
  const tax = (subtotal * taxRate) / 100;
  const total = subtotal + tax;

  const orderPayload = await withTransaction(async (connection) => {
    const orderNumber = makeOrderNumber();

    const [orderResult] = await connection.execute<ResultSetHeader>(
      `INSERT INTO orders
        (outlet_id, user_id, order_number, subtotal, tax, total, payment_method, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Diproses')`,
      [outletId, userId, orderNumber, subtotal, tax, total, input.paymentMethod],
    );

    const orderId = orderResult.insertId;

    for (const item of input.items) {
      await connection.execute(
        `INSERT INTO order_items
          (
            order_id,
            product_id,
            qty,
            size,
            mood,
            sugar_level,
            ice_level,
            price,
            notes,
            product_name_snapshot
          )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.productId,
          item.qty,
          item.options.size,
          item.options.mood,
          item.options.sugarLevel,
          item.options.iceLevel,
          item.price,
          item.options.notes?.trim() || null,
          item.name,
        ],
      );

      await connection.execute(
        `INSERT INTO product_stock (product_id, outlet_id, stock_qty, min_stock)
         VALUES (?, ?, 0, 0)
         ON DUPLICATE KEY UPDATE
           product_id = VALUES(product_id)`,
        [item.productId, outletId],
      );

      await connection.execute(
        `UPDATE product_stock
         SET stock_qty = GREATEST(stock_qty - ?, 0)
         WHERE product_id = ? AND outlet_id = ?`,
        [item.qty, item.productId, outletId],
      );

      await connection.execute(
        `INSERT INTO stock_movements (product_id, outlet_id, type, qty, note)
         VALUES (?, ?, 'OUT', ?, ?)`,
        [item.productId, outletId, item.qty, `Order ${orderNumber}`],
      );
    }

    return {
      orderId,
      orderNumber,
    };
  });

  const storeInfo = await dbQuery<SettingRow[]>(
    `SELECT setting_key, setting_value
     FROM settings
     WHERE outlet_id = ?
       AND setting_key IN ('store_name', 'store_address', 'store_phone')`,
    [outletId],
  );

  const settings = storeInfo.reduce(
    (acc, row) => ({
      ...acc,
      [row.setting_key]: row.setting_value,
    }),
    {} as Record<string, string>,
  );

  revalidatePath('/');
  revalidatePath('/menu');
  revalidatePath('/orders');
  revalidatePath('/history');

  return {
    storeName: settings.store_name ?? 'POS Cafe',
    storeAddress: settings.store_address ?? '-',
    storePhone: settings.store_phone ?? '-',
    orderNumber: orderPayload.orderNumber,
    createdAt: new Date().toISOString(),
    paymentMethod: input.paymentMethod,
    subtotal,
    tax,
    total,
    items: input.items.map((item) => ({
      name: item.name,
      qty: item.qty,
      price: item.price,
      notes: item.options.notes,
      size: item.options.size,
      mood: item.options.mood,
      sugarLevel: item.options.sugarLevel,
      iceLevel: item.options.iceLevel,
    })),
  };
}

export async function getOrders(filter: OrderFilter = {}): Promise<Order[]> {
  const conditions: string[] = [];
  const params: Array<number | string> = [];

  if (filter.status) {
    conditions.push('o.status = ?');
    params.push(filter.status);
  }

  if (filter.outletId) {
    conditions.push('o.outlet_id = ?');
    params.push(filter.outletId);
  }

  if (filter.startDate) {
    conditions.push('DATE(o.created_at) >= ?');
    params.push(filter.startDate);
  }

  if (filter.endDate) {
    conditions.push('DATE(o.created_at) <= ?');
    params.push(filter.endDate);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const rows = await dbQuery<OrderRow[]>(
      `SELECT
        o.id,
        o.outlet_id,
        outl.name AS outlet_name,
        o.user_id,
        u.name AS cashier_name,
        o.order_number,
        o.subtotal,
        o.tax,
        o.total,
        o.payment_method,
        o.status,
        o.created_at
      FROM orders o
      INNER JOIN outlets outl ON outl.id = o.outlet_id
      INNER JOIN users u ON u.id = o.user_id
      ${whereClause}
      ORDER BY o.created_at DESC`,
      params,
    );

    return rows.map(mapOrder);
  } catch {
    return [];
  }
}

export async function getOrderDetail(orderId: number) {
  const id = toNumber(orderId);
  if (!id) {
    throw new Error('Order tidak valid.');
  }

  const [orders, items] = await Promise.all([
    dbQuery<OrderRow[]>(
      `SELECT
        o.id,
        o.outlet_id,
        outl.name AS outlet_name,
        o.user_id,
        u.name AS cashier_name,
        o.order_number,
        o.subtotal,
        o.tax,
        o.total,
        o.payment_method,
        o.status,
        o.created_at
      FROM orders o
      INNER JOIN outlets outl ON outl.id = o.outlet_id
      INNER JOIN users u ON u.id = o.user_id
      WHERE o.id = ?
      LIMIT 1`,
      [id],
    ),
    dbQuery<OrderItemRow[]>(
      `SELECT
        id,
        order_id,
        product_id,
        product_name_snapshot,
        qty,
        size,
        mood,
        sugar_level,
        ice_level,
        price,
        notes
      FROM order_items
      WHERE order_id = ?
      ORDER BY id ASC`,
      [id],
    ),
  ]);

  if (!orders.length) {
    return null;
  }

  const mappedItems: OrderItem[] = items.map((item) => ({
    id: item.id,
    orderId: item.order_id,
    productId: item.product_id,
    productNameSnapshot: item.product_name_snapshot,
    qty: item.qty,
    size: item.size,
    mood: item.mood,
    sugarLevel: item.sugar_level,
    iceLevel: item.ice_level,
    price: Number(item.price),
    notes: item.notes,
  }));

  return {
    order: mapOrder(orders[0]),
    items: mappedItems,
  };
}

export async function getOrderItemsByOrderIds(orderIds: number[]) {
  const validOrderIds = orderIds
    .map((id) => toNumber(id))
    .filter((id): id is number => Number.isInteger(id) && id > 0);

  if (!validOrderIds.length) {
    return new Map<number, OrderItem[]>();
  }

  const placeholders = validOrderIds.map(() => '?').join(', ');

  const rows = await dbQuery<OrderItemRow[]>(
    `SELECT
      id,
      order_id,
      product_id,
      product_name_snapshot,
      qty,
      size,
      mood,
      sugar_level,
      ice_level,
      price,
      notes
    FROM order_items
    WHERE order_id IN (${placeholders})
    ORDER BY order_id DESC, id ASC`,
    validOrderIds,
  );

  const grouped = new Map<number, OrderItem[]>();

  for (const row of rows) {
    const mappedItem: OrderItem = {
      id: row.id,
      orderId: row.order_id,
      productId: row.product_id,
      productNameSnapshot: row.product_name_snapshot,
      qty: row.qty,
      size: row.size,
      mood: row.mood,
      sugarLevel: row.sugar_level,
      iceLevel: row.ice_level,
      price: Number(row.price),
      notes: row.notes,
    };

    const current = grouped.get(row.order_id) ?? [];
    current.push(mappedItem);
    grouped.set(row.order_id, current);
  }

  return grouped;
}

export async function updateOrderStatus(orderId: number, status: OrderStatus) {
  const id = toNumber(orderId);
  if (!id) {
    throw new Error('Order tidak valid.');
  }

  await pool.execute(`UPDATE orders SET status = ? WHERE id = ?`, [status, id]);

  revalidatePath('/orders');
  revalidatePath('/history');
}

export async function updateOrderStatusFromForm(formData: FormData) {
  await updateOrderStatus(
    toNumber(formData.get('orderId')),
    String(formData.get('status') ?? 'Diproses') as OrderStatus,
  );
}
