import postgres, { type Sql } from "postgres";
import type mysql from "mysql2/promise";

/**
 * Portable PostgreSQL 17 data access with an adapter for existing repository signatures.
 * Every server module uses DATABASE_URL; mysql2 is imported for types ONLY.
 * Native Pg wire protocol is provided by postgres.js (not a hosted-specific SDK).
 */
type Parameters = unknown[] | Record<string, unknown>;
type PgConnection = {
  query<T = unknown>(query: string, params?: Parameters): Promise<[T, unknown[]]>;
  execute<T = unknown>(query: string, params?: Parameters): Promise<[T, unknown[]]>;
  beginTransaction(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  release(): void;
};
type PgPool = PgConnection & { getConnection(): Promise<PgConnection> };

declare global {
  var __fertiniPgPool: PgPool | undefined;
  var __fertiniPgSql: Sql | undefined;
}
function required(name: string, value: string | undefined): string {
  const v = value?.trim();
  if (!v) throw new Error("Missing environment variable: " + name);
  return v;
}
function getSql(): Sql {
  if (!globalThis.__fertiniPgSql) {
    const url = required("DATABASE_URL", process.env.DATABASE_URL);
    if (!/^postgres(?:ql)?:\/\//i.test(url)) throw Error("DATABASE_URL must be PostgreSQL");
    const max = Number(process.env.DB_POOL_LIMIT || 4);
    if (!Number.isInteger(max) || max < 1 || max > 20) throw Error("DB_POOL_LIMIT must be 1-20");
    globalThis.__fertiniPgSql = postgres(url, {
      max, idle_timeout: 20, connect_timeout: 10,
      transform: { undefined: null },
    });
  }
  return globalThis.__fertiniPgSql;
}
/**
 * Port numbered positional and legacy named parameters to PostgreSQL safely.
 * No values are interpolated into SQL; they're always passed to unsafe with binds.
 */
export function compilePgQuery(input: string, inputParams: Parameters = []): { text: string; params: unknown[] } {
  const params: unknown[] = [];
  const named = (!Array.isArray(inputParams) && inputParams && typeof inputParams === "object")
    ? inputParams : null;
  const source = Array.isArray(inputParams) ? inputParams : [];
  const names = new Map<string, number>();
  let sql = "", quote: "'" | '"' | null = null;
  let index = 0;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i], next = input[i + 1];
    if (quote) {
      sql += ch;
      if (ch === quote && next === quote) { sql += next; i++; }
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"') { quote = ch; sql += ch; continue; }
    if (ch === "?" && !named) {
      if (index >= source.length) throw Error("Missing positional SQL parameter");
      params.push(source[index++]); sql += "$" + params.length; continue;
    }
    if (ch === ":" && next !== ":" && input[i - 1] !== ":" && /[A-Za-z_]/.test(next || "")) {
      const match = input.slice(i + 1).match(/^[A-Za-z_][A-Za-z_0-9]*/);
      if (match && named) {
        const key = match[0];
        if (!(key in named)) throw Error("Missing named SQL parameter: " + key);
        if (!names.has(key)) { params.push(named[key]); names.set(key, params.length); }
        sql += "$" + names.get(key); i += key.length; continue;
      }
    }
    sql += ch;
  }
  if (!named && index !== source.length) throw Error("Extra SQL parameters provided");
  // MySQL gave INSERT callers an insertId; RETURNING is the PostgreSQL equivalent.
  if (/^\s*INSERT\s+INTO\s/i.test(sql) && !/\bRETURNING\b/i.test(sql)) {
    sql = sql.trim().replace(/;\s*$/, "") + " RETURNING id";
  }
  return { text: sql, params };
}
function adaptResult<T>(query: string, rows: any): [T, unknown[]] {
  const command = query.trim().split(/\s+/)[0].toUpperCase();
  if (["INSERT","UPDATE","DELETE"].includes(command)) {
    const insertedId = Number(rows[0]?.id || 0);
    const count = Number(rows.count ?? rows.length ?? 0);
    return [{ insertId: insertedId, affectedRows: count, changedRows: count } as T, []];
  }
  return [rows as T, []];
}
function makeExecutor(target: any) {
  const runner = async <T = unknown>(query: string, params: Parameters = []): Promise<[T, unknown[]]> => {
    const compiled = compilePgQuery(query, params);
    const results = await target.unsafe(compiled.text, compiled.params, { prepare: false });
    return adaptResult<T>(compiled.text, results);
  };
  return { query: runner, execute: runner };
}
async function reserve(): Promise<PgConnection> {
  const connection: any = await getSql().reserve();
  const executor = makeExecutor(connection);
  return {
    ...executor,
    beginTransaction: async () => { await connection.unsafe("BEGIN"); },
    commit: async () => { await connection.unsafe("COMMIT"); },
    rollback: async () => { await connection.unsafe("ROLLBACK"); },
    release: () => connection.release(),
  };
}
function getPool(): PgPool {
  if (!globalThis.__fertiniPgPool) {
    const sql = getSql();
    const executor = makeExecutor(sql);
    globalThis.__fertiniPgPool = {
      ...executor,
      getConnection: reserve,
      beginTransaction: async () => { throw Error("Use db.getConnection() before starting a transaction"); },
      commit: async () => { throw Error("Pool cannot commit"); },
      rollback: async () => { throw Error("Pool cannot rollback"); },
      release: () => {},
    };
  }
  return globalThis.__fertiniPgPool;
}
// Preserve repository signatures while the legacy mysql2 types are phased out.
export const db: mysql.Pool = new Proxy({} as mysql.Pool, {
  get(_target, key) {
    const pool = getPool() as any;
    const value = Reflect.get(pool, key, pool);
    return typeof value === "function" ? value.bind(pool) : value;
  },
});
export async function getConnection(): Promise<mysql.PoolConnection> {
  return await reserve() as unknown as mysql.PoolConnection;
}
