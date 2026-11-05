import mysql from "mysql2/promise";

/**
 * Initializing the MySQL pool at module import time breaks Next.js / Vercel
 * page-data collection when the database is only available at runtime.
 * The pool is created on the first actual query instead.
 */
function required(name: string, value: string | undefined) {
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

declare global {
  var __mysqlPool: mysql.Pool | undefined;
}

function getPool(): mysql.Pool {
  if (!global.__mysqlPool) {
    global.__mysqlPool = mysql.createPool({
      host: required("DB_HOST", process.env.DB_HOST),
      port: Number(process.env.DB_PORT || 3306),
      user: required("DB_USER", process.env.DB_USER),
      password: process.env.DB_PASSWORD || "",
      database: required("DB_NAME", process.env.DB_NAME),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      namedPlaceholders: true,
    });
  }
  return global.__mysqlPool;
}

// Preserve the existing mysql.Pool API without requiring DB secrets at build time.
export const db: mysql.Pool = new Proxy({} as mysql.Pool, {
  get(_target, key) {
    const pool = getPool();
    const value = Reflect.get(pool, key, pool);
    return typeof value === "function" ? value.bind(pool) : value;
  },
});

export async function getConnection() {
  return getPool().getConnection();
}
