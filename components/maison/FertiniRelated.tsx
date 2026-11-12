"use client";
import {useEffect,useState} from "react";
import Image from "next/image";
import Link from "next/link";
type Item={id:number;name:string;price:number|string|null;image:string|null;scentFamily:string};
export function FertiniRelated({productId}:{productId:number}){
 const [items,setItems]=useState<Item[]>([]);
 useEffect(()=>{
  let mounted=true;
  fetch("/api/v1/engagement?type=related&productId="+productId,{cache:"no-store"})
   .then(r=>r.ok?r.json():Promise.reject()).then(data=>{if(mounted)setItems(data.items||[])}).catch(()=>{});
  return()=>{mounted=false};
 },[productId]);
 if(!items.length)return null;
 return <section className="fertini-related-live" aria-label="عطرهای مرتبط با گروه بویایی" dir="rtl">
  <span className="fertini-overline">THE SCENT FAMILY</span><h2>رایحه‌های هم‌خانواده</h2>
  <p>عطرهایی با گروه بویایی مشترک؛ انتخابی نزدیک به سلیقه شما.</p>
  <div className="fertini-related-live-grid">{items.map(i=><Link href={"/products/"+i.id} key={i.id} className="fertini-related-live-card">
   <div className="fertini-related-live-photo"><Image src={i.image||"/maison/hero.jpg"} alt={i.name} width={360} height={450} unoptimized sizes="(max-width: 650px) 45vw, 230px"/></div>
   <div className="fertini-related-live-info"><small>{i.scentFamily||"رایحه‌های فرتینی"}</small><h3>{i.name}</h3>
    {i.price!=null&&<span>{Number(i.price).toLocaleString("fa-IR")} تومان</span>}</div>
  </Link>)}</div>
 </section>;
}
