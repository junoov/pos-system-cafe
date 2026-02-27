'use server';

import 'server-only';

import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { revalidatePath } from 'next/cache';

import { dbQuery, pool } from '@/lib/db';
import { toNumber } from '@/lib/format';
import type { Category } from '@/lib/types';

interface CategoryRow extends RowDataPacket {
  id: number;
  name: string;
  icon: string | null;
  sort_order: number;
}

type CategoryInput = {
  name: string;
  icon?: string;
  sortOrder?: number;
};

export async function getCategories(): Promise<Category[]> {
  try {
    const rows = await dbQuery<CategoryRow[]>(
      `SELECT id, name, icon, sort_order
       FROM categories
       ORDER BY sort_order ASC, name ASC`,
    );

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      icon: row.icon,
      sortOrder: row.sort_order,
    }));
  } catch {
    return [];
  }
}

export async function createCategory(input: CategoryInput) {
  const name = input.name.trim();
  if (!name) {
    throw new Error('Nama kategori wajib diisi.');
  }

  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO categories (name, icon, sort_order)
     VALUES (?, ?, ?)`,
    [name, input.icon?.trim() || null, input.sortOrder ?? 0],
  );

  revalidatePath('/');
  revalidatePath('/menu');
  return result.insertId;
}

export async function updateCategory(id: number, input: CategoryInput) {
  const categoryId = toNumber(id);
  if (!categoryId) {
    throw new Error('Kategori tidak valid.');
  }

  const name = input.name.trim();
  if (!name) {
    throw new Error('Nama kategori wajib diisi.');
  }

  await pool.execute(
    `UPDATE categories
     SET name = ?, icon = ?, sort_order = ?
     WHERE id = ?`,
    [name, input.icon?.trim() || null, input.sortOrder ?? 0, categoryId],
  );

  revalidatePath('/');
  revalidatePath('/menu');
}

export async function deleteCategory(id: number) {
  const categoryId = toNumber(id);
  if (!categoryId) {
    throw new Error('Kategori tidak valid.');
  }

  await pool.execute(`DELETE FROM categories WHERE id = ?`, [categoryId]);

  revalidatePath('/');
  revalidatePath('/menu');
}

export async function createCategoryFromForm(formData: FormData) {
  await createCategory({
    name: String(formData.get('name') ?? ''),
    icon: String(formData.get('icon') ?? ''),
    sortOrder: toNumber(formData.get('sortOrder'), 0),
  });
}

export async function updateCategoryFromForm(formData: FormData) {
  await updateCategory(toNumber(formData.get('id')), {
    name: String(formData.get('name') ?? ''),
    icon: String(formData.get('icon') ?? ''),
    sortOrder: toNumber(formData.get('sortOrder'), 0),
  });
}

export async function deleteCategoryFromForm(formData: FormData) {
  await deleteCategory(toNumber(formData.get('id')));
}
