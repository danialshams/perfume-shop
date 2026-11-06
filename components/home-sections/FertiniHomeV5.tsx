"use client";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, useState } from "react";
import { FERTINI_DEMOS, FERTINI_FAMILIES, type FertiniDemo } from "@/lib/fertini-demo";

const slides = [
  { photo:"/maison/hero.jpg",alt:"عطری با نورپردازی سینمایی در فضای تیره",kicker:"FERTINI / THE FRAGRANCE HOUSE",
    title:<>رایحه،<br/>شکل دیگری<br/>از <em>حضور.</em></>,body:"انتخابی بی‌شتاب، برای خاطره‌هایی که می‌مانند." },
  { photo:"/maison/dark.jpg",alt:"شیشه عطر در سایه‌های عمیق و نور نرم",kicker:"FERTINI / AN INVISIBLE SIGNATURE",
    title:<>زیبایی،<br/>در <em>سکوت</em><br/>ماندگار است.</>,body:"جایی برای کشف امضای شخصی در جهان رایحه." },
] as const;

function ProductCard({product,large=false}:{product:FertiniDemo;large?:boolean}){
  return <Link href={"/fragrance/"+product.id} className={"fertini-v5-card"+(large?" fertini-v5-card--large":"")} data-fertini-card>
    <div className="fertini-v5-card__media" data-fertini-photo>
      <Image src={product.image} alt={product.name} fill sizes={large?"(min-width:960px) 32vw, 68vw":"(min-width:960px) 27vw, (min-width:600px) 46vw, 45vw"} />
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
  const slideRef=useRef<HTMLDivElement>(null);
  const paused=useRef(false);
  const [active,setActive]=useState(0);
  const [ready,setReady]=useState(false);

  useEffect(()=>{
    let complete=false;
    try{complete=window.sessionStorage.getItem("fertini:intro:seen:v3")==="1";}catch{complete=true;}
    const start=()=>setReady(true);
    const id=complete?window.requestAnimationFrame(start):0;
    window.addEventListener("fertini:intro:complete",start);
    return()=>{if(id)window.cancelAnimationFrame(id);window.removeEventListener("fertini:intro:complete",start);};
  },[]);
  useEffect(()=>{
    if(!ready||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
    const id=window.setInterval(()=>{if(!paused.current&&!document.hidden)setActive(index=>(index+1)%slides.length);},10000);
    return()=>window.clearInterval(id);
  },[ready]);
  useEffect(()=>{
    if(!ready||!slideRef.current||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
    const items=[...slideRef.current.children];
    const animation=gsap.fromTo(items,{y:25,autoAlpha:0},{y:0,autoAlpha:1,stagger:.17,duration:1.04,ease:"power3.out",clearProps:"opacity,visibility,transform"});
    return()=>{animation.kill();gsap.set(items,{clearProps:"opacity,visibility,transform"});};
  },[ready,active]);
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
        const photo=card.querySelector<HTMLElement>("[data-fertini-photo]");
        const img=photo?.querySelector("img");
        const caption=card.querySelector<HTMLElement>("[data-fertini-caption]");
        const delay=(i%3)*.12;
        const mode=i%3;
        const clip=mode===0?"inset(0 0 100% 0)":mode===1?"inset(0 40% 0 40%)":"inset(0 100% 0 0)";
        const tl=gsap.timeline({paused:true});
        if(photo)tl.fromTo(photo,{clipPath:clip},{clipPath:"inset(0 0 0 0)",duration:1.32,ease:"power3.inOut",clearProps:"clipPath"},delay);
        if(img)tl.fromTo(img,{scale:1.095},{scale:1,duration:2.1,ease:"power2.out",clearProps:"transform"},delay+.13);
        if(caption)tl.fromTo([...caption.children],{y:14,autoAlpha:0},{y:0,autoAlpha:1,stagger:.115,duration:.75,ease:"power3.out",clearProps:"transform,opacity,visibility"},delay+.65);
        ScrollTrigger.create({trigger:card,start:"top 93%",once:true,onEnter:()=>tl.play()});
      });
    },root);
    return()=>ctx.revert();
  },[ready]);

  const bestselling=FERTINI_DEMOS.filter(product=>product.collection==="bestseller").slice(0,6);
  const latest=FERTINI_DEMOS.filter(product=>product.collection==="new").slice(0,6);
  return <main ref={root} className="maison-home fertini-v5" id="main-content">
    <section className="fertini-hero fertini-v5-hero" aria-labelledby="fertini-hero-title"
      onMouseEnter={()=>{paused.current=true;}} onMouseLeave={()=>{paused.current=false;}}
      onFocusCapture={()=>{paused.current=true;}} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget))paused.current=false;}}>
      <div className="fertini-hero__gallery">
        {slides.map((slide,index)=><div key={slide.photo} className={"fertini-hero__image"+(index===active?" is-active":"")} aria-hidden={index!==active}>
          <Image src={slide.photo} fill priority={index===0} sizes="(min-width:900px) 60vw,100vw" alt={index===active?slide.alt:""}/>
        </div>)}
        <span className="fertini-hero__caption" dir="ltr" lang="en">FERTINI — THE ART OF SCENT</span>
      </div>
      <div className="fertini-hero__text">
        <div ref={slideRef} className="fertini-hero__copy" key={active}>
          <span className="maison-kicker" dir="ltr" lang="en">{slides[active].kicker}</span>
          <h1 id="fertini-hero-title">{slides[active].title}</h1>
          <p>{slides[active].body}</p>
          <Link href="/products" className="fertini-v5-cta">کشف عطرها</Link>
        </div>
        <div className="fertini-hero__controls" role="group" aria-label="اسلایدهای معرفی">
          <span lang="en" dir="ltr">{String(active+1).padStart(2,"0")} — {String(slides.length).padStart(2,"0")}</span>
          <div>{slides.map((slide,index)=><button type="button" key={slide.kicker} className={active===index?"is-active":""} aria-pressed={active===index} aria-label={"اسلاید "+(index+1)} onClick={()=>setActive(index)}><span/></button>)}</div>
        </div>
      </div>
    </section>

    <section className="fertini-v5-best maison-wide" aria-labelledby="fertini-best-title">
      <header className="fertini-v5-heading" data-fertini-heading>
        <span className="maison-kicker" lang="en" dir="ltr">01 / THE MOST LOVED</span>
        <h2 id="fertini-best-title">پرفروش‌ترین‌ها</h2>
        <p>شش انتخاب ماندگار از مجموعهٔ فرتینی.</p>
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
      <div className="fertini-v5-new__bottom"><span lang="en" dir="ltr">DRAG / DISCOVER</span><Link href="/products" className="fertini-v5-cta">مشاهدهٔ همهٔ عطرها</Link></div>
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
