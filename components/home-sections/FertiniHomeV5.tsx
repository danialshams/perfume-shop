"use client";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Fragment, useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { DEMO_HOME_PRODUCTS, type HomeProduct } from "@/lib/fertini-home-products";
import {DEFAULT_SITE_CONTENT,type FertiniSiteContent,getActiveCampaigns,campaignDiscountPercent} from "@/lib/fertini-site-content";
import {FERTINI_HERO_IMAGES,FERTINI_PRODUCT_IMAGES,FERTINI_FAMILY_IMAGES} from "@/lib/fertini-editorial";
import {FERTINI_EDITORIAL_FRAGRANCES,editorialFragranceHref,editorialFamilyHref,type EditorialFamily} from "@/lib/fertini-editorial-collection";


// Five different product photos are split between the two galleries.
// Remaining published products keep their own real photos: never repeat the
// same staged bottle merely to fill twelve separate card slots.
const editorialBestsellers = FERTINI_PRODUCT_IMAGES.slice(0,3);
const editorialNewest = FERTINI_PRODUCT_IMAGES.slice(3,6);

// Clearly marked showroom editions; they are NOT database inventory.
const bestEditorialPreviews=FERTINI_EDITORIAL_FRAGRANCES.slice(0,3);
const newestEditorialPreviews=FERTINI_EDITORIAL_FRAGRANCES.slice(3,6);

// Serve home images directly from the host rather than depending on its
// Next.js /_next/image transcoding service. A failed photo has a local backup.
function ResilientPhoto({src,fallback,alt,sizes,priority=false,loading}:{
  src:string;fallback:string;alt:string;sizes:string;priority?:boolean;loading?:"eager"|"lazy";
}){
  const [failedSrc,setFailedSrc]=useState<string|null>(null);
  const [failedBackup,setFailedBackup]=useState<string|null>(null);
  const sourceFailed=failedSrc===src;
  const actual=sourceFailed?fallback:src;
  // Do not quietly replace failed real photographs with low-resolution demo
  // bottles, or make all three scent families display the same woody picture.
  if(!actual || (sourceFailed && failedBackup===fallback)){
    return <div className="fertini-v5-photo-unavailable" role="img" aria-label={alt}>
      <span>تصویر در دسترس نیست</span>
    </div>;
  }
  return <Image src={actual} alt={alt} fill unoptimized priority={priority}
    loading={priority?undefined:loading} sizes={sizes}
    onError={()=>{
      if(!sourceFailed)setFailedSrc(src);
      else setFailedBackup(fallback);
    }}/>;
}
function FragranceCardInfo({name,subtitle,price,discountPercent=0,preview=false}:{
  name:string;subtitle:string;price:number|null;discountPercent?:number;preview?:boolean;
}){
  return <div className="fertini-v5-card__info" data-fertini-caption>
    <div className="fertini-v5-card__details">
      <div className="fertini-v5-card__identity" dir="rtl">
        <div className="fertini-v5-card__text-mask">
          <h3 data-fertini-caption-line>{name}</h3>
        </div>
        <div className="fertini-v5-card__text-mask">
          <span className="fertini-v5-card__subtitle" data-fertini-caption-line lang="en" dir="ltr">{subtitle}</span>
        </div>
      </div>
      <div className="fertini-v5-card__price-column" dir="rtl">
        <div className="fertini-v5-card__text-mask">
          <p className="fertini-v5-card__price" data-fertini-caption-line>
            {price===null?"قیمت پس از انتخاب":price.toLocaleString("fa-IR")+" تومان"}
          </p>
        </div>
        {(preview||discountPercent>0)&&<div className="fertini-v5-card__text-mask">
          <span className="fertini-v5-card__price-note" data-fertini-caption-line>
            {preview?"قیمت نمایشی":discountPercent+"٪ تخفیف کمپین"}
          </span>
        </div>}
      </div>
    </div>
  </div>;
}
function ProductCard({product,large=false,mode="up",discountPercent=0,editorialImage}:{
  product:HomeProduct;large?:boolean;mode?:"up"|"fade"|"right"|"left"|"stretch";discountPercent?:number;editorialImage?:string
}){
  const displayPrice=product.price===null?null:Math.round(product.price*(100-discountPercent)/100);
  return <Link href={product.href} className={"fertini-v5-card"+(large?" fertini-v5-card--large":"")} data-fertini-card>
    <div className="fertini-v5-card__media" data-fertini-photo data-photo-entrance={mode}>
      <ResilientPhoto src={product.isDemo?(editorialImage||product.image):product.image}
        fallback={product.image||"/fertini/nocturne-front.svg"}
        alt={product.name} loading="lazy"
        sizes={large?"(min-width:960px) 32vw, 68vw":"(min-width:960px) 27vw, (min-width:600px) 46vw, 45vw"}/>
    </div>
    <FragranceCardInfo name={product.name} subtitle={product.subtitle}
      price={displayPrice} discountPercent={discountPercent}/>
  </Link>;
}
function EditorialPreviewCard({slug,image,name,subtitle,price,mode="up",large=false}:{
  slug:string;image:string;name:string;subtitle:string;price:number;
  mode?:"up"|"fade"|"right"|"left"|"stretch";large?:boolean;
}){
  return <Link href={editorialFragranceHref(slug)}
    className={"fertini-v5-card fertini-v5-editorial"+(large?" fertini-v5-card--large":"")} data-fertini-card>
    <div className="fertini-v5-card__media" data-fertini-photo data-photo-entrance={mode}>
      <ResilientPhoto src={image} fallback="" alt={name}
        loading="lazy" sizes={large?"(min-width:960px) 32vw,68vw":"(min-width:960px) 27vw,45vw"}/>
    </div>
    <FragranceCardInfo name={name} subtitle={subtitle} price={price} preview/>
  </Link>;
}
export default function FertiniHomeV5({content=DEFAULT_SITE_CONTENT,products=DEMO_HOME_PRODUCTS,catalogState="demo",scentFamilies=[]}:{
  content?:FertiniSiteContent;products?:HomeProduct[];catalogState?:"demo"|"database"|"unavailable";scentFamilies?:Array<{id:number;name:string;image_url:string|null}>
}){
  // Replace only the built-in, low-quality placeholder slides.
  // Saved photographs chosen in the admin panel are left untouched.
  const slides=content.heroSlides.map((slide,index)=>{
    const builtin=/^\/fertini\/hero-0[12]\.svg$/.test(slide.photo) ||
      /^\/fertini\/editorial\/hero-(amber|bronze)\.avif$/.test(slide.photo);
    return {
      ...slide,
      photo:builtin?FERTINI_HERO_IMAGES[index%2]:slide.photo,
      fallback:builtin?"":"/fertini/hero-0"+(index%2+1)+".svg",
    };
  });
  const root=useRef<HTMLElement>(null);
  const [active,setActive]=useState(0);
  const [autoPlay,setAutoPlay]=useState(true);
  const [ready,setReady]=useState(false);
  const elapsedRef=useRef(0);
  const progressRef=useRef<HTMLSpanElement>(null);

  useEffect(()=>{
    let complete=false;
    try{complete=window.sessionStorage.getItem("fertini:intro:seen:v3")==="1";}catch{complete=true;}
    const start=()=>setReady(true);
    // Only the intro-complete signal starts the storefront. An independent
    // timeout previously let a second reveal begin while the prelude was open.
    const id=complete?window.requestAnimationFrame(start):0;
    window.addEventListener("fertini:intro:complete",start);
    return()=>{if(id)window.cancelAnimationFrame(id);window.removeEventListener("fertini:intro:complete",start);};
  },[]);
  // Shared clock for slideshow and progress. Pause preserves elapsed time.
  useEffect(()=>{
    if(!ready)return;
    let raf=0,last=0;
    const duration=5600;
    const tick=(time:number)=>{
      if(last===0)last=time;
      const delta=Math.min(80,time-last);
      last=time;
      if(autoPlay&&!document.hidden&&!window.matchMedia("(prefers-reduced-motion: reduce)").matches){
        elapsedRef.current+=delta;
      }
      if(elapsedRef.current>=duration){
        elapsedRef.current=0;
        setActive(index=>(index+1)%slides.length);
      }
      if(progressRef.current)progressRef.current.style.transform="scaleX("+Math.min(1,elapsedRef.current/duration).toFixed(5)+")";
      raf=window.requestAnimationFrame(tick);
    };
    raf=window.requestAnimationFrame(tick);
    return()=>window.cancelAnimationFrame(raf);
  },[ready,autoPlay]);
  function selectSlide(index:number){
    elapsedRef.current=0;
    if(progressRef.current)progressRef.current.style.transform="scaleX(0)";
    setActive(index);
  }
  useEffect(()=>{
    if(!ready||!root.current||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx=gsap.context(()=>{
      root.current?.querySelectorAll<HTMLElement>("[data-fertini-heading]").forEach(head=>{
        const title=head.querySelector<HTMLElement>("h2");
        const kicker=head.querySelector<HTMLElement>(".maison-kicker");
        const paragraph=head.querySelector<HTMLElement>("p");
        const tl=gsap.timeline({paused:true});
        // Full-line masked reveal, NOT the loader's scattered-letter assembly.
        // Preserve RTL shaping by never wrapping or splitting Persian glyphs.
        if(kicker)tl.fromTo(kicker,{y:14,autoAlpha:0},{y:0,autoAlpha:1,duration:.58,ease:"power2.out"},0);
        if(title)tl.fromTo(title,
          {y:34,autoAlpha:0,clipPath:"inset(0% 0% 100% 0%)",filter:"blur(9px)"},
          {y:0,autoAlpha:1,clipPath:"inset(0% 0% 0% 0%)",filter:"blur(0px)",duration:1.16,
           ease:"power3.out",clearProps:"clipPath,filter,transform,opacity,visibility"},.16);
        if(paragraph)tl.fromTo(paragraph,{y:17,autoAlpha:0},{y:0,autoAlpha:1,duration:.76,ease:"power2.out",clearProps:"transform,opacity,visibility"},.57);
        ScrollTrigger.create({trigger:head,start:"top 87%",once:true,onEnter:()=>tl.play()});
      });
    },root);
    return()=>ctx.revert();
  },[ready]);

  const byId=new Map(products.map(x=>[x.id,x]));
  const bestselling=content.bestsellerIds.map(id=>byId.get(id)).filter((x):x is HomeProduct=>Boolean(x));
  const latest=content.latestIds.map(id=>byId.get(id)).filter((x):x is HomeProduct=>Boolean(x));
  const catalogUnavailable=catalogState==="unavailable";
  const activeCampaigns=getActiveCampaigns(content);
  // Families are an olfactive editorial: ingredients, not perfume bottles.
  // Link only when a matching REAL family exists in the live catalogue.
  const familyStory=[
    {id:"woody",name:"چوبی و سدر",subtitle:"WOODY / CEDAR",photo:FERTINI_FAMILY_IMAGES.woody,
      match:/چوب|سدر|wood|cedar/i},
    {id:"oud",name:"عود و دود",subtitle:"OUD / SMOKE",photo:FERTINI_FAMILY_IMAGES.oud,
      match:/عود|oud|بخور|incense/i},
    {id:"vanilla",name:"وانیل و شکوفه",subtitle:"VANILLA / ORCHID",photo:FERTINI_FAMILY_IMAGES.vanilla,
      match:/وانیل|vanilla/i},
  ];
  const displayedFamilies=familyStory.map(f=>{
    const live=catalogState==="database"?scentFamilies.find(x=>f.match.test(x.name)):undefined;
    return {...f,url:live?"/products?scent_family_id="+live.id:editorialFamilyHref(f.id as EditorialFamily)};
  });
  const sections={
    // Delivery information is available on /shipping; no delivery block on home.
    shipping:null,
    campaign:activeCampaigns.length>0?<section className="fertini-v5-campaigns maison-wide" aria-label="کمپین‌های فعال">
      {activeCampaigns.map(c=><div className="fertini-v5-campaign" key={c.id}>
        <div className="fertini-v5-campaign__banner">
         <Image src={c.banner} alt={c.title} fill unoptimized={c.banner.startsWith("/api/")||c.banner.startsWith("https://")} sizes="(min-width:900px) 90vw,100vw"/>
         <div className="fertini-v5-campaign__overlay"><span>FERTINI / LIMITED CAMPAIGN</span><h2>{c.title}</h2>
          {c.description&&<p>{c.description}</p>}
          <strong>تا {c.discountPercent}٪ تخفیف · پایان {new Intl.DateTimeFormat("fa-IR",{dateStyle:"medium"}).format(new Date(c.endsAt))}</strong></div>
        </div>
        <div className="fertini-v5-campaign__products">{c.productIds.map(id=>byId.get(id)).filter((p):p is HomeProduct=>Boolean(p))
         .map(product=><ProductCard key={product.id} product={product} discountPercent={campaignDiscountPercent(content,product.id)}/>)}</div>
      </div>)}
    </section>:null,
    bestsellers: <section className="fertini-v5-best maison-wide" aria-labelledby="fertini-best-title">
      <header className="fertini-v5-heading" data-fertini-heading>
        <span className="maison-kicker" lang="en" dir="ltr">01 / THE MOST LOVED</span>
        <h2 id="fertini-best-title">{content.bestsellerTitle}</h2>
        <p>{content.bestsellerDescription}</p>
      </header>
      {catalogUnavailable?<p role="status" className="fertini-v5-catalog-notice">کاتالوگ محصولات موقتا در دسترس نیست.</p>:null}
      <div className="fertini-v5-best__grid">{bestselling.length
        ?bestselling.map((product,index)=><ProductCard key={product.id} product={product}
           editorialImage={editorialBestsellers[index]} discountPercent={campaignDiscountPercent(content,product.id)}
           mode={(["up","right"] as const)[index%2]}/>)
        :bestEditorialPreviews.map((item,index)=><EditorialPreviewCard key={item.slug} {...item}
           mode={(["up","right"] as const)[index%2]}/>)}</div>
    </section>,
    latest: <section className="fertini-v5-new maison-wide" aria-labelledby="fertini-new-title">
      <header className="fertini-v5-heading" data-fertini-heading>
        <span className="maison-kicker" lang="en" dir="ltr">02 / JUST ARRIVED</span>
        <h2 id="fertini-new-title">{content.latestTitle}</h2>
        <p>{content.latestDescription}</p>
      </header>
      {catalogUnavailable?<p role="status" className="fertini-v5-catalog-notice">کاتالوگ محصولات موقتا در دسترس نیست.</p>:null}
      <div className="fertini-v5-new__scroll" aria-label="عطرهای جدید مجموعه فرتینی">
        {latest.length
          ?latest.map((product,index)=><ProductCard key={product.id} product={product}
             editorialImage={editorialNewest[index]} discountPercent={campaignDiscountPercent(content,product.id)}
             large mode={(["stretch","fade"] as const)[index%2]}/>)
          :newestEditorialPreviews.map((item,index)=><EditorialPreviewCard key={item.slug} {...item} large
             mode={(["stretch","fade"] as const)[index%2]}/>)}
      </div>
      <div className="fertini-v5-new__bottom"><span lang="en" dir="ltr">
        NEW SCENTS / {String(latest.length||newestEditorialPreviews.length).padStart(2,"0")}</span>
        <Link href="/products" className="fertini-v5-cta">{content.latestCtaLabel}</Link>
      </div>
    </section>,
    families: <section className="fertini-v5-families maison-wide" aria-labelledby="fertini-families-title">
      <header className="fertini-v5-heading" data-fertini-heading>
        <span className="maison-kicker" lang="en" dir="ltr">03 / THE OLFACTIVE FAMILIES</span>
        <h2 id="fertini-families-title">{content.familyTitle}</h2>
        <p>{content.familyDescription}</p>
      </header>
      <div className="fertini-v5-families__grid">
        {displayedFamilies.map((family,index)=>{
          const visual=<div data-fertini-photo data-photo-entrance={(["right","up","fade"] as const)[index%3]}
            className="fertini-v5-family__photo">
            <ResilientPhoto src={family.photo} fallback=""
              sizes="(min-width:950px) 30vw,100vw" alt={"مواد اولیه رایحه "+family.name}/>
            <div data-fertini-caption className="fertini-v5-family__info">
              <span dir="ltr" lang="en">{String(index+1).padStart(2,"0")} / {family.subtitle}</span>
              <h3>{family.name}</h3>
            </div>
          </div>;
          const className="fertini-v5-family fertini-v5-family--"+family.id;
          return <Link key={family.id} href={family.url} className={className}
            aria-label={"مشاهده عطرهای گروه "+family.name} data-fertini-card>{visual}</Link>;
        })}
      </div>
    </section>
  };
  return <main ref={root} className="maison-home fertini-v5" id="main-content">
    <section className="fertini-hero fertini-v5-hero fertini-hero--immersive" aria-labelledby="fertini-hero-title">
      <h1 id="fertini-hero-title" className="sr-only">FERTINI — خانه عطر فرتینی</h1>
      <div className="fertini-hero__gallery">
        {slides.map((slide,index)=><div key={index} className={"fertini-hero__image"+(index===active?" is-active":"")+(slide.photo.endsWith(".svg")?" is-vector-art":"")} aria-hidden={index!==active}>
          <ResilientPhoto src={slide.photo} fallback={slide.fallback}
            priority={index<2} sizes="100vw" alt={index===active?slide.alt:""}/>
        </div>)}
        <div className="fertini-hero__controls" role="group" aria-label="اسلایدهای معرفی">
          <span lang="en" dir="ltr">{String(active+1).padStart(2,"0")} / {String(slides.length).padStart(2,"0")}</span>
          <div>{slides.map((slide,index)=><button type="button" key={index} className={active===index?"is-active":""} aria-pressed={active===index} aria-label={"نمایش اسلاید "+(index+1)} onClick={()=>selectSlide(index)}><span/></button>)}
            <button type="button" className="fertini-hero__autoplay" aria-label={autoPlay?"توقف جابه‌جایی خودکار اسلایدها":"ادامه جابه‌جایی خودکار اسلایدها"} aria-pressed={autoPlay} onClick={()=>setAutoPlay(value=>!value)}>{autoPlay?<Pause size={15}/>:<Play size={15}/>}</button>
          </div>
          <div className="fertini-hero__progress" aria-hidden="true"><span ref={progressRef}/></div>
        </div>
      </div>
    </section>
    {content.sectionOrder.map(section=>content.sectionVisibility[section]?
      <Fragment key={section}>{sections[section]}</Fragment>:null)}

  </main>;
}
