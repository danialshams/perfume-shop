import mysql from "mysql2/promise";

function required(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

declare global {
  var __mysqlPool: mysql.Pool | undefined;
}

export const db =
  global.__mysqlPool ??
  mysql.createPool({
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

if (!global.__mysqlPool) {
  global.__mysqlPool = db;
}

export async function getConnection() {
  return db.getConnection();
}
