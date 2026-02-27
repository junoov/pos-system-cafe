'use server';

import { randomUUID } from 'node:crypto';
import { writeFile } from 'fs/promises';
import { extname, join } from 'path';

import 'server-only';

import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { revalidatePath } from 'next/cache';

import { dbQuery, pool } from '@/lib/db';
import { toNumber } from '@/lib/format';
import type { Product, ProductInput } from '@/lib/types';

interface ProductRow extends RowDataPacket {
  id: number;
  category_id: number;
  category_name: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: number;
  stock_qty: number | null;
  min_stock: number | null;
}

type ProductFilter = {
  categoryId?: number;
  outletId?: number;
  search?: string;
  onlyAvailable?: boolean;
};

const MAX_UPLOAD_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

function getFileExtension(file: File) {
  const fileExtension = extname(file.name).toLowerCase();
  if (ALLOWED_EXTENSIONS.has(fileExtension)) {
    return fileExtension;
  }

  if (file.type === 'image/jpeg') {
    return '.jpg';
  }

  if (file.type === 'image/png') {
    return '.png';
  }

  if (file.type === 'image/webp') {
    return '.webp';
  }

  return '';
}

async function saveProductImageFile(file: File) {
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    throw new Error('Ukuran gambar maksimal 2MB.');
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error('Format gambar harus JPG, PNG, atau WEBP.');
  }

  const extension = getFileExtension(file);
  if (!extension) {
    throw new Error('Ekstensi file gambar tidak didukung.');
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const filename = `${Date.now()}-${randomUUID()}${extension}`;
  const filePath = join(process.cwd(), 'public', 'images', filename);

  await writeFile(filePath, buffer);

  return `/images/${filename}`;
}

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    categoryId: row.category_id,
    categoryName: row.category_name,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    imageUrl: row.image_url,
    isAvailable: row.is_available === 1,
    stockQty: Number(row.stock_qty ?? 0),
    minStock: Number(row.min_stock ?? 0),
  };
}

export async function getProducts(filter: ProductFilter = {}): Promise<Product[]> {
  const conditions: string[] = [];
  const params: Array<number | string> = [];

  if (filter.categoryId) {
    conditions.push('p.category_id = ?');
    params.push(filter.categoryId);
  }

  if (filter.search?.trim()) {
    conditions.push('(p.name LIKE ? OR p.description LIKE ?)');
    const query = `%${filter.search.trim()}%`;
    params.push(query, query);
  }

  if (filter.onlyAvailable) {
    conditions.push('p.is_available = 1');
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const outletId = filter.outletId ?? 1;

  try {
    const rows = await dbQuery<ProductRow[]>(
      `SELECT
        p.id,
        p.category_id,
        c.name AS category_name,
        p.name,
        p.description,
        p.price,
        p.image_url,
        p.is_available,
        ps.stock_qty,
        ps.min_stock
      FROM products p
      INNER JOIN categories c ON c.id = p.category_id
      LEFT JOIN product_stock ps ON ps.product_id = p.id AND ps.outlet_id = ?
      ${whereClause}
      ORDER BY c.sort_order ASC, p.name ASC`,
      [outletId, ...params],
    );

    return rows.map(toProduct);
  } catch {
    return [];
  }
}

export async function createProduct(input: ProductInput) {
  const name = input.name.trim();
  if (!name) {
    throw new Error('Nama produk wajib diisi.');
  }

  const price = toNumber(input.price);
  if (price <= 0) {
    throw new Error('Harga produk tidak valid.');
  }

  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO products
      (category_id, name, description, price, image_url, is_available)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      input.categoryId,
      name,
      input.description?.trim() || null,
      price,
      input.imageUrl?.trim() || null,
      input.isAvailable === false ? 0 : 1,
    ],
  );

  const productId = result.insertId;
  const outletId = input.outletId ?? 1;

  await pool.execute(
    `INSERT INTO product_stock (product_id, outlet_id, stock_qty, min_stock)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       stock_qty = VALUES(stock_qty),
       min_stock = VALUES(min_stock)`,
    [productId, outletId, toNumber(input.stockQty, 0), toNumber(input.minStock, 0)],
  );

  revalidatePath('/');
  revalidatePath('/menu');
  return productId;
}

export async function updateProduct(id: number, input: ProductInput) {
  const productId = toNumber(id);
  if (!productId) {
    throw new Error('Produk tidak valid.');
  }

  const name = input.name.trim();
  if (!name) {
    throw new Error('Nama produk wajib diisi.');
  }

  const price = toNumber(input.price);
  if (price <= 0) {
    throw new Error('Harga produk tidak valid.');
  }

  await pool.execute(
    `UPDATE products
     SET
      category_id = ?,
      name = ?,
      description = ?,
      price = ?,
      image_url = ?,
      is_available = ?
     WHERE id = ?`,
    [
      input.categoryId,
      name,
      input.description?.trim() || null,
      price,
      input.imageUrl?.trim() || null,
      input.isAvailable === false ? 0 : 1,
      productId,
    ],
  );

  const outletId = input.outletId ?? 1;
  await pool.execute(
    `INSERT INTO product_stock (product_id, outlet_id, stock_qty, min_stock)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       stock_qty = VALUES(stock_qty),
       min_stock = VALUES(min_stock)`,
    [productId, outletId, toNumber(input.stockQty, 0), toNumber(input.minStock, 0)],
  );

  revalidatePath('/');
  revalidatePath('/menu');
}

export async function deleteProduct(id: number) {
  const productId = toNumber(id);
  if (!productId) {
    throw new Error('Produk tidak valid.');
  }

  // Hapus manual riwayat pergerakan stok (karena constraint ON DELETE RESTRICT)
  await pool.execute(`DELETE FROM stock_movements WHERE product_id = ?`, [productId]);
  
  await pool.execute(`DELETE FROM products WHERE id = ?`, [productId]);

  revalidatePath('/');
  revalidatePath('/menu');
}

export async function createProductFromForm(formData: FormData) {
  let imageUrl = String(formData.get('imageUrl') ?? '');
  const file = formData.get('imageFile') as File | null;

  if (file && file.size > 0) {
    imageUrl = await saveProductImageFile(file);
  }

  await createProduct({
    categoryId: toNumber(formData.get('categoryId')),
    name: String(formData.get('name') ?? ''),
    description: String(formData.get('description') ?? ''),
    price: toNumber(formData.get('price')),
    imageUrl: imageUrl,
    isAvailable: String(formData.get('isAvailable') ?? '1') === '1',
    stockQty: toNumber(formData.get('stockQty'), 0),
    minStock: toNumber(formData.get('minStock'), 0),
    outletId: toNumber(formData.get('outletId'), 1),
  });
}

export async function updateProductFromForm(formData: FormData) {
  let imageUrl = String(formData.get('imageUrl') ?? '');
  const file = formData.get('imageFile') as File | null;

  if (file && file.size > 0) {
    imageUrl = await saveProductImageFile(file);
  }

  await updateProduct(toNumber(formData.get('id')), {
    categoryId: toNumber(formData.get('categoryId')),
    name: String(formData.get('name') ?? ''),
    description: String(formData.get('description') ?? ''),
    price: toNumber(formData.get('price')),
    imageUrl: imageUrl,
    isAvailable: String(formData.get('isAvailable') ?? '1') === '1',
    stockQty: toNumber(formData.get('stockQty'), 0),
    minStock: toNumber(formData.get('minStock'), 0),
    outletId: toNumber(formData.get('outletId'), 1),
  });
}

export async function deleteProductFromForm(formData: FormData) {
  await deleteProduct(toNumber(formData.get('id')));
}
