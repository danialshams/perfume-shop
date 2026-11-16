"use client";
import {ArrowUpLeft,LogOut,Menu,ChevronLeft} from "lucide-react";
import {useRouter,usePathname} from "next/navigation";
import {useState} from "react";
import NotificationBell from "@/components/panel-sections/notification-bell";

const names:Record<string,string>={
 dashboard:"نمای کلی",products:"محصولات و موجودی",orders:"سفارش‌ها",
 categories:"دسته‌بندی محصولات","scent-families":"گروه‌های بویایی",
 shipping:"روش‌های ارسال",coupons:"کدهای تخفیف",payments:"تراکنش‌ها",
 content:"مدیریت صفحه اصلی",sliders:"اسلایدهای فروشگاه",
 campaigns:"کمپین‌ها",music:"موسیقی فروشگاه",seo:"مدیریت سئو",
 customers:"باشگاه مشتریان",support:"چت آنلاین",reviews:"دیدگاه‌ها",
 faq:"سؤال‌های متداول",media:"رسانه‌های محصولات"
};
export default function AdminHeader({onMenuClick,previewGuest=false}:{onMenuClick?:()=>void;previewGuest?:boolean}){
 const pathname=usePathname(),router=useRouter(),[busy,setBusy]=useState(false);
 const current=names[pathname.split("/")[2]||"dashboard"]||"مدیریت";
 async function logout(){
  if(busy)return;
  setBusy(true);
  try{await fetch("/api/v1/auth/logout",{method:"POST",credentials:"same-origin"});}
  finally{router.replace("/admin/login");router.refresh();setBusy(false);}
 }
 return <header className="fst-topbar">
  <div className="fst-route">
   <button type="button" className="fst-menu-trigger" aria-label="باز کردن منوی مدیریت" aria-controls="fst-main-sidebar" onClick={onMenuClick}><Menu size={21}/></button>
   <span className="fst-route-parent">FERTINI STUDIO <ChevronLeft size={14}/></span>
   <strong>{current}</strong>
  </div>
  <div className="fst-top-actions">
   <a href="/" target="_blank" rel="noreferrer" className="fst-visit">مشاهده سایت <ArrowUpLeft size={16}/></a>
   <NotificationBell previewGuest={previewGuest}/>
   {previewGuest?<span className="fst-preview-guest" role="status">حالت پیش‌نمایش</span>:
    <button type="button" onClick={()=>void logout()} disabled={busy} className="fst-exit" aria-label="خروج از پنل" title="خروج">
      <LogOut size={18}/><span>خروج</span>
    </button>}
  </div>
 </header>;
}
