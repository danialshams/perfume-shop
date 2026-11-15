import type {Metadata} from "next";
import Image from "next/image";
import Link from "next/link";
import {notFound} from "next/navigation";
import LuxuryNavbar from "@/components/home-sections/navbar";
import {CinematicFooter} from "@/components/home-sections/CinematicStorefront";
import {
 FERTINI_EDITORIAL_FAMILIES,FERTINI_EDITORIAL_FRAGRANCES,
 editorialFragranceHref,type EditorialFamily
} from "@/lib/fertini-editorial-collection";

type Props={params:Promise<{family:string}>};
const families=Object.keys(FERTINI_EDITORIAL_FAMILIES) as EditorialFamily[];
export const dynamicParams=false;
export function generateStaticParams(){return families.map(family=>({family}));}
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {family}=await params;
 if(!families.includes(family as EditorialFamily))return{robots:{index:false,follow:false}};
 return{title:FERTINI_EDITORIAL_FAMILIES[family as EditorialFamily].name+" | فرتینی",
  robots:{index:false,follow:false}};
}
export default async function EditorialFamilyPage({params}:Props){
 const {family}=await params;
 if(!families.includes(family as EditorialFamily))notFound();
 const group=FERTINI_EDITORIAL_FAMILIES[family as EditorialFamily];
 const products=FERTINI_EDITORIAL_FRAGRANCES.filter(x=>x.family===family);
 return <div className="fertini-editorial-page">
  <LuxuryNavbar/>
  <main className="fertini-editorial-page__main" id="main-content" dir="rtl">
   <nav className="fertini-editorial-page__breadcrumb" aria-label="مسیر صفحه">
    <Link href="/">خانه</Link><span>/</span><span>گروه‌های بویایی</span><span>/</span><span>{group.name}</span>
   </nav>
   <header className="fertini-editorial-collection__head">
    <div>
     <span className="fertini-editorial-page__eyebrow" lang="en" dir="ltr">{group.subtitle}</span>
     <h1>{group.name}</h1>
     <p>{group.description}</p>
    </div>
    <div className="fertini-editorial-collection__photo">
      <Image src={group.photo} fill unoptimized priority sizes="(min-width:900px) 40vw,100vw" alt={"مواد اولیه گروه بویایی "+group.name}/>
    </div>
   </header>
   <section className="fertini-editorial-collection__products" aria-label="عطرهای این گروه">
    <span className="fertini-editorial-page__eyebrow" lang="en" dir="ltr">THE SCENT SELECTION</span>
    <h2>عطرهای این خانواده</h2>
    <div className="fertini-editorial-collection__grid">
     {products.map(item=><Link key={item.slug} href={editorialFragranceHref(item.slug)} className="fertini-editorial-collection__card">
      <div className="fertini-editorial-collection__card-photo"><Image unoptimized fill src={item.image} sizes="(min-width:900px) 30vw,45vw" alt={"عطر "+item.name}/></div>
      <div className="fertini-editorial-collection__card-info">
       <span>{item.name}</span><small>{item.price.toLocaleString("fa-IR")} تومان · نمایشی</small>
      </div>
     </Link>)}
    </div>
    <p className="fertini-editorial-page__notice">این رایحه‌ها نمونه‌های معرفی مجموعه‌اند؛ ثبت سفارش واقعی پس از انتشار محصولات در پنل فروشگاه امکان‌پذیر است.</p>
   </section>
  </main>
  <CinematicFooter/>
 </div>;
}
