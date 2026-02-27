'use server';

import 'server-only';

import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { revalidatePath } from 'next/cache';

import { dbQuery, pool } from '@/lib/db';
import { toNumber } from '@/lib/format';
import type { Outlet, SettingsMap } from '@/lib/types';

interface OutletRow extends RowDataPacket {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
}

interface SettingRow extends RowDataPacket {
  setting_key: string;
  setting_value: string;
}

type SettingInput = {
  outletId?: number;
  key: string;
  value: string;
};

const defaultSettings: SettingsMap = {
  store_name: 'POS Cafe',
  store_address: '-',
  store_phone: '-',
  tax_rate: '10',
  receipt_paper: '80mm',
};

export async function getSettings(outletId = 1): Promise<SettingsMap> {
  try {
    const rows = await dbQuery<SettingRow[]>(
      `SELECT setting_key, setting_value
       FROM settings
       WHERE outlet_id = ?`,
      [outletId],
    );

    return rows.reduce(
      (acc, row) => ({
        ...acc,
        [row.setting_key]: row.setting_value,
      }),
      { ...defaultSettings },
    );
  } catch {
    return { ...defaultSettings };
  }
}

export async function updateSetting(input: SettingInput) {
  const outletId = input.outletId ?? 1;
  const key = input.key.trim();

  if (!key) {
    throw new Error('Key pengaturan wajib diisi.');
  }

  await pool.execute(
    `INSERT INTO settings (outlet_id, setting_key, setting_value)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE
       setting_value = VALUES(setting_value)`,
    [outletId, key, input.value.trim()],
  );

  revalidatePath('/');
  revalidatePath('/settings');
}

export async function updateSettingFromForm(formData: FormData) {
  await updateSetting({
    outletId: toNumber(formData.get('outletId'), 1),
    key: String(formData.get('key') ?? ''),
    value: String(formData.get('value') ?? ''),
  });
}

export async function getOutlets(): Promise<Outlet[]> {
  try {
    const rows = await dbQuery<OutletRow[]>(
      `SELECT id, name, address, phone
       FROM outlets
       ORDER BY id ASC`,
    );

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      address: row.address,
      phone: row.phone,
    }));
  } catch {
    return [];
  }
}

export async function createOutlet(input: {
  name: string;
  address?: string;
  phone?: string;
}) {
  const name = input.name.trim();
  if (!name) {
    throw new Error('Nama outlet wajib diisi.');
  }

  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO outlets (name, address, phone)
     VALUES (?, ?, ?)`,
    [name, input.address?.trim() || null, input.phone?.trim() || null],
  );

  revalidatePath('/settings');
  return result.insertId;
}

export async function createOutletFromForm(formData: FormData) {
  await createOutlet({
    name: String(formData.get('name') ?? ''),
    address: String(formData.get('address') ?? ''),
    phone: String(formData.get('phone') ?? ''),
  });
}
