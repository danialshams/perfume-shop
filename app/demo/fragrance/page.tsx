"use client";
import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Pause, Play, Volume2, X } from "lucide-react";
import LuxuryNavbar from "@/components/home-sections/navbar";
import { CinematicFooter } from "@/components/home-sections/CinematicStorefront";
import { FERTINI_DEMOS } from "@/lib/fertini-demo";

function DemoContent(){
  const query=useSearchParams();
  const product=FERTINI_DEMOS.find(item=>item.id===query.get("item"))||FERTINI_DEMOS[0];
  const [variantIndex,setVariantIndex]=useState(0);
  const [photoIndex,setPhotoIndex]=useState(0);
  const [open,setOpen]=useState(false);
  const [speaking,setSpeaking]=useState(false);
  const [voiceError,setVoiceError]=useState("");
  const utteranceRef=useRef<SpeechSynthesisUtterance|null>(null);
  const variant=product.variants[variantIndex]||product.variants[0];
  useEffect(()=>{setVariantIndex(0);setPhotoIndex(0);setOpen(false);},[product.id]);
  useEffect(()=>{
    const handler=(event:KeyboardEvent)=>{if(event.key==="Escape")setOpen(false);};
    window.addEventListener("keydown",handler);
    return()=>window.removeEventListener("keydown",handler);
  },[]);
  useEffect(()=>{if(!open)return;const before=document.body.style.overflow;document.body.style.overflow="hidden";return()=>{document.body.style.overflow=before;};},[open]);
  useEffect(()=>()=>{
    if(typeof window!=="undefined"&&"speechSynthesis" in window)window.speechSynthesis.cancel();
    window.dispatchEvent(new Event("background-music:resume-after-voice"));
  },[]);
  function toggleSpeech(){
    if(speaking){window.speechSynthesis.cancel();setSpeaking(false);window.dispatchEvent(new Event("background-music:resume-after-voice"));return;}
    if(!("speechSynthesis" in window)){setVoiceError("مرورگر شما پخش گفتار آزمایشی را پشتیبانی نمی‌کند.");return;}
    window.speechSynthesis.cancel();
    setVoiceError("");
    const utterance=new SpeechSynthesisUtterance("معرفی عطر " +product.name+". "+product.description+" نت‌های اولیه: "+product.notes.top.join(" و ")+". نت‌های میانی: "+product.notes.heart.join(" و ")+". نت‌های پایانی: "+product.notes.base.join(" و ")+".");
    utterance.lang="fa-IR";utterance.rate=.9;utterance.pitch=.93;utterance.volume=.85;
    const faVoice=window.speechSynthesis.getVoices().find(voice=>voice.lang.toLowerCase().startsWith("fa"));
    if(faVoice) utterance.voice=faVoice;
    utterance.onend=()=>{setSpeaking(false);window.dispatchEvent(new Event("background-music:resume-after-voice"));};
    utterance.onerror=()=>{setSpeaking(false);setVoiceError("پخش گفتار در این مرورگر ممکن نشد.");window.dispatchEvent(new Event("background-music:resume-after-voice"));};
    utteranceRef.current=utterance;
    setSpeaking(true);
    window.dispatchEvent(new Event("background-music:pause-for-voice"));
    window.speechSynthesis.speak(utterance);
  }
  const shiftPhoto=(delta:number)=>setPhotoIndex(current=>(current+delta+product.photos.length)%product.photos.length);
  return <div className="fertini-demo">
    <LuxuryNavbar/>
    <main id="main-content" className="fertini-demo__main" dir="rtl">
      <div className="fertini-demo__breadcrumb"><Link href="/">خانه</Link><span> / </span><Link href="/products">کالکشن</Link><span> / محصول آزمایشی</span></div>
      <div className="fertini-demo__grid">
        <div className="fertini-demo__gallery">
          <button type="button" className="fertini-demo__main-image" onClick={()=>setOpen(true)} aria-label="بزرگنمایی تصویر محصول">
            <Image src={product.photos[photoIndex]} fill priority sizes="(min-width:900px) 54vw, 100vw" alt={product.name}/>
            <span className="fertini-demo__image-caption" dir="ltr">FERTINI / STUDY {String(photoIndex+1).padStart(2,"0")}</span>
          </button>
          <div className="fertini-demo__thumbs" aria-label="گالری تصاویر">
            {product.photos.map((src,index)=><button key={src} type="button" className={index===photoIndex?"is-active":""}
              onClick={()=>setPhotoIndex(index)} aria-label={"تصویر "+(index+1)} aria-pressed={index===photoIndex}>
              <Image src={src} fill sizes="100px" alt={product.name+" نمای "+(index+1)}/>
            </button>)}
          </div>
        </div>
        <div className="fertini-demo__details">
          <span className="maison-kicker" lang="en" dir="ltr">{product.subtitle}</span>
          <h1>{product.name}</h1>
          <span className="fertini-demo__demo-badge">نمونهٔ نمایشی برای بررسی رابط کاربری</span>
          <p className="fertini-demo__description">{product.description}</p>
          <div className="fertini-demo__accords">{product.accords.map(accord=><span key={accord}>{accord}</span>)}</div>
          <div className="fertini-demo__variant">
            <label>حجم انتخابی</label>
            <div>{product.variants.map((item,index)=><button key={item.volume} type="button" onClick={()=>setVariantIndex(index)}
              className={index===variantIndex?"is-active":""} aria-pressed={index===variantIndex}>{item.volume.toLocaleString("fa-IR")} میل</button>)}</div>
          </div>
          <div className="fertini-demo__price"><strong>{variant.price.toLocaleString("fa-IR")} تومان</strong><span>موجودی نمونه: {variant.stock.toLocaleString("fa-IR")} عدد</span></div>
          <div className="fertini-demo__cta">
            <button type="button" disabled title="نمونهٔ نمایشی به سفارش واقعی متصل نیست">افزودن به سبد خرید — فقط پیش‌نمایش</button>
            <p>این محصول در پایگاه دادهٔ فروشگاه ثبت نشده و پرداخت یا سفارش واقعی ندارد.</p>
          </div>
          <section className="fertini-demo__audio" aria-label="معرفی صوتی نمونه">
            <div><span className="maison-kicker" dir="ltr" lang="en">AUDIO GUIDE / TEST</span><h2>معرفی صوتی رایحه</h2></div>
            <button type="button" onClick={toggleSpeech} aria-pressed={speaking}>
              {speaking?<Pause size={20} strokeWidth={1.2}/>:<Play size={20} strokeWidth={1.2}/>}
              {speaking?"توقف پخش":"پخش نمونهٔ صوتی"}
              <Volume2 size={17} strokeWidth={1.2} aria-hidden="true"/>
            </button>
            <p>این نمونه با موتور گفتار مرورگر تولید می‌شود؛ کیفیت و صدای فارسی به مرورگر بستگی دارد.</p>
            {voiceError&&<p role="alert">{voiceError}</p>}
          </section>
        </div>
      </div>
      <section className="fertini-demo__notes" aria-label="نت‌های عطر">
        <span className="maison-kicker" dir="ltr" lang="en">THE OLFACTIVE PYRAMID</span>
        <h2>از آغاز تا ماندگاری</h2>
        <div>{([["01","نت‌های اولیه",product.notes.top],["02","نت‌های میانی",product.notes.heart],["03","نت‌های پایه",product.notes.base]] as const).map(([id,title,items])=>
          <article key={id}><small lang="en">{id}</small><h3>{title}</h3><p>{items.join(" · ")}</p></article>)}</div>
      </section>
      <div className="fertini-demo__back"><Link href="/products">بازگشت به مجموعه ←</Link><Link href="/">بازگشت به صفحه اصلی ←</Link></div>
    </main>
    <CinematicFooter/>
    {open&&<div className="fertini-demo__lightbox" role="dialog" aria-modal="true" aria-label="نمایش بزرگ تصویر">
      <button type="button" className="fertini-demo__lightbox-close" onClick={()=>setOpen(false)} aria-label="بستن گالری"><X size={23}/></button>
      <button type="button" className="fertini-demo__lightbox-prev" onClick={()=>shiftPhoto(-1)} aria-label="تصویر قبلی"><ChevronRight size={24}/></button>
      <div className="fertini-demo__lightbox-image"><Image src={product.photos[photoIndex]} fill sizes="100vw" alt={product.name}/></div>
      <button type="button" className="fertini-demo__lightbox-next" onClick={()=>shiftPhoto(1)} aria-label="تصویر بعدی"><ChevronLeft size={24}/></button>
      <span dir="ltr">{photoIndex+1} / {product.photos.length}</span>
    </div>}
  </div>;
}
export default function DemoFragrancePage(){
  return <Suspense fallback={<div className="fertini-demo__pending" role="status">در حال آماده‌سازی نمونهٔ محصول…</div>}><DemoContent/></Suspense>;
}
