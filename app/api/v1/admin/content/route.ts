import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/middlewares/admin";
import { contentSchema, resolveDatabaseSelections } from "@/lib/fertini-site-content";
import { readSiteContent, writeSiteContent } from "@/server/site-content";
import { listHomeProducts, listHomeScentFamilies, listHomeCategories } from "@/server/home-catalog";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store" };
async function authorized(request: NextRequest) {
  try { await requireAdmin(request); return true; } catch { return false; }
}
export async function GET(request: NextRequest) {
  if (!await authorized(request)) return NextResponse.json({ error: "دسترسی مدیر لازم است" }, { status: 403 });
  try {
    const [saved, catalog, categories, families] = await Promise.all([
      readSiteContent(), listHomeProducts(), listHomeCategories(), listHomeScentFamilies().catch(() => []),
    ]);
    return NextResponse.json({
      content: resolveDatabaseSelections(saved, catalog),
      products: catalog, categories, scentFamilies: families, source: "database",
    }, { headers });
  } catch {
    return NextResponse.json({ error: "اتصال PostgreSQL یا جدول‌های صفحه اصلی آماده نیست. ذخیره غیرفعال است." }, { status: 503, headers });
  }
}
export async function PUT(request: NextRequest) {
  if (!await authorized(request)) return NextResponse.json({ error: "دسترسی مدیر لازم است" }, { status: 403 });
  let data: unknown;
  try { data = await request.json(); } catch { return NextResponse.json({ error: "فرمت داده معتبر نیست" }, { status: 400 }); }
  const parsed = contentSchema.safeParse(data);
  if (!parsed.success) return NextResponse.json({
    error: "اطلاعات صفحه اصلی نامعتبر است.", details: parsed.error.flatten(),
  }, { status: 422 });
  try {
    const [catalog, categories, families] = await Promise.all([
      listHomeProducts(), listHomeCategories(), listHomeScentFamilies().catch(() => []),
    ]);
    const allowed = new Set(catalog.map(x => x.id));
    if (![...parsed.data.bestsellerIds, ...parsed.data.latestIds].every(x => allowed.has(x))) {
      return NextResponse.json({ error: "تنها محصولات منتشرشده همان دیتابیس قابل انتخاب هستند." }, { status: 422 });
    }
    const familiesAllowed = new Set(families.map(x => x.id));
    if (parsed.data.families.some(x => x.scentFamilyId !== null && !familiesAllowed.has(x.scentFamilyId))) {
      return NextResponse.json({ error: "خانواده رایحه انتخاب‌شده در دیتابیس وجود ندارد." }, { status: 422 });
    }
    const categoryIds = new Set(categories.map(x => x.id));
    if (parsed.data.families.some(x => x.categoryId !== null && !categoryIds.has(x.categoryId))) {
      return NextResponse.json({ error: "دسته‌بندی انتخاب‌شده در دیتابیس وجود ندارد." }, { status: 422 });
    }
    await writeSiteContent(parsed.data);
    return NextResponse.json({ content: parsed.data, saved: true }, { headers });
  } catch {
    return NextResponse.json({ error: "ذخیره به دیتابیس انجام نشد؛ هیچ تغییری در سایت ثبت نشده است." }, { status: 503, headers });
  }
}
