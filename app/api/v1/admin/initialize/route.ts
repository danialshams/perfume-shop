import { NextRequest, NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getConnection } from "@/lib/db";
import type { RowDataPacket } from "mysql2/promise";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const schema = z.object({
  email: z.email().max(190),
  full_name: z.string().trim().min(2).max(120),
  password: z.string().min(14).max(128),
  setup_code: z.string().min(32).max(256),
}).strict();
function sameCode(candidate: string, expected: string) {
  const a = createHash("sha256").update(candidate).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}
function reply(message: string, status: number) {
  return NextResponse.json({ message, success: status < 400 }, {
    status, headers: { "Cache-Control": "no-store" },
  });
}

/** One-time account creation. Disabled after the first admin exists. */
export async function POST(request: NextRequest) {
  const token = process.env.FERTINI_BOOTSTRAP_TOKEN;
  if (!token || token.length < 32) return reply("راه‌اندازی حساب مدیر در این محیط فعال نیست.", 503);
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return reply("درخواست نامعتبر است.", 403);
  let raw: unknown;
  try { raw = await request.json(); }
  catch { return reply("اطلاعات ورودی نامعتبر است.", 400); }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return reply("نام، ایمیل، رمز یا کد راه‌اندازی معتبر نیست.", 422);
  if (!sameCode(parsed.data.setup_code, token)) return reply("کد راه‌اندازی معتبر نیست.", 403);
  const conn = await getConnection();
  try {
    await conn.beginTransaction();
    // Serialize concurrent first-owner requests, even on separate Vercel instances.
    await conn.execute("SELECT pg_advisory_xact_lock(734290026)");
    const [existing] = await conn.execute<(RowDataPacket & { total: number })[]>(
      "SELECT COUNT(*) AS total FROM users WHERE role='ADMIN' AND deleted_at IS NULL",
    );
    if (Number(existing[0]?.total || 0) > 0) {
      await conn.rollback();
      return reply("حساب مدیر قبلاً ساخته شده است. از صفحه ورود استفاده کنید.", 409);
    }
    const hash = await bcrypt.hash(parsed.data.password, 12);
    await conn.execute(
      "INSERT INTO users (full_name,email,password_hash,role,status,is_active) VALUES (?,? ,?,'ADMIN','ACTIVE',1)",
      [parsed.data.full_name,parsed.data.email.trim().toLowerCase(),hash],
    );
    await conn.commit();
    return reply("حساب مدیر با موفقیت ایجاد شد. اکنون وارد پنل شوید.", 201);
  } catch (error) {
    try { await conn.rollback(); } catch {}
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
    return reply(code === "23505" ? "این ایمیل قبلاً ثبت شده است." : "ساخت حساب مدیر در دیتابیس ناموفق بود.", code === "23505" ? 409 : 503);
  } finally { conn.release(); }
}
