"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {useEffect,useState,type ReactNode} from "react";
import {Home,Search,Package,ShoppingBag,Menu,X} from "lucide-react";
import AdminSidebar from "./admin-sidebar";
import AdminHeader from "./admin-header";

const shortcuts=[
 {href:"/admin/dashboard",title:"خانه",icon:Home},
 {href:"/admin/seo",title:"سئو",icon:Search},
 {href:"/admin/products",title:"محصولات",icon:Package},
 {href:"/admin/orders",title:"سفارش‌ها",icon:ShoppingBag},
] as const;
export default function AdminShell({children,previewGuest=false}:{children:ReactNode;previewGuest?:boolean}){
 const [open,setOpen]=useState(false);
 const pathname=usePathname();
 useEffect(()=>setOpen(false),[pathname]);
 useEffect(()=>{
  if(!open)return;
  const old=document.body.style.overflow;
  document.body.style.overflow="hidden";
  const escape=(e:KeyboardEvent)=>{if(e.key==="Escape")setOpen(false)};
  window.addEventListener("keydown",escape);
  return()=>{document.body.style.overflow=old;window.removeEventListener("keydown",escape)};
 },[open]);
 return <div className="fertini-studio" dir="rtl">
  <aside className={"fst-sidebar "+(open?"is-open":"")}>
   <button type="button" aria-label="بستن منو" className="fst-sidebar-close" onClick={()=>setOpen(false)}><X size={20}/></button>
   <AdminSidebar onNavigate={()=>setOpen(false)}/>
  </aside>
  {open&&<button type="button" className="fst-overlay" aria-label="بستن منوی مدیریت" onClick={()=>setOpen(false)}/>}
  <div className="fst-workspace">
   <AdminHeader onMenuClick={()=>setOpen(true)} previewGuest={previewGuest}/>
   <main id="admin-main" className="fst-main">{children}</main>
  </div>
  <nav className="fst-mobile-bottom" aria-label="دسترسی سریع مدیریت">
   {shortcuts.map(s=><Link href={s.href} key={s.href} className={pathname===s.href?"active":""} aria-current={pathname===s.href?"page":undefined}>
    <s.icon size={20} strokeWidth={1.65}/><span>{s.title}</span></Link>)}
   <button type="button" onClick={()=>setOpen(true)} aria-label="سایر بخش‌های مدیریت"><Menu size={20}/><span>بیشتر</span></button>
  </nav>
 </div>;
}
