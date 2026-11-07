/**
 * Runs only on a disposable CI MySQL service. Never point at a real database.
 * Proves checkout schema plan is read-only by default, additive, restartable
 * and preserves pre-existing historical orders.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import mysql from "mysql2/promise";

assert.equal(process.env.CI, "true", "This integration test runs only in CI.");
assert.equal(process.env.DB_TEST_ALLOW, "ci-disposable", "Disposable DB approval missing.");
assert.equal(process.env.DB_HOST, "127.0.0.1", "Only a local CI service is permitted.");
assert.equal(process.env.DB_NAME, "fertini_ci_checkout", "Refusing an unexpected database name.");
const cfg = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};
const conn = await mysql.createConnection(cfg);
const script = "scripts/prepare-mysql-checkout-schema.mjs";
function run(args, env = {}) {
  return spawnSync(process.execPath, [script, ...args], {
    encoding: "utf8",
    env: { ...process.env, ...env, NODE_ENV: "development", VERCEL: "" },
    timeout: 30000,
  });
}
try {
  await conn.query("CREATE TABLE users (id BIGINT UNSIGNED NOT NULL PRIMARY KEY)");
  await conn.query("CREATE TABLE orders (id BIGINT UNSIGNED NOT NULL PRIMARY KEY, order_number VARCHAR(80) NOT NULL, user_id BIGINT UNSIGNED NULL)");
  await conn.query("CREATE TABLE order_items (id BIGINT UNSIGNED NOT NULL PRIMARY KEY)");
  await conn.query("CREATE TABLE products (id BIGINT UNSIGNED NOT NULL PRIMARY KEY)");
  await conn.query("CREATE TABLE product_variants (id BIGINT UNSIGNED NOT NULL PRIMARY KEY)");
  await conn.query("CREATE TABLE payments (id BIGINT UNSIGNED NOT NULL PRIMARY KEY)");
  await conn.execute("INSERT INTO orders (id, order_number, user_id) VALUES (101, 'historical-101', 5)");

  const dry = run([]);
  assert.equal(dry.status, 0, dry.stderr);
  assert.match(dry.stdout, /READ ONLY/);
  const [beforeTables] = await conn.query("SHOW TABLES LIKE 'customers'");
  assert.equal(beforeTables.length, 0, "Dry run unexpectedly created tables.");

  const deny = run(["--apply"], { DB_MIGRATION_TARGET: "production", DB_MIGRATION_ACK: "I_HAVE_A_VERIFIED_BACKUP" });
  assert.notEqual(deny.status, 0, "Production write guard must reject migration.");

  const authorized = {
    DB_MIGRATION_TARGET: "staging",
    DB_MIGRATION_ACK: "I_HAVE_A_VERIFIED_BACKUP",
  };
  const first = run(["--apply"], authorized);
  assert.equal(first.status, 0, first.stderr + first.stdout);
  const [tables] = await conn.query(
    "SELECT TABLE_NAME, COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE()"
  );
  const cols = new Set(tables.map((row) => row.TABLE_NAME + "." + row.COLUMN_NAME));
  for (const name of [
    "customers.id", "customers.mobile", "customers.password_hash",
    "customer_addresses.customer_id", "customer_addresses.is_default",
    "orders.customer_id", "orders.cart_id", "orders.shipping_floor",
    "orders.customer_landline", "orders.payment_method", "orders.customer_snapshot",
  ]) assert.ok(cols.has(name), "Missing migrated field: " + name);

  const [saved] = await conn.query("SELECT order_number, user_id FROM orders WHERE id=101");
  assert.equal(saved.length, 1);
  assert.equal(saved[0].order_number, "historical-101");
  assert.equal(saved[0].user_id, 5);

  const again = run(["--apply"], authorized);
  assert.equal(again.status, 0, again.stderr + again.stdout);
  assert.match(again.stdout, /0 additive schema change/);

  const [after] = await conn.query("SELECT COUNT(*) AS n FROM orders");
  assert.equal(after[0].n, 1, "Historical order was changed.");
  console.log("Safe checkout schema migration: dry-run, production guard, staging apply, idempotency and historical order preservation PASS.");
} finally {
  await conn.end();
}
