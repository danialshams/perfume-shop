import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import postgres from "postgres";

const url = process.env.DATABASE_URL || "";
if (!process.env.CI || process.env.FERTINI_PG_TEST !== "isolated-disposable" ||
    !/127\.0\.0\.1:5432\/fertini_ci/.test(url)) {
  console.error("Refusing PostgreSQL integration test outside isolated local CI DB.");
  process.exit(1);
}
const sql = postgres(url, { max: 1, connect_timeout: 10 });
function statements(path) {
  return readFileSync(path,"utf8").split(/;\s*(?:\r?\n|$)/)
    .map(x => x.trim()).filter(Boolean).map(x => x.replace(/^(?:(?:--[^\n]*\n)+\s*)/,"").trim()).filter(Boolean);
}
try {
  const ddl = statements("database/postgres/schema.sql");
  const seed = statements("database/postgres/seed-demo.sql");
  assert.ok(ddl.length >= 40, "Missing full PostgreSQL schema");
  assert.equal(seed.length,78,"Unexpected FERTINI seed structure");
  for (const stmt of ddl) await sql.unsafe(stmt);
  for (const stmt of seed) await sql.unsafe(stmt);
  const [counts] = await sql.unsafe("SELECT (SELECT COUNT(*) FROM products) AS products,(SELECT COUNT(*) FROM product_variants) AS variants,(SELECT COUNT(*) FROM orders) AS orders,(SELECT COUNT(*) FROM customers) AS customers");
  assert.equal(Number(counts.products),12);
  assert.equal(Number(counts.variants),36);
  assert.equal(Number(counts.orders),0);
  assert.equal(Number(counts.customers),0);
  const selected = await sql.unsafe("SELECT p.id, p.name, p.status, pi.image_url FROM products p JOIN product_images pi ON pi.product_id=p.id AND pi.is_main=1 ORDER BY p.id LIMIT 12");
  assert.equal(selected.length,12);
  assert.ok(selected.every(x=>x.status==="ACTIVE"));
  const editorContent=JSON.stringify({heroSlides:[{photo:"/fertini/hero-01.svg",alt:"Demo hero one"},{photo:"/fertini/hero-02.svg",alt:"Demo hero two"}]});
  await sql.unsafe("INSERT INTO storefront_content (id,content_json) VALUES (1,$1) ON CONFLICT (id) DO UPDATE SET content_json=EXCLUDED.content_json", [editorContent]);
  const [readBack]=await sql.unsafe("SELECT content_json FROM storefront_content WHERE id=1");
  assert.deepEqual(JSON.parse(readBack.content_json),JSON.parse(editorContent));
  // Sale notifications remain empty until verified payment is processed by the gateway.
  const [notice]=await sql.unsafe("SELECT COUNT(*) AS total FROM admin_notifications WHERE type='payment_success'");
  assert.equal(Number(notice.total),0);
  console.log("PostgreSQL schema, 12 demo products, 36 variants and homepage read/write passed.");
}finally {await sql.end();}
