'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import { dbQuery, pool } from '@/lib/db';
import { hashPassword, isLegacyPlaintextPassword, verifyPassword } from '@/lib/security';
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from '@/lib/session';

interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  role: string;
  password: string;
}

export async function login(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    throw new Error('Email atau password wajib diisi');
  }

  const users = await dbQuery<UserRow[]>(
    `SELECT id, name, email, role, password
     FROM users
     WHERE email = ?
     LIMIT 1`,
    [email],
  );

  if (!users.length) {
    throw new Error('Email atau password salah');
  }

  const user = users[0];
  const isPasswordValid = await verifyPassword(password, user.password);

  if (!isPasswordValid) {
    throw new Error('Email atau password salah');
  }

  if (isLegacyPlaintextPassword(user.password)) {
    const hashedPassword = await hashPassword(password);
    await pool.execute<ResultSetHeader>(
      'UPDATE users SET password = ? WHERE id = ? LIMIT 1',
      [hashedPassword, user.id],
    );
  }

  const sessionToken = await createSessionToken(user.id);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: '/',
  });

  cookieStore.delete('session_user_id');
  cookieStore.delete('session_user_name');
  cookieStore.delete('session_user_role');

  redirect('/');
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  cookieStore.delete('session_user_id');
  cookieStore.delete('session_user_name');
  cookieStore.delete('session_user_role');
  redirect('/login');
}
