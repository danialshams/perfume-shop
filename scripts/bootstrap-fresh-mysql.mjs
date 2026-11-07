/**
 * FERTINI fresh MySQL bootstrap: refuses existing tables, productions, and Vercel.
 * Run once against an already-created EMPTY database on a managed MySQL host.
 */
import { existsSync, readFileSync } from "node:fs";
import { config } from "dotenv";
import mysql from "mysql2/promise";
if (existsSync(".env.local")) config({ path: ".env.local", override: false });
if (process.env.FERTINI_BOOTSTRAP_CONFIRM !== "CREATE_EMPTY_DATABASE_SCHEMA" ||
    process.env.NODE_ENV === "production" || process.env.VERCEL === "1") {
  console.error("Refusing bootstrap: a local explicit one-time setup for an EMPTY DB only.");
  process.exit(1);
}
const missing = ["DB_HOST","DB_NAME","DB_USER"].filter(k => !process.env[k]?.trim());
if (missing.length) { console.error("Missing MySQL connection settings: " + missing.join(", ")); process.exit(1); }
if (["mysql","information_schema","performance_schema","sys"].includes(process.env.DB_NAME.trim().toLowerCase())) {
  console.error("Refusing system database."); process.exit(1);
}
const sslMode = (process.env.DB_SSL_MODE || "disabled").toLowerCase();
if (!["disabled","required"].includes(sslMode)) throw Error("Invalid DB_SSL_MODE");
const sql = readFileSync("database/fresh-schema.sql","utf8");
const statements = sql.split(/;\s*(?:\r?\n|$)/).map(x => x.trim()).filter(Boolean)
  .map(x => x.replace(/^(?:(?:--[^\n]*\n)+\s*)/, "").trim()).filter(Boolean);
if (statements.length < 90 ||
    statements.some(x => !(x.startsWith("CREATE TABLE ") || x.startsWith("ALTER TABLE ")))) {
  console.error("Invalid or unsafe fresh schema. Refusing."); process.exit(1);
}
let connection;
try {
  connection = await mysql.createConnection({
    host: process.env.DB_HOST.trim(),port:Number(process.env.DB_PORT||3306),
    user:process.env.DB_USER.trim(),password:process.env.DB_PASSWORD||"",
    database:process.env.DB_NAME.trim(),connectTimeout:10000,
    ssl:sslMode==="required"?{rejectUnauthorized:true,...(process.env.DB_SSL_CA
      ?{ca:process.env.DB_SSL_CA.replace(/\\n/g,"\n")}: {})}:undefined,
  });
  const [existing] = await connection.query("SHOW TABLES");
  if (existing.length) {
    console.error("Database is not empty ("+existing.length+" tables). Refusing bootstrap."); process.exitCode=1;
  } else {
    for (const [index,stmt] of statements.entries()) {
      try { await connection.query(stmt); }
      catch(error) {
        const code = error && typeof error === "object" && "code" in error ? String(error.code) : "UNKNOWN";
        throw Error("DDL "+(index+1)+"/"+statements.length+" failed: "+code);
      }
    }
    const [tables] = await connection.query("SHOW TABLES");
    console.log("Fresh MySQL ready: "+tables.length+" tables, no historical records imported.");
  }
} catch(error) {
  console.error("Fresh schema setup failed: "+(error instanceof Error?error.message:"UNKNOWN"));
  console.error("MySQL DDL commits individually. Examine the PARTIALLY created empty database before retrying.");
  process.exitCode=1;
} finally { await connection?.end().catch(()=>{}); }
