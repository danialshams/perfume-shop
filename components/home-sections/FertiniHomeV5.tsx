"use client";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { FERTINI_DEMOS, FERTINI_FAMILIES, type FertiniDemo } from "@/lib/fertini-demo";
import {DEFAULT_SITE_CONTENT,type FertiniSiteContent} from "@/lib/fertini-site-content";



function ProductCard({product,large=false,mode="up"}:{product:FertiniDemo;large?:boolean;mode?:"up"|"fade"|"right"|"left"|"stretch"}){
  return <Link href={"/fragrance/"+product.id} className={"fertini-v5-card"+(large?" fertini-v5-card--large":"")} data-fertini-card>
    <div className="fertini-v5-card__media" data-fertini-photo data-photo-entrance={mode}>
      <Image src={product.image} alt={product.name} fill loading={large?"eager":"lazy"} sizes={large?"(min-width:960px) 32vw, 68vw":"(min-width:960px) 27vw, (min-width:600px) 46vw, 45vw"} />
    </div>
    <div className="fertini-v5-card__info" data-fertini-caption>
      <span lang="en" dir="ltr">{product.subtitle.split(" — ")[0]}</span>
      <h3>{product.name}</h3>
      <p>{product.variants[1].price.toLocaleString("fa-IR")} تومان</p>
    </div>
  </Link>;
}
export default function FertiniHomeV5({content=DEFAULT_SITE_CONTENT}:{content?:FertiniSiteContent}){
  const slides=content.heroSlides;
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
    const id=complete?window.requestAnimationFrame(start):0;
    const failsafe=window.setTimeout(start,4500);
    window.addEventListener("fertini:intro:complete",start);
    return()=>{if(id)window.cancelAnimationFrame(id);window.clearTimeout(failsafe);window.removeEventListener("fertini:intro:complete",start);};
  },[]);
  // Shared clock for slideshow and progress. Pause preserves elapsed time.
  useEffect(()=>{
    if(!ready)return;
    let raf=0,last=0;
    const duration=6800;
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
        const children=[...head.children];
        const tl=gsap.timeline({paused:true});
        tl.fromTo(children,{y:26,autoAlpha:0},{y:0,autoAlpha:1,stagger:.18,duration:.9,ease:"power3.out",clearProps:"transform,opacity,visibility"});
        ScrollTrigger.create({trigger:head,start:"top 90%",once:true,onEnter:()=>tl.play()});
      });
    },root);
    return()=>ctx.revert();
  },[ready]);

  const bestselling=content.bestsellerIds.map(id=>FERTINI_DEMOS.find(product=>product.id===id)).filter((x):x is FertiniDemo=>Boolean(x));
  const latest=content.latestIds.map(id=>FERTINI_DEMOS.find(product=>product.id===id)).filter((x):x is FertiniDemo=>Boolean(x));
  return <main ref={root} className="maison-home fertini-v5" id="main-content">
    <section className="fertini-hero fertini-v5-hero fertini-hero--immersive" aria-labelledby="fertini-hero-title">
      <h1 id="fertini-hero-title" className="sr-only">FERTINI — خانه عطر فرتینی</h1>
      <div className="fertini-hero__gallery">
        {slides.map((slide,index)=><div key={slide.photo} className={"fertini-hero__image"+(index===active?" is-active":"")} aria-hidden={index!==active}>
          <Image src={slide.photo} fill priority={index===0} sizes="100vw" alt={index===active?slide.alt:""}/>
        </div>)}
        <div className="fertini-hero__controls" role="group" aria-label="اسلایدهای معرفی">
          <span lang="en" dir="ltr">{String(active+1).padStart(2,"0")} / {String(slides.length).padStart(2,"0")}</span>
          <div>{slides.map((slide,index)=><button type="button" key={slide.photo} className={active===index?"is-active":""} aria-pressed={active===index} aria-label={"نمایش اسلاید "+(index+1)} onClick={()=>selectSlide(index)}><span/></button>)}
            <button type="button" className="fertini-hero__autoplay" aria-label={autoPlay?"توقف جابه‌جایی خودکار اسلایدها":"ادامه جابه‌جایی خودکار اسلایدها"} aria-pressed={autoPlay} onClick={()=>setAutoPlay(value=>!value)}>{autoPlay?<Pause size={15}/>:<Play size={15}/>}</button>
          </div>
          <div className="fertini-hero__progress" aria-hidden="true"><span ref={progressRef}/></div>
        </div>
      </div>
    </section>

    <section className="fertini-v5-best maison-wide" aria-labelledby="fertini-best-title">
      <header className="fertini-v5-heading" data-fertini-heading>
        <span className="maison-kicker" lang="en" dir="ltr">01 / THE MOST LOVED</span>
        <h2 id="fertini-best-title">{content.bestsellerTitle}</h2>
        <p>{content.bestsellerDescription}</p>
      </header>
      <div className="fertini-v5-best__grid">{bestselling.map((product,index)=><ProductCard key={product.id} product={product} mode={(["up","right"] as const)[index%2]}/>)}</div>
    </section>

    <section className="fertini-v5-new maison-wide" aria-labelledby="fertini-new-title">
      <header className="fertini-v5-heading" data-fertini-heading>
        <span className="maison-kicker" lang="en" dir="ltr">02 / JUST ARRIVED</span>
        <h2 id="fertini-new-title">{content.latestTitle}</h2>
        <p>{content.latestDescription}</p>
      </header>
      <div className="fertini-v5-new__scroll" aria-label="شش عطر جدید از مجموعه فرتینی">
        {latest.map((product,index)=><ProductCard key={product.id} product={product} large mode={(["stretch","fade"] as const)[index%2]}/>)}
      </div>
      <div className="fertini-v5-new__bottom"><span lang="en" dir="ltr">SIX NEW SCENTS / 06</span><Link href="/products" className="fertini-v5-cta">مشاهده همه عطرها</Link></div>
    </section>

    <section className="fertini-v5-families maison-wide" aria-labelledby="fertini-families-title">
      <header className="fertini-v5-heading" data-fertini-heading>
        <span className="maison-kicker" lang="en" dir="ltr">03 / THE OLFACTIVE FAMILIES</span>
        <h2 id="fertini-families-title">دسته‌بندی رایحه‌ها</h2>
        <p>انتخاب را از حال‌وهوای خودتان آغاز کنید.</p>
      </header>
      <div className="fertini-v5-families__grid">
        {FERTINI_FAMILIES.map((family,index)=><Link key={family.id} href={"/products?family="+family.id}
          className={"fertini-v5-family fertini-v5-family--"+family.id} data-fertini-card>
          <div data-fertini-photo data-photo-entrance={(["right","up","fade"] as const)[index%3]} className="fertini-v5-family__photo">
            <Image fill sizes="(min-width:950px) 30vw,100vw" src={family.image} alt={"دسته عطرهای "+family.name}/>
          </div>
          <div data-fertini-caption className="fertini-v5-family__info">
            <span dir="ltr" lang="en">{String(index+1).padStart(2,"0")} / {family.subtitle}</span>
            <h3>{family.name}</h3>
          </div>
        </Link>)}
      </div>
    </section>
  </main>;
}
