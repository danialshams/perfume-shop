#!/usr/bin/env node
/**
 * Read-only photo inventory for the MAISON media migration.
 * - --inventory (default) scans disk only.
 * - --with-db compares it to current MySQL media references.
 * NEVER changes a database row or deletes an asset.
 */
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const withDatabase = process.argv.includes("--with-db");
const uploadsRoot = path.join(process.cwd(), "public", "uploads");
const sources = [
  ["brands", "logo_url"],
  ["categories", "image_url"],
  ["products", "image"],
  ["product_images", "image_url"],
  ["product_variant_images", "image_url"],
  ["sliders", "image_url"],
];

async function listFiles(dir, results = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const filepath = path.join(dir, entry.name);
    if (entry.isDirectory()) await listFiles(filepath, results);
    if (entry.isFile()) {
      const info = await stat(filepath);
      results.push({
        route: "/uploads/" + path.relative(uploadsRoot, filepath).split(path.sep).join("/"),
        bytes: info.size,
      });
    }
  }
  return results;
}

function normalizedLocalRoute(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  let pathname = value.trim().replaceAll("\\", "/");
  try {
    if (/^https?:\/\//i.test(pathname)) {
      const parsed = new URL(pathname);
      const ownHost = process.env.APP_URL ? new URL(process.env.APP_URL).hostname : "";
      // A media URL on a separate CDN is not a file in this repo.
      if (!ownHost || parsed.hostname !== ownHost) return null;
      pathname = parsed.pathname;
    }
    pathname = decodeURIComponent(pathname.split(/[?#]/)[0]);
  } catch {
    return null;
  }
  pathname = pathname.replace(/^\.\/|^public\//, "");
  if (!pathname.startsWith("/")) pathname = "/" + pathname;
  const cleaned = path.posix.normalize(pathname);
  return cleaned.startsWith("/uploads/") ? cleaned : null;
}

const files = await listFiles(uploadsRoot);
const output = {
  mode: withDatabase ? "database-reference-audit" : "static-inventory",
  assetsInPublicUploads: files.length,
  assetBytes: files.reduce((sum, item) => sum + item.bytes, 0),
  rowsChecked: 0,
  databaseSources: [],
  referencedLocalAssets: null,
  missingLocalAssets: [],
  possiblyUnreferencedAssets: [],
  warnings: [],
  safeToDeleteAutomatically: false,
};

if (withDatabase) {
  const vars = ["DB_HOST", "DB_NAME", "DB_USER", "DB_PASSWORD"];
  const missing = vars.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error("Missing database environment configuration: " + missing.join(", "));
  }
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: "utf8mb4",
  });
  const referenced = new Set();
  let successfulSources = 0;
  try {
    for (const [table, field] of sources) {
      try {
        // Source identifiers come from the hard-coded allowlist above, not user input.
        const [rows] = await connection.query("SELECT id, \`" + field + "\` AS media_url FROM \`" + table + "\` WHERE \`" + field + "\` IS NOT NULL");
        successfulSources++;
        output.rowsChecked += rows.length;
        output.databaseSources.push({ table, field, rows: rows.length });
        for (const row of rows) {
          const local = normalizedLocalRoute(row.media_url);
          if (local) referenced.add(local);
        }
      } catch (error) {
        output.warnings.push("Could not audit " + table + "." + field + ": " + String(error?.code || "query_failed"));
      }
    }
  } finally {
    await connection.end();
  }

  const disk = new Set(files.map((item) => item.route));
  output.referencedLocalAssets = [...referenced].filter((url) => disk.has(url)).length;
  output.missingLocalAssets = [...referenced].filter((url) => !disk.has(url)).sort();
  if (successfulSources === sources.length) {
    output.possiblyUnreferencedAssets = files.filter((item) => !referenced.has(item.route)).map((item) => item.route).sort();
    output.warnings.push("Unreferenced is only a candidate classification: URLs in code, retired records or external services may still depend on them.");
  } else {
    output.warnings.push("Database audit incomplete: refusing to classify assets as unreferenced.");
  }
} else {
  output.warnings.push("A disk-only inventory cannot identify which assets are used by live product data. Run with --with-db using a read-only database account.");
}

process.stdout.write(JSON.stringify(output, null, 2) + "\n");
