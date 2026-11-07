import mysql from "mysql2/promise";

/** One lazy MySQL pool for the entire application, shared between old and new API modules.
 * Never create a pool while Next.js is collecting pages at build time.
 */
function required(name: string, value: string | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) throw new Error(`Missing environment variable: ${name}`);
  return trimmed;
}

declare global {
  var __mysqlPool: mysql.Pool | undefined;
}

function getPool(): mysql.Pool {
  if (!global.__mysqlPool) {
    const host = required("DB_HOST", process.env.DB_HOST);
    if (process.env.VERCEL === "1" && ["localhost", "127.0.0.1", "::1"].includes(host.toLowerCase())) {
      throw new Error("DB_HOST must be a remotely reachable MySQL host on Vercel");
    }
    const port = Number(process.env.DB_PORT || 3306);
    const poolLimit = Number(process.env.DB_POOL_LIMIT || 4);
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid DB_PORT");
    if (!Number.isInteger(poolLimit) || poolLimit < 1 || poolLimit > 20) throw new Error("Invalid DB_POOL_LIMIT");
    const sslMode = (process.env.DB_SSL_MODE || "disabled").toLowerCase();
    if (!["disabled", "required"].includes(sslMode)) throw new Error("Invalid DB_SSL_MODE");
    const ssl = sslMode === "required"
      ? { rejectUnauthorized: true, ...(process.env.DB_SSL_CA ? { ca: process.env.DB_SSL_CA.replace(/\\n/g, "\n") } : {}) }
      : undefined;
    global.__mysqlPool = mysql.createPool({
      host,
      port,
      user: required("DB_USER", process.env.DB_USER),
      password: process.env.DB_PASSWORD || "",
      database: required("DB_NAME", process.env.DB_NAME),
      ssl,
      waitForConnections: true,
      connectionLimit: poolLimit,
      connectTimeout: 10000,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      queueLimit: 0,
      namedPlaceholders: true,
      charset: "utf8mb4",
    });
  }
  return global.__mysqlPool;
}

// Retain the mysql.Pool contract for existing queries and transactions.
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
