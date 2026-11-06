"use client";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { FERTINI_DEMOS, FERTINI_FAMILIES, type FertiniDemo } from "@/lib/fertini-demo";

const slides = [
  {photo:"/fertini/hero-01.svg",alt:"شیشه عطر فرتینی در نورپردازی سینمایی"},
  {photo:"/fertini/hero-02.svg",alt:"عطر فرتینی در نور ملایم و سایه‌های عمیق"},
] as const;

function ProductCard({product,large=false}:{product:FertiniDemo;large?:boolean}){
  return <Link href={"/fragrance/"+product.id} className={"fertini-v5-card"+(large?" fertini-v5-card--large":"")} data-fertini-card>
    <div className="fertini-v5-card__media" data-fertini-photo>
      <Image src={product.image} alt={product.name} fill sizes={large?"(min-width:960px) 32vw, 68vw":"(min-width:960px) 27vw, (min-width:600px) 46vw, 45vw"} />
      <span className="fertini-v7-curtain" aria-hidden="true"><i/><i/></span>
    </div>
    <div className="fertini-v5-card__info" data-fertini-caption>
      <span lang="en" dir="ltr">{product.subtitle.split(" — ")[0]}</span>
      <h3>{product.name}</h3>
      <p>{product.variants[1].price.toLocaleString("fa-IR")} تومان</p>
    </div>
  </Link>;
}
export default function FertiniHomeV5(){
  const root=useRef<HTMLElement>(null);
  const [active,setActive]=useState(0);
  const [autoPlay,setAutoPlay]=useState(true);
  const [ready,setReady]=useState(false);

  useEffect(()=>{
    let complete=false;
    try{complete=window.sessionStorage.getItem("fertini:intro:seen:v3")==="1";}catch{complete=true;}
    const start=()=>setReady(true);
    const id=complete?window.requestAnimationFrame(start):0;
    const failsafe=window.setTimeout(start,4500);
    window.addEventListener("fertini:intro:complete",start);
    return()=>{if(id)window.cancelAnimationFrame(id);window.clearTimeout(failsafe);window.removeEventListener("fertini:intro:complete",start);};
  },[]);
  useEffect(()=>{
    if(!ready||!autoPlay||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
    const id=window.setInterval(()=>{if(!document.hidden)setActive(index=>(index+1)%slides.length);},6800);
    return()=>window.clearInterval(id);
  },[ready,autoPlay]);
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
      root.current?.querySelectorAll<HTMLElement>("[data-fertini-card]").forEach((card,i)=>{
        const frame=card.querySelector<HTMLElement>("[data-fertini-photo]");
        const photo=frame?.querySelector("img");
        const text=[...card.querySelectorAll<HTMLElement>("[data-fertini-caption] > *")];
        const curtain=frame?.querySelector<HTMLElement>(".fertini-v7-curtain");
        const shutters=curtain?.querySelectorAll<HTMLElement>("i");
        const variant=i%4;
        const ahead=card.getBoundingClientRect().top>window.innerHeight*.91;
        let started=false;
        const tl=gsap.timeline({paused:true,onComplete:()=>{
          // The reveal is permanent; never restore the cover or image transform.
          if(curtain)gsap.set(curtain,{display:"none"});
          card.dataset.fertiniMotionDone="true";
        }});
        if(curtain)gsap.set(curtain,{autoAlpha:ahead?1:0});
        if(ahead&&curtain){
          if(variant===0&&shutters?.length===2){
            tl.to(shutters[0],{xPercent:-101,duration:1.25,ease:"power2.inOut"},0)
              .to(shutters[1],{xPercent:101,duration:1.25,ease:"power2.inOut"},0);
          }else if(variant===1){
            tl.to(curtain,{autoAlpha:0,duration:1.15,ease:"power2.inOut"},0);
          }else if(variant===2){
            tl.to(curtain,{xPercent:102,duration:1.35,ease:"power2.inOut"},0);
          }else{
            tl.to(curtain,{yPercent:-102,duration:1.35,ease:"power2.inOut"},0);
          }
          tl.set(curtain,{display:"none"},1.4);
        }
        // Full image on first paint; a restrained one-time 3.5% zoom-out.
        if(photo)tl.fromTo(photo,{scale:1.035},{scale:1,duration:2.4,ease:"power2.out"},0);
        if(frame)tl.fromTo(frame,{y:ahead?12:0,autoAlpha:ahead?.96:1},{y:0,autoAlpha:1,duration:1.05,ease:"power2.out"},0);
        if(text.length)tl.fromTo(text,{autoAlpha:0,y:12},{autoAlpha:1,y:0,duration:.8,stagger:.11,ease:"power2.out"},.25);
        const playWhenLoaded=()=>{
          if(started)return;
          started=true;
          if(!photo||photo.complete)tl.play();
          else{
            photo.addEventListener("load",()=>tl.play(),{once:true});
            photo.addEventListener("error",()=>tl.play(),{once:true});
          }
        };
        const scene=ScrollTrigger.create({trigger:card,start:"top bottom+=160",once:true,onEnter:playWhenLoaded});
        if(scene.isActive||!ahead)playWhenLoaded();
      });
    },root);
    return()=>ctx.revert();
  },[ready]);

  const bestselling=FERTINI_DEMOS.filter(product=>product.collection==="bestseller").slice(0,6);
  const latest=FERTINI_DEMOS.filter(product=>product.collection==="new").slice(0,6);
  return <main ref={root} className="maison-home fertini-v5" id="main-content">
    <section className="fertini-hero fertini-v5-hero fertini-hero--immersive" aria-labelledby="fertini-hero-title">
      <h1 id="fertini-hero-title" className="sr-only">FERTINI — خانه عطر فرتینی</h1>
      <div className="fertini-hero__gallery">
        {slides.map((slide,index)=><div key={slide.photo} className={"fertini-hero__image"+(index===active?" is-active":"")} aria-hidden={index!==active}>
          <Image src={slide.photo} fill priority={index===0} sizes="100vw" alt={index===active?slide.alt:""}/>
        </div>)}
        <div className="fertini-hero__controls" role="group" aria-label="اسلایدهای معرفی">
          <span lang="en" dir="ltr">{String(active+1).padStart(2,"0")} / {String(slides.length).padStart(2,"0")}</span>
          <div>{slides.map((slide,index)=><button type="button" key={slide.photo} className={active===index?"is-active":""} aria-pressed={active===index} aria-label={"نمایش اسلاید "+(index+1)} onClick={()=>setActive(index)}><span/></button>)}
            <button type="button" className="fertini-hero__autoplay" aria-label={autoPlay?"توقف جابه‌جایی خودکار اسلایدها":"ادامه جابه‌جایی خودکار اسلایدها"} aria-pressed={autoPlay} onClick={()=>setAutoPlay(value=>!value)}>{autoPlay?<Pause size={15}/>:<Play size={15}/>}</button>
          </div>
        </div>
      </div>
    </section>

    <section className="fertini-v5-best maison-wide" aria-labelledby="fertini-best-title">
      <header className="fertini-v5-heading" data-fertini-heading>
        <span className="maison-kicker" lang="en" dir="ltr">01 / THE MOST LOVED</span>
        <h2 id="fertini-best-title">پرفروش‌ترین‌ها</h2>
        <p>شش انتخاب ماندگار از مجموعه فرتینی.</p>
      </header>
      <div className="fertini-v5-best__grid">{bestselling.map(product=><ProductCard key={product.id} product={product}/>)}</div>
    </section>

    <section className="fertini-v5-new maison-wide" aria-labelledby="fertini-new-title">
      <header className="fertini-v5-heading" data-fertini-heading>
        <span className="maison-kicker" lang="en" dir="ltr">02 / JUST ARRIVED</span>
        <h2 id="fertini-new-title">جدیدترین عطرها</h2>
        <p>رایحه‌هایی تازه برای سلیقه‌هایی که در جست‌وجوی تجربه‌ای متفاوت‌اند.</p>
      </header>
      <div className="fertini-v5-new__scroll" aria-label="جدیدترین عطرها — برای دیدن محصولات بیشتر اسکرول افقی کنید">
        {latest.map(product=><ProductCard key={product.id} product={product} large/>)}
      </div>
      <div className="fertini-v5-new__bottom"><span lang="en" dir="ltr">DRAG / DISCOVER</span><Link href="/products" className="fertini-v5-cta">مشاهده همه عطرها</Link></div>
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
          <div data-fertini-photo className="fertini-v5-family__photo">
            <Image fill sizes="(min-width:950px) 30vw,100vw" src={family.image} alt={"دسته عطرهای "+family.name}/>
            <span className="fertini-v7-curtain" aria-hidden="true"><i/><i/></span>
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
