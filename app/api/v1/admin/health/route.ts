import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { localMediaReady } from "@/server/storage/local-media";
import { requireAdmin } from "@/server/middlewares/admin";
import type { RowDataPacket } from "mysql2";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type TableRow = RowDataPacket & { table_name: string };
type ColumnRow = RowDataPacket & { table_name: string; column_name: string };
const expected = ["products","product_variants","product_images","categories","scent_families",
 "users","customers","customer_addresses","orders","order_items","payments",
 "admin_notifications","storefront_content"];
export async function GET(request: NextRequest) {
  try { await requireAdmin(request); }
  catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const mediaStorageConfigured = localMediaReady();
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({
      connected: false, configured: false, missingEnv: ["DATABASE_URL"],
      mediaStorageConfigured, message: "آدرس اتصال PostgreSQL تنظیم نشده است.",
    }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  try {
    const [tables] = await db.query<TableRow[]>(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public'"
    );
    const [columns] = await db.query<ColumnRow[]>(
      "SELECT table_name,column_name FROM information_schema.columns WHERE table_schema='public'"
    );
    const names = new Set(tables.map(x => x.table_name));
    const cols = new Set(columns.map(x => x.table_name + "." + x.column_name));
    return NextResponse.json({
      connected: true, configured: true, mediaStorageConfigured,
      provider: "PostgreSQL", tableCount: names.size,
      missingTables: expected.filter(x => !names.has(x)),
      missingCheckoutOrderColumns: ["customer_id","cart_id","shipping_floor"].filter(x => !cols.has("orders."+x)),
      productStatusPresent: cols.has("products.status"),
      stockColumns: ["stock","stock_qty"].filter(x => cols.has("product_variants."+x)),
      legacyTables: [], duplicatedForeignKeys: [],
      message: "PostgreSQL متصل است. سلامت جدول‌ها بدون تغییر داده بررسی شد.",
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
    const reason = code === "28P01" ? "اعتبار اتصال PostgreSQL صحیح نیست." :
      code === "3D000" ? "دیتابیس PostgreSQL وجود ندارد." :
      code === "ECONNREFUSED" ? "سرور PostgreSQL اتصال را رد کرد." :
      "بررسی اتصال PostgreSQL ناموفق بود. تنظیمات شبکه و DATABASE_URL را بررسی کنید.";
    return NextResponse.json({
      connected:false, configured:true, mediaStorageConfigured, message:reason,
    }, { status:503, headers:{ "Cache-Control":"no-store" } });
  }
}
