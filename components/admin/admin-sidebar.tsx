"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {LayoutDashboard,Package,Shapes,ShoppingBag,PanelsTopLeft,
  ChevronLeft,ExternalLink,Users,TicketPercent,MessageSquare,MessageCircle,HelpCircle,
  Search,Flower2,Music2,Truck,CalendarRange,Wallet} from "lucide-react";

const groups=[
 {title:"فروش و کالا",links:[
  {href:"/admin/orders",title:"سفارش‌ها",icon:ShoppingBag},
  {href:"/admin/products",title:"محصولات و موجودی",icon:Package},
  {href:"/admin/categories",title:"دسته‌بندی محصولات",icon:Shapes},
  {href:"/admin/scent-families",title:"گروه‌های بویایی",icon:Flower2},
  {href:"/admin/shipping",title:"روش‌های ارسال",icon:Truck},
  {href:"/admin/coupons",title:"کدهای تخفیف",icon:TicketPercent},
  {href:"/admin/payments",title:"تراکنش‌ها",icon:Wallet}]},
 {title:"محتوا و ظاهر فروشگاه",links:[
  {href:"/admin/content",title:"صفحه اصلی و اسلایدها",icon:PanelsTopLeft},
  {href:"/admin/campaigns",title:"کمپین‌ها",icon:CalendarRange},
  {href:"/admin/music",title:"موسیقی فروشگاه",icon:Music2},
  {href:"/admin/seo",title:"تنظیمات سئو",icon:Search}]},
 {title:"مشتریان و ارتباطات",links:[
  {href:"/admin/customers",title:"باشگاه مشتریان",icon:Users},
  {href:"/admin/support",title:"چت آنلاین",icon:MessageCircle},
  {href:"/admin/reviews",title:"دیدگاه‌ها",icon:MessageSquare},
  {href:"/admin/faq",title:"سؤال‌های متداول",icon:HelpCircle}]}
] as const;
export const adminSections=groups;

export default function AdminSidebar({onNavigate}:{onNavigate?:()=>void}){
 const pathname=usePathname();
 const selected=(href:string)=>pathname===href||pathname.startsWith(href+"/");
 return <aside className="fst-sidebar-body" aria-label="ناوبری مدیریت">
  <Link href="/admin/dashboard" onClick={onNavigate} className="fst-sidebar-brand" aria-label="داشبورد فرتینی">
   <span className="fst-brand-text"><strong>FERTINI</strong><small>MANAGEMENT STUDIO</small></span>
   <span className="fst-brand-mark" aria-hidden="true">F.</span>
  </Link>
  <nav className="fst-sidebar-nav" aria-label="بخش‌های پنل">
   <Link onClick={onNavigate} href="/admin/dashboard" aria-current={selected("/admin/dashboard")?"page":undefined}
    className={"fst-side-link fst-side-dashboard "+(selected("/admin/dashboard")?"active":"")}>
    <LayoutDashboard size={18} strokeWidth={1.6}/><span>نمای کلی</span>
   </Link>
   {groups.map(group=><section key={group.title} className="fst-sidebar-group" aria-label={group.title}>
    <small>{group.title}</small>
    {group.links.map(link=><Link href={link.href} key={link.href} onClick={onNavigate}
      aria-current={selected(link.href)?"page":undefined}
      className={"fst-side-link "+(selected(link.href)?"active":"")}>
      <link.icon size={18} strokeWidth={1.6}/><span>{link.title}</span>
      <ChevronLeft size={13} className="fst-nav-chevron" aria-hidden="true"/>
    </Link>)}
   </section>)}
  </nav>
  <a className="fst-site-link" href="/" target="_blank" rel="noreferrer">
   <span>بازگشت به فروشگاه</span><ExternalLink size={15}/>
  </a>
 </aside>;
}
