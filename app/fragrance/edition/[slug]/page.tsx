import type {Metadata} from "next";
import Image from "next/image";
import Link from "next/link";
import {notFound} from "next/navigation";
import LuxuryNavbar from "@/components/home-sections/navbar";
import {CinematicFooter} from "@/components/home-sections/CinematicStorefront";
import {
 FERTINI_EDITORIAL_FRAGRANCES,FERTINI_EDITORIAL_FAMILIES,
 editorialFragranceHref,editorialFamilyHref
} from "@/lib/fertini-editorial-collection";

type Props={params:Promise<{slug:string}>};
export const dynamicParams=false;
export function generateStaticParams(){return FERTINI_EDITORIAL_FRAGRANCES.map(x=>({slug:x.slug}));}
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {slug}=await params;
 const product=FERTINI_EDITORIAL_FRAGRANCES.find(x=>x.slug===slug);
 return product
  ?{title:product.name+" | گالری فرتینی",description:product.description,robots:{index:false,follow:false}}
  :{title:"رایحه پیدا نشد",robots:{index:false,follow:false}};
}
export default async function EditorialFragrancePage({params}:Props){
 const {slug}=await params;
 const product=FERTINI_EDITORIAL_FRAGRANCES.find(x=>x.slug===slug);
 if(!product)notFound();
 const family=FERTINI_EDITORIAL_FAMILIES[product.family];
 const relatives=FERTINI_EDITORIAL_FRAGRANCES.filter(x=>x.slug!==slug&&x.family===product.family);
 return <div className="fertini-editorial-page">
  <LuxuryNavbar/>
  <main className="fertini-editorial-page__main" id="main-content" dir="rtl">
   <nav className="fertini-editorial-page__breadcrumb" aria-label="مسیر صفحه">
    <Link href="/">خانه</Link><span>/</span><Link href="/products">عطرها</Link><span>/</span>
    <span>{product.name}</span>
   </nav>
   <div className="fertini-editorial-page__layout">
    <div className="fertini-editorial-page__photo">
     <Image src={product.image} unoptimized fill priority sizes="(min-width:900px) 53vw,100vw" alt={"عطر "+product.name}/>
    </div>
    <div className="fertini-editorial-page__copy">
     <span className="fertini-editorial-page__eyebrow" lang="en" dir="ltr">{product.subtitle}</span>
     <h1>{product.name}</h1>
     <span className="fertini-editorial-page__latin" lang="en">{product.nameEn}</span>
     <p>{product.description}</p>
     <Link className="fertini-editorial-page__family-link" href={editorialFamilyHref(product.family)}>{family.name}</Link>
     <div className="fertini-editorial-page__price">
      <span>قیمت نمونه</span><strong>{product.price.toLocaleString("fa-IR")} تومان</strong>
     </div>
     <p className="fertini-editorial-page__notice">این صفحه معرفی نمایشی است. برای ثبت سفارش واقعی، محصول باید ابتدا توسط مدیر در کاتالوگ فروشگاه ثبت و منتشر شود.</p>
    </div>
   </div>
   <section className="fertini-editorial-page__notes" aria-labelledby="fertini-notes">
    <span lang="en" dir="ltr">THE OLFACTIVE STRUCTURE</span>
    <h2 id="fertini-notes">روایت رایحه</h2>
    <div>{([
      ["01","آغاز",product.notes.top],
      ["02","قلب",product.notes.heart],
      ["03","پایه",product.notes.base],
    ] as const).map(([n,label,notes])=><article key={n}>
      <span lang="en">{n}</span><h3>{label}</h3><p>{notes.join(" · ")}</p>
    </article>)}</div>
   </section>
   {relatives.length>0&&<section className="fertini-editorial-page__related" aria-label="رایحه‌های هم‌خانواده">
    <h2>رایحه‌های هم‌خانواده</h2>
    <div>{relatives.map(item=><Link key={item.slug} href={editorialFragranceHref(item.slug)}>
     <div className="fertini-editorial-page__related-photo"><Image unoptimized src={item.image} fill sizes="(min-width:800px) 24vw,45vw" alt={item.name}/></div>
     <strong>{item.name}</strong><small>{item.price.toLocaleString("fa-IR")} تومان · نمایشی</small>
    </Link>)}</div>
   </section>}
  </main>
  <CinematicFooter/>
 </div>;
}
