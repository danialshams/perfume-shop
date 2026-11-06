"use client";
import {type FormEvent,Suspense,useState} from "react";
import {useRouter,useSearchParams} from "next/navigation";
import Link from "next/link";
import {ArrowUpLeft,Eye,EyeOff,LockKeyhole} from "lucide-react";

function LoginContent(){
 const router=useRouter(),params=useSearchParams();
 const proposed=params.get("redirect")||"/admin/dashboard";
 const destination=proposed.startsWith("/admin/")&&!proposed.startsWith("//")?proposed:"/admin/dashboard";
 const [email,setEmail]=useState(""),[password,setPassword]=useState("");
 const [showPassword,setShowPassword]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState("");
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(busy)return;
  setError("");setBusy(true);
  try{
   const response=await fetch("/api/v1/auth/login",{
    method:"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",
    body:JSON.stringify({email:email.trim().toLowerCase(),password}),
   });
   const data=await response.json().catch(()=>({}));
   if(!response.ok)throw Error(data.message||"ایمیل یا رمز عبور معتبر نیست.");
   router.replace(destination);router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"ارتباط با سرور ممکن نیست.")}
  finally{setBusy(false)}
 }
 const field="block h-[48px] w-full rounded-lg border border-[#ded8cf] bg-[#fffefa] px-4 text-[15px] text-[#292621] outline-none transition-colors focus:border-[#98846f] focus:ring-2 focus:ring-[#98846f]/10 placeholder:text-[#b8b0a7]";
 return <main dir="rtl" className="min-h-[100dvh] flex flex-col bg-[#f7f5f1] text-[#292621] font-[Vazirmatn]">
  <header className="flex items-center justify-between gap-3 px-5 md:px-10 h-[76px] border-b border-[#e8e3dc] bg-[#fffefa]">
   <Link href="/" className="font-serif text-[24px] md:text-[28px] tracking-[.20em] leading-none" aria-label="صفحه اصلی FERTINI">FERTINI</Link>
   <Link href="/" className="flex items-center gap-2 text-[12px] text-[#766a5f]">مشاهده فروشگاه <ArrowUpLeft size={16}/></Link>
  </header>
  <div className="flex-1 grid place-items-center px-4 py-10 sm:py-16">
   <section className="w-full max-w-[420px]">
    <div className="mb-8 text-center">
     <span className="text-[10px] font-serif tracking-[.23em] text-[#a1876e]" dir="ltr">THE FRAGRANCE HOUSE</span>
     <div className="mx-auto my-5 w-11 h-11 rounded-lg grid place-items-center border border-[#d9d1c5] bg-[#eeebe5]"><LockKeyhole size={18} strokeWidth={1.4}/></div>
     <h1 className="text-[27px] font-semibold tracking-tight">ورود به استودیوی مدیریت</h1>
     <p className="mt-2 text-[12px] leading-7 text-[#8a8177]">حساب مدیر فروشگاه FERTINI</p>
    </div>
    <form onSubmit={e=>void submit(e)} className="rounded-xl border border-[#e4ded5] bg-[#fffefa] px-5 py-7 sm:p-8 shadow-[0_12px_40px_rgba(47,36,28,.035)] space-y-5">
     <label htmlFor="fertini-admin-email" className="grid gap-[6px] text-[12px] text-[#514940]">ایمیل مدیر
      <input id="fertini-admin-email" name="email" type="email" className={field} dir="ltr" inputMode="email"
       value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@example.com"
       autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={190} required/>
     </label>
     <label htmlFor="fertini-admin-password" className="grid gap-[6px] text-[12px] text-[#514940]">رمز عبور
      <span className="relative block">
       <input id="fertini-admin-password" name="password" type={showPassword?"text":"password"}
        className={field+" !pl-12"} dir="ltr" value={password} onChange={e=>setPassword(e.target.value)}
        autoComplete="current-password" minLength={8} maxLength={100} placeholder="••••••••" required/>
       <button type="button" onClick={()=>setShowPassword(v=>!v)} aria-label={showPassword?"مخفی کردن رمز عبور":"نمایش رمز عبور"}
        className="absolute top-0 left-1 h-[48px] w-11 grid place-items-center text-[#847a70]">
        {showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button>
      </span>
     </label>
     {error?<p role="alert" className="rounded-lg border border-[#edd5cb] bg-[#fff6f3] px-3 py-3 text-[12px] text-[#ad5c4b]">{error}</p>:null}
     <button type="submit" disabled={busy} className="h-[49px] w-full rounded-lg bg-[#302a24] text-[#fffefa] text-[13px] font-medium hover:bg-[#4a4036] transition-colors disabled:opacity-50">
      {busy?"در حال بررسی حساب…":"ورود به پنل"}
     </button>
     <p className="text-center text-[11px] text-[#988e83]">ورود فقط برای حساب‌های دارای دسترسی مدیر مجاز است.</p>
    </form>
    <p className="mt-7 text-center text-[10px] font-serif tracking-[.16em] text-[#ada195]" dir="ltr">FERTINI / STUDIO</p>
   </section>
  </div>
 </main>;
}
export default function AdminLoginPage(){
 return <Suspense fallback={<main className="min-h-screen bg-[#f7f5f1]" role="status"/>}><LoginContent/></Suspense>;
}
