import 'server-only';

import mysql from 'mysql2/promise';

declare global {
  var __posMysqlPool: mysql.Pool | undefined;
}

const pool =
  global.__posMysqlPool ??
  mysql.createPool({
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'pos_kasir_cafe',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

if (process.env.NODE_ENV !== 'production') {
  global.__posMysqlPool = pool;
}

export { pool };

export async function dbQuery<T extends mysql.RowDataPacket[]>(
  sql: string,
  params: unknown[] = [],
) {
  const [rows] = await pool.query<mysql.RowDataPacket[]>(sql, params);
  return rows as T;
}

export async function withTransaction<T>(
  executor: (connection: mysql.PoolConnection) => Promise<T>,
) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await executor(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
