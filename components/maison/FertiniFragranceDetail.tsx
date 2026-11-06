"use client";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import LuxuryNavbar from "@/components/home-sections/navbar";
import { CinematicFooter } from "@/components/home-sections/CinematicStorefront";
import { FERTINI_DEMOS } from "@/lib/fertini-demo";
import { addGuestCartProduct } from "@/lib/fertini-guest-cart";
import { lockDocumentScroll } from "@/lib/document-scroll-lock";
import FertiniVoicePlayer from "@/components/maison/FertiniVoicePlayer";

export default function FertiniFragranceDetail({productId}:{productId:string}){
 const product=FERTINI_DEMOS.find(item=>item.id===productId)||FERTINI_DEMOS[0];
 const [variantIndex,setVariantIndex]=useState(1);
 const [photoIndex,setPhotoIndex]=useState(0);
 const [lightbox,setLightbox]=useState(false);
 const [notice,setNotice]=useState("");
 const variant=product.variants[variantIndex]||product.variants[0];
 const nextPhoto=useCallback((delta:number)=>setPhotoIndex(i=>(i+delta+product.photos.length)%product.photos.length),[product.photos.length]);
 useEffect(()=>{
   if(!lightbox)return;
   const unlock=lockDocumentScroll();
   const key=(event:KeyboardEvent)=>{
     if(event.key==="Escape")setLightbox(false);
     if(event.key==="ArrowRight")nextPhoto(-1);
     if(event.key==="ArrowLeft")nextPhoto(1);
   };
   window.addEventListener("keydown",key);
   return()=>{unlock();window.removeEventListener("keydown",key);};
 },[lightbox,nextPhoto]);
 function addToCart(){
   const result=addGuestCartProduct(product.id,variant.volume,1);
   setNotice(result?"عطر به سبد خرید اضافه شد.":"افزودن محصول ممکن نشد.");
 }
 const speech="معرفی رایحه "+product.name+". "+product.description+" نت‌های اولیه: "+product.notes.top.join(" و ")+". نت‌های میانی: "+product.notes.heart.join(" و ")+". نت‌های پایه: "+product.notes.base.join(" و ")+".";
 const others=FERTINI_DEMOS.filter(item=>item.id!==product.id && item.family===product.family).slice(0,3);
 return <div className="fertini-fragrance">
   <LuxuryNavbar/>
   <main className="maison-wide fertini-fragrance__main" id="main-content" dir="rtl">
     <nav className="fertini-fragrance__breadcrumb" aria-label="مسیر صفحه">
       <Link href="/">خانه</Link><span>/</span><Link href="/products">عطرها</Link><span>/</span><span>{product.name}</span>
     </nav>
     <div className="fertini-fragrance__layout">
       <div className="fertini-fragrance__gallery">
         <button type="button" className="fertini-fragrance__large" onClick={()=>setLightbox(true)} aria-label="بزرگ‌نمایی تصویر عطر">
           <Image src={product.photos[photoIndex]} fill priority sizes="(min-width:900px) 53vw,100vw" alt={product.name}/>
         </button>
         <div className="fertini-fragrance__thumbs">
           {product.photos.map((src,index)=><button type="button" key={index} className={photoIndex===index?"is-active":""}
             aria-pressed={photoIndex===index} aria-label={"نمای "+(index+1)}
             onClick={()=>setPhotoIndex(index)}>
             <Image src={src} fill sizes="110px" alt={product.name+" تصویر "+(index+1)}/>
           </button>)}
         </div>
       </div>
       <div className="fertini-fragrance__details">
         <span className="maison-kicker" lang="en" dir="ltr">{product.subtitle}</span>
         <h1>{product.name}</h1>
         <p className="fertini-fragrance__description">{product.description}</p>
         <div className="fertini-fragrance__accords">{product.accords.map(x=><span key={x}>{x}</span>)}</div>
         <div className="fertini-fragrance__variants" role="group" aria-label="انتخاب حجم عطر">
           <h2>حجم عطر</h2>
           <div>{product.variants.map((v,index)=><button type="button" key={v.volume} className={variantIndex===index?"is-active":""}
             onClick={()=>{setVariantIndex(index);setNotice("");}} aria-pressed={variantIndex===index}>{v.volume.toLocaleString("fa-IR")} میل</button>)}</div>
         </div>
         <div className="fertini-fragrance__price"><strong>{variant.price.toLocaleString("fa-IR")} تومان</strong><span>موجودی: {variant.stock.toLocaleString("fa-IR")} عدد</span></div>
         <button type="button" className="fertini-fragrance__buy" onClick={addToCart} disabled={variant.stock<1}>افزودن به سبد خرید</button>
         {notice&&<div className="fertini-fragrance__notice" role="status">
           <span>{notice}</span>{notice.includes("اضافه")&&<Link href="/cart">مشاهدهٔ سبد خرید</Link>}
         </div>}
         <FertiniVoicePlayer productName={product.name} script={speech}/>
       </div>
     </div>
     <section className="fertini-fragrance__pyramid" aria-label="نت‌های عطر">
       <span className="maison-kicker" lang="en" dir="ltr">THE OLFACTIVE PYRAMID</span>
       <h2>از آغاز تا ماندگاری</h2>
       <div>{([["01","نت‌های اولیه",product.notes.top],["02","نت‌های میانی",product.notes.heart],["03","نت‌های پایه",product.notes.base]] as const).map(([number,name,notes])=>
        <article key={number}><span lang="en">{number}</span><h3>{name}</h3><p>{notes.join(" · ")}</p></article>)}</div>
     </section>
     <section className="fertini-fragrance__related" aria-labelledby="fertini-related-title">
       <h2 id="fertini-related-title">رایحه‌های نزدیک</h2>
       <div>{others.map(other=><Link href={"/fragrance/"+other.id} key={other.id}>
          <div><Image src={other.image} fill sizes="(min-width:950px) 25vw,75vw" alt={other.name}/></div>
          <span>{other.name}</span></Link>)}</div>
     </section>
   </main>
   <CinematicFooter/>
   {lightbox&&<div role="dialog" aria-modal="true" aria-label="گالری تصویر عطر" className="fertini-fragrance__lightbox">
     <button className="fertini-fragrance__lb-close" onClick={()=>setLightbox(false)} aria-label="بستن" type="button"><X size={23}/></button>
     <button className="fertini-fragrance__lb-prev" onClick={()=>nextPhoto(-1)} aria-label="عکس قبلی" type="button"><ChevronRight size={25}/></button>
     <div className="fertini-fragrance__lb-image"><Image src={product.photos[photoIndex]} fill sizes="100vw" alt={product.name}/></div>
     <button className="fertini-fragrance__lb-next" onClick={()=>nextPhoto(1)} aria-label="عکس بعدی" type="button"><ChevronLeft size={25}/></button>
   </div>}
 </div>;
}
