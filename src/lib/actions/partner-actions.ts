'use server';

import 'server-only';

import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { revalidatePath } from 'next/cache';

import { dbQuery, pool } from '@/lib/db';
import { toNumber } from '@/lib/format';
import type { Partner } from '@/lib/types';

interface PartnerRow extends RowDataPacket {
  id: number;
  name: string;
  contact: string | null;
  address: string | null;
}

type PartnerInput = {
  name: string;
  contact?: string;
  address?: string;
};

export async function getPartners(): Promise<Partner[]> {
  try {
    const rows = await dbQuery<PartnerRow[]>(
      `SELECT id, name, contact, address
       FROM partners
       ORDER BY name ASC`,
    );

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      contact: row.contact,
      address: row.address,
    }));
  } catch {
    return [];
  }
}

export async function createPartner(input: PartnerInput) {
  const name = input.name.trim();
  if (!name) {
    throw new Error('Nama partner wajib diisi.');
  }

  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO partners (name, contact, address)
     VALUES (?, ?, ?)`,
    [name, input.contact?.trim() || null, input.address?.trim() || null],
  );

  revalidatePath('/partners');
  return result.insertId;
}

export async function updatePartner(id: number, input: PartnerInput) {
  const partnerId = toNumber(id);
  if (!partnerId) {
    throw new Error('Partner tidak valid.');
  }

  const name = input.name.trim();
  if (!name) {
    throw new Error('Nama partner wajib diisi.');
  }

  await pool.execute(
    `UPDATE partners
     SET name = ?, contact = ?, address = ?
     WHERE id = ?`,
    [name, input.contact?.trim() || null, input.address?.trim() || null, partnerId],
  );

  revalidatePath('/partners');
}

export async function deletePartner(id: number) {
  const partnerId = toNumber(id);
  if (!partnerId) {
    throw new Error('Partner tidak valid.');
  }

  await pool.execute(`DELETE FROM partners WHERE id = ?`, [partnerId]);
  revalidatePath('/partners');
}

export async function createPartnerFromForm(formData: FormData) {
  await createPartner({
    name: String(formData.get('name') ?? ''),
    contact: String(formData.get('contact') ?? ''),
    address: String(formData.get('address') ?? ''),
  });
}

export async function updatePartnerFromForm(formData: FormData) {
  await updatePartner(toNumber(formData.get('id')), {
    name: String(formData.get('name') ?? ''),
    contact: String(formData.get('contact') ?? ''),
    address: String(formData.get('address') ?? ''),
  });
}

export async function deletePartnerFromForm(formData: FormData) {
  await deletePartner(toNumber(formData.get('id')));
}
