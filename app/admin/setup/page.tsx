"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";

export default function SetupAdminPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/v1/admin/initialize", {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName.trim(), email: email.trim().toLowerCase(), password, setup_code: code.trim() }),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) throw Error(json?.message || "ساخت حساب مدیر ناموفق بود.");
      setDone(true);
      setPassword(""); setCode("");
      setMessage(json.message);
    } catch (e) { setMessage(e instanceof Error ? e.message : "خطای ارتباط"); }
    finally { setBusy(false); }
  }
  const field = "w-full rounded-lg border border-[#d9cfc1] bg-white px-4 py-3.5 text-base text-[#302b26] outline-none focus:border-[#ad947a]";
  return <main dir="rtl" className="flex min-h-screen items-center justify-center bg-[#f5f2ed] p-5 text-[#2b2621]">
    <section className="w-full max-w-md rounded-2xl border border-[#e4dcd2] bg-white px-6 py-9 shadow-[0_15px_65px_rgba(54,42,25,.045)] sm:px-9">
      <div className="mb-9 text-center"><small className="tracking-[.25em] text-[#99826c]" dir="ltr">FERTINI ADMINISTRATOR</small>
        <h1 className="mt-4 text-2xl font-semibold">راه‌اندازی پنل مدیریت</h1>
        <p className="mt-3 text-sm leading-7 text-[#81786f]">این فرم فقط برای ساخت اولین مدیر فروشگاه است. بعد از ثبت، راه‌اندازی مجدد غیرفعال می‌شود.</p>
      </div>
      {done ? <div className="space-y-5">
        <p role="status" className="rounded-lg bg-[#edf5ed] p-4 text-sm leading-7 text-[#43624b]">{message}</p>
        <Link href="/admin/login" className="flex items-center justify-center gap-2 rounded-lg bg-[#342f29] px-4 py-3.5 text-sm text-white">ورود به پنل <ArrowLeft size={16}/></Link>
      </div> : <form onSubmit={e => void submit(e)} className="grid gap-5">
        <label className="grid gap-2 text-sm">نام و نام خانوادگی
          <input className={field} autoComplete="name" maxLength={120} minLength={2} required
            value={fullName} onChange={e => setFullName(e.target.value)}/></label>
        <label className="grid gap-2 text-sm">ایمیل مدیر
          <input type="email" dir="ltr" className={field} autoComplete="email" maxLength={190} required
            value={email} onChange={e => setEmail(e.target.value)}/></label>
        <label className="grid gap-2 text-sm">رمز عبور
          <input type="password" dir="ltr" className={field} minLength={14} maxLength={128}
            autoComplete="new-password" required value={password} onChange={e => setPassword(e.target.value)}/>
          <span className="text-xs text-[#93877b]">حداقل ۱۴ کاراکتر؛ فقط خودت به این رمز دسترسی داشته باش.</span></label>
        <label className="grid gap-2 text-sm">کد یک‌بارۀ راه‌اندازی
          <input type="password" dir="ltr" className={field} minLength={32} required
            autoComplete="off" value={code} onChange={e => setCode(e.target.value)}/>
        </label>
        {message && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm leading-7 text-red-700">{message}</p>}
        <button type="submit" disabled={busy} className="flex items-center justify-center gap-2 rounded-lg bg-[#342f29] px-4 py-3.5 text-sm text-white disabled:opacity-50">
          {busy ? "در حال ساخت حساب..." : "ایجاد حساب مدیر"} <LockKeyhole size={17}/>
        </button>
      </form>}
      <div className="mt-8 text-center"><Link href="/admin/login" className="text-sm text-[#817569] underline underline-offset-4">بازگشت به ورود مدیر</Link></div>
    </section>
  </main>;
}
