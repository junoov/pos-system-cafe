'use server';

import 'server-only';

import type { RowDataPacket } from 'mysql2/promise';
import { revalidatePath } from 'next/cache';

import { dbQuery, pool } from '@/lib/db';
import { toNumber } from '@/lib/format';

interface StockRow extends RowDataPacket {
  product_id: number;
  product_name: string;
  outlet_id: number;
  outlet_name: string;
  stock_qty: number;
  min_stock: number;
}

interface StockMovementRow extends RowDataPacket {
  id: number;
  product_id: number;
  product_name: string;
  outlet_id: number;
  outlet_name: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  qty: number;
  note: string | null;
  created_at: string;
}

type StockUpdateInput = {
  productId: number;
  outletId?: number;
  stockQty: number;
  minStock?: number;
  note?: string;
};

type StockMovementInput = {
  productId: number;
  outletId?: number;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  qty: number;
  note?: string;
};

export async function getStock(outletId = 1) {
  try {
    return await dbQuery<StockRow[]>(
      `SELECT
        ps.product_id,
        p.name AS product_name,
        ps.outlet_id,
        o.name AS outlet_name,
        ps.stock_qty,
        ps.min_stock
      FROM product_stock ps
      INNER JOIN products p ON p.id = ps.product_id
      INNER JOIN outlets o ON o.id = ps.outlet_id
      WHERE ps.outlet_id = ?
      ORDER BY p.name ASC`,
      [outletId],
    );
  } catch {
    return [];
  }
}

export async function addStockMovement(input: StockMovementInput) {
  const outletId = input.outletId ?? 1;
  const qty = Math.max(1, toNumber(input.qty, 1));

  await pool.execute(
    `INSERT INTO stock_movements (product_id, outlet_id, type, qty, note)
     VALUES (?, ?, ?, ?, ?)`,
    [input.productId, outletId, input.type, qty, input.note?.trim() || null],
  );

  revalidatePath('/menu');
}

export async function updateStock(input: StockUpdateInput) {
  const outletId = input.outletId ?? 1;

  await pool.execute(
    `INSERT INTO product_stock (product_id, outlet_id, stock_qty, min_stock)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
      stock_qty = VALUES(stock_qty),
      min_stock = VALUES(min_stock)`,
    [input.productId, outletId, Math.max(0, toNumber(input.stockQty, 0)), toNumber(input.minStock, 0)],
  );

  await addStockMovement({
    productId: input.productId,
    outletId,
    type: 'ADJUSTMENT',
    qty: Math.abs(toNumber(input.stockQty, 0)),
    note: input.note?.trim() || 'Penyesuaian stok manual',
  });

  revalidatePath('/menu');
}

export async function getStockMovements(outletId = 1, limit = 20) {
  try {
    return await dbQuery<StockMovementRow[]>(
      `SELECT
        sm.id,
        sm.product_id,
        p.name AS product_name,
        sm.outlet_id,
        o.name AS outlet_name,
        sm.type,
        sm.qty,
        sm.note,
        sm.created_at
      FROM stock_movements sm
      INNER JOIN products p ON p.id = sm.product_id
      INNER JOIN outlets o ON o.id = sm.outlet_id
      WHERE sm.outlet_id = ?
      ORDER BY sm.created_at DESC
      LIMIT ?`,
      [outletId, limit],
    );
  } catch {
    return [];
  }
}

export async function updateStockFromForm(formData: FormData) {
  await updateStock({
    productId: toNumber(formData.get('productId')),
    outletId: toNumber(formData.get('outletId'), 1),
    stockQty: toNumber(formData.get('stockQty'), 0),
    minStock: toNumber(formData.get('minStock'), 0),
    note: String(formData.get('note') ?? ''),
  });
}

export async function addStockMovementFromForm(formData: FormData) {
  await addStockMovement({
    productId: toNumber(formData.get('productId')),
    outletId: toNumber(formData.get('outletId'), 1),
    type: String(formData.get('type') ?? 'ADJUSTMENT') as 'IN' | 'OUT' | 'ADJUSTMENT',
    qty: toNumber(formData.get('qty'), 1),
    note: String(formData.get('note') ?? ''),
  });
}
