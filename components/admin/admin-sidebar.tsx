"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {LayoutDashboard,Package,Shapes,ShoppingBag,PanelsTopLeft,Images,
  FileAudio,Database,ChevronLeft,ExternalLink} from "lucide-react";

const groups=[
 {title:"محتوا و ظاهر فروشگاه",links:[
  {href:"/admin/content",title:"صفحه اصلی و محتوا",icon:PanelsTopLeft},
  {href:"/admin/sliders",title:"اسلایدر و کمپین",icon:Images},
  {href:"/admin/media",title:"تصاویر و وویس عطرها",icon:FileAudio}]},
 {title:"مدیریت فروشگاه",links:[
  {href:"/admin/products",title:"محصولات و موجودی",icon:Package},
  {href:"/admin/categories",title:"دسته‌بندی‌ها",icon:Shapes},
  {href:"/admin/orders",title:"سفارش‌ها و پرداخت‌ها",icon:ShoppingBag}]},
 {title:"سیستم",links:[{href:"/admin/database",title:"سلامت اتصال و دیتابیس",icon:Database}]}
];
export const adminSections=groups;
export default function AdminSidebar({onNavigate}:{onNavigate?:()=>void}){
 const pathname=usePathname();
 return <aside className="fst-sidebar-body" aria-label="ناوبری مدیریت">
  <Link href="/admin/dashboard" onClick={onNavigate} className="fst-sidebar-brand">
   <strong>F<span>.</span></strong><span><b>FERTINI STUDIO</b><small>مدیریت خانه عطر</small></span>
  </Link>
  <div className="fst-store-selector"><span className="fst-store-monogram">F</span>
   <span><strong>FERTINI</strong><small>فروشگاه عطر · پنل اصلی</small></span></div>
  <nav className="fst-sidebar-nav" aria-label="بخش‌های پنل">
   <Link onClick={onNavigate} href="/admin/dashboard" aria-current={pathname==="/admin/dashboard"?"page":undefined}
     className={"fst-side-link "+(pathname==="/admin/dashboard"?"active":"")}>
     <LayoutDashboard size={18}/><span>نمای کلی</span></Link>
   {groups.map(g=><section key={g.title} className="fst-sidebar-group">
    <small>{g.title}</small>{g.links.map(x=><Link href={x.href} key={x.href} onClick={onNavigate}
     aria-current={pathname===x.href?"page":undefined}
     className={"fst-side-link "+(pathname===x.href?"active":"")}>
     <x.icon size={18} strokeWidth={1.7}/><span>{x.title}</span>
     <ChevronLeft size={13} className="fst-nav-chevron"/></Link>)}
   </section>)}
  </nav>
  <a className="fst-site-link" href="/" target="_blank" rel="noreferrer">مشاهده فروشگاه <ExternalLink size={15}/></a>
 </aside>;
}
