/**
 * Additive checkout/customer compatibility plan for legacy MySQL/MariaDB schema.
 * Dry-run by default. Never run --apply against production.
 * Requires an independently verified backup and an isolated staging database.
 */
import { existsSync } from "node:fs";
import { config } from "dotenv";
import mysql from "mysql2/promise";

if (existsSync(".env.local")) config({ path: ".env.local", override: false });
const apply = process.argv.includes("--apply");
const allowedArgs = new Set(["--apply", "--help"]);
const unknown = process.argv.slice(2).filter((arg) => !allowedArgs.has(arg));
if (unknown.length) {
  console.error("Unknown arguments: " + unknown.join(", "));
  process.exit(1);
}
if (process.argv.includes("--help")) {
  console.log("Dry-run: npm run db:checkout-plan");
  console.log("Staging only: DB_MIGRATION_TARGET=staging DB_MIGRATION_ACK=I_HAVE_A_VERIFIED_BACKUP npm run db:checkout-plan -- --apply");
  process.exit(0);
}
if (apply && (
  process.env.DB_MIGRATION_TARGET !== "staging" ||
  process.env.DB_MIGRATION_ACK !== "I_HAVE_A_VERIFIED_BACKUP" ||
  process.env.VERCEL === "1" ||
  process.env.NODE_ENV === "production"
)) {
  console.error("Refusing schema writes: requires isolated staging, backup acknowledgement, and a non-production local runner.");
  process.exit(1);
}

const needed = ["DB_HOST", "DB_NAME", "DB_USER"];
const missing = needed.filter((key) => !process.env[key]?.trim());
if (missing.length) {
  console.error("Missing database configuration: " + missing.join(", "));
  process.exit(1);
}

const requiredLegacy = ["users", "orders", "order_items", "products", "product_variants", "payments"];
const customerColumns = [
  "id", "first_name", "last_name", "mobile", "password_hash", "role",
  "is_active", "last_login_at", "created_at", "updated_at",
];
const addressColumns = [
  "id", "customer_id", "province", "city", "address", "plaque",
  "floor", "unit", "postal_code", "phone", "is_default", "created_at", "updated_at",
];
const orderColumns = {
  customer_id: "BIGINT UNSIGNED NULL",
  cart_id: "VARCHAR(128) NULL",
  customer_landline: "VARCHAR(30) NULL",
  shipping_floor: "VARCHAR(30) NULL",
  customer_snapshot: "LONGTEXT NULL",
  payment_method: "VARCHAR(40) NULL",
};
const customerDDL = [
  "CREATE TABLE customers (",
  "id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,",
  "first_name VARCHAR(120) NOT NULL,",
  "last_name VARCHAR(120) NOT NULL,",
  "mobile VARCHAR(30) NOT NULL,",
  "password_hash VARCHAR(255) NOT NULL,",
  "role ENUM('USER','ADMIN') NOT NULL DEFAULT 'USER',",
  "is_active TINYINT(1) NOT NULL DEFAULT 1,",
  "last_login_at DATETIME NULL,",
  "created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,",
  "updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,",
  "UNIQUE KEY uq_customers_mobile (mobile)",
  ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
].join(" ");
const addressDDL = [
  "CREATE TABLE customer_addresses (",
  "id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,",
  "customer_id BIGINT UNSIGNED NOT NULL,",
  "province VARCHAR(100) NOT NULL,",
  "city VARCHAR(100) NOT NULL,",
  "address TEXT NOT NULL,",
  "plaque VARCHAR(30) NOT NULL,",
  "floor VARCHAR(30) NULL,",
  "unit VARCHAR(30) NULL,",
  "postal_code VARCHAR(20) NULL,",
  "phone VARCHAR(30) NULL,",
  "is_default TINYINT(1) NOT NULL DEFAULT 1,",
  "created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,",
  "updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,",
  "KEY idx_customer_addresses_customer_id (customer_id),",
  "CONSTRAINT fk_customer_addresses_customer FOREIGN KEY (customer_id)",
  "REFERENCES customers(id) ON DELETE CASCADE",
  ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
].join(" ");

let conn;
try {
  const mode = (process.env.DB_SSL_MODE || "disabled").toLowerCase();
  if (!["required", "disabled"].includes(mode)) throw new Error("Invalid DB_SSL_MODE");
  const port = Number(process.env.DB_PORT || 3306);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) throw new Error("Invalid DB_PORT");
  conn = await mysql.createConnection({
    host: process.env.DB_HOST.trim(),
    port,
    user: process.env.DB_USER.trim(),
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME.trim(),
    connectTimeout: 10000,
    ssl: mode === "required" ? {
      rejectUnauthorized: true,
      ...(process.env.DB_SSL_CA ? { ca: process.env.DB_SSL_CA.replace(/\\n/g, "\n") } : {}),
    } : undefined,
  });
  const [meta] = await conn.query(
    "SELECT TABLE_NAME, COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE()"
  );
  const foundTables = new Set(meta.map((row) => row.TABLE_NAME));
  const foundColumns = new Set(meta.map((row) => row.TABLE_NAME + "." + row.COLUMN_NAME));
  const missingLegacy = requiredLegacy.filter((name) => !foundTables.has(name));
  if (missingLegacy.length) throw new Error("Legacy schema incomplete: " + missingLegacy.join(", "));

  // Never change partially populated, unexpected customer tables automatically.
  for (const [table, cols] of [
    ["customers", customerColumns],
    ["customer_addresses", addressColumns],
  ]) {
    if (!foundTables.has(table)) continue;
    const unexpected = cols.filter((name) => !foundColumns.has(table + "." + name));
    if (unexpected.length) {
      throw new Error("Incompatible pre-existing " + table + " table; manual review required for: " + unexpected.join(", "));
    }
  }

  const plan = [];
  if (!foundTables.has("customers")) plan.push(["Create customers", customerDDL]);
  if (!foundTables.has("customer_addresses")) plan.push(["Create customer_addresses", addressDDL]);
  for (const [name, definition] of Object.entries(orderColumns)) {
    if (!foundColumns.has("orders." + name)) {
      plan.push(["Add orders." + name, "ALTER TABLE orders ADD COLUMN " + name + " " + definition]);
    }
  }
  // Index new customer relationship without changing historical user_id or address_id.
  // Check indexes separately so an interrupted partial migration can safely resume.
  const [customerIndexes] = await conn.query(
    "SELECT INDEX_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='orders' AND COLUMN_NAME='customer_id'"
  );
  if (customerIndexes.length === 0) {
    plan.push(["Index orders.customer_id", "ALTER TABLE orders ADD INDEX idx_orders_customer_id (customer_id)"]);
  }
  console.log("Connected to MySQL/MariaDB; " + plan.length + " additive schema change(s) required.");
  for (const [label] of plan) console.log(" - " + label);
  if (!apply) {
    console.log("READ ONLY. No changes executed. Use --apply on a backed-up isolated staging database.");
  } else {
    // MySQL DDL commits implicitly; every operation is designed to be additive and restartable.
    for (const [label, sql] of plan) {
      await conn.query(sql);
      console.log("Applied: " + label);
    }
    console.log("Staging schema reconciliation complete. Run npm run db:verify and full E2E tests.");
  }
} catch (error) {
  console.error("Checkout schema plan failed: " + (error?.code || error?.message || "UNKNOWN"));
  process.exitCode = 1;
} finally {
  await conn?.end().catch(() => {});
}
