'use server';

import 'server-only';

import type { RowDataPacket } from 'mysql2/promise';

import { dbQuery } from '@/lib/db';

interface DailyReportRow extends RowDataPacket {
  total_orders: number;
  subtotal_sum: number;
  tax_sum: number;
  total_sum: number;
}

interface RevenueByCategoryRow extends RowDataPacket {
  category_id: number;
  category_name: string;
  revenue: number;
  total_qty: number;
}

interface TopProductRow extends RowDataPacket {
  product_id: number;
  product_name: string;
  total_qty: number;
  total_revenue: number;
}

export async function getDailyReport(date = new Date().toISOString().slice(0, 10), outletId = 1) {
  try {
    const [row] = await dbQuery<DailyReportRow[]>(
      `SELECT
        COUNT(*) AS total_orders,
        COALESCE(SUM(subtotal), 0) AS subtotal_sum,
        COALESCE(SUM(tax), 0) AS tax_sum,
        COALESCE(SUM(total), 0) AS total_sum
      FROM orders
      WHERE status = 'Selesai'
        AND DATE(created_at) = ?
        AND outlet_id = ?`,
      [date, outletId],
    );

    return {
      date,
      totalOrders: Number(row?.total_orders ?? 0),
      subtotal: Number(row?.subtotal_sum ?? 0),
      tax: Number(row?.tax_sum ?? 0),
      total: Number(row?.total_sum ?? 0),
    };
  } catch {
    return {
      date,
      totalOrders: 0,
      subtotal: 0,
      tax: 0,
      total: 0,
    };
  }
}

export async function getMonthlyReport(month = new Date().toISOString().slice(0, 7), outletId = 1) {
  try {
    const [row] = await dbQuery<DailyReportRow[]>(
      `SELECT
        COUNT(*) AS total_orders,
        COALESCE(SUM(subtotal), 0) AS subtotal_sum,
        COALESCE(SUM(tax), 0) AS tax_sum,
        COALESCE(SUM(total), 0) AS total_sum
      FROM orders
      WHERE status = 'Selesai'
        AND DATE_FORMAT(created_at, '%Y-%m') = ?
        AND outlet_id = ?`,
      [month, outletId],
    );

    return {
      month,
      totalOrders: Number(row?.total_orders ?? 0),
      subtotal: Number(row?.subtotal_sum ?? 0),
      tax: Number(row?.tax_sum ?? 0),
      total: Number(row?.total_sum ?? 0),
    };
  } catch {
    return {
      month,
      totalOrders: 0,
      subtotal: 0,
      tax: 0,
      total: 0,
    };
  }
}

export async function getRevenueByCategory(
  startDate: string,
  endDate: string,
  outletId = 1,
) {
  try {
    const rows = await dbQuery<RevenueByCategoryRow[]>(
      `SELECT
        c.id AS category_id,
        c.name AS category_name,
        COALESCE(SUM(oi.qty * oi.price), 0) AS revenue,
        COALESCE(SUM(oi.qty), 0) AS total_qty
      FROM order_items oi
      INNER JOIN orders o ON o.id = oi.order_id
      LEFT JOIN products p ON p.id = oi.product_id
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE o.status = 'Selesai'
        AND o.outlet_id = ?
        AND DATE(o.created_at) BETWEEN ? AND ?
      GROUP BY c.id, c.name
      ORDER BY revenue DESC`,
      [outletId, startDate, endDate],
    );

    return rows.map((row) => ({
      categoryId: Number(row.category_id),
      categoryName: row.category_name ?? 'Tanpa Kategori',
      revenue: Number(row.revenue),
      totalQty: Number(row.total_qty),
    }));
  } catch {
    return [];
  }
}

export async function getTopProducts(
  limit = 5,
  startDate?: string,
  endDate?: string,
  outletId = 1,
) {
  const params: Array<number | string> = [outletId];
  let dateCondition = '';

  if (startDate && endDate) {
    dateCondition = 'AND DATE(o.created_at) BETWEEN ? AND ?';
    params.push(startDate, endDate);
  }

  params.push(limit);

  try {
    const rows = await dbQuery<TopProductRow[]>(
      `SELECT
        COALESCE(p.id, 0) AS product_id,
        oi.product_name_snapshot AS product_name,
        COALESCE(SUM(oi.qty), 0) AS total_qty,
        COALESCE(SUM(oi.qty * oi.price), 0) AS total_revenue
      FROM order_items oi
      INNER JOIN orders o ON o.id = oi.order_id
      LEFT JOIN products p ON p.id = oi.product_id
      WHERE o.status = 'Selesai'
        AND o.outlet_id = ?
        ${dateCondition}
      GROUP BY p.id, oi.product_name_snapshot
      ORDER BY total_qty DESC
      LIMIT ?`,
      params,
    );

    return rows.map((row) => ({
      productId: Number(row.product_id),
      productName: row.product_name,
      totalQty: Number(row.total_qty),
      totalRevenue: Number(row.total_revenue),
    }));
  } catch {
    return [];
  }
}
