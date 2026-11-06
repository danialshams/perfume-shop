"use client";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import LuxuryNavbar from "@/components/home-sections/navbar";
import { CinematicFooter } from "@/components/home-sections/CinematicStorefront";
export default function EmptyCart(){
 return <div className="ql-shop maison-cart" style={{background:"#f4f5f2"}}>
  <LuxuryNavbar/>
  <main className="maison-wide" id="main-content" style={{minHeight:"68svh",display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",textAlign:"center",paddingBlock:100}}>
    <ShoppingBag size={38} strokeWidth={1.1} color="#8a988b" aria-hidden="true"/>
    <span className="maison-kicker" dir="ltr" lang="en" style={{marginTop:31}}>FERTINI / YOUR SELECTION</span>
    <h1 style={{fontSize:"clamp(37px,5vw,64px)",fontWeight:300,lineHeight:1.6,marginTop:28}}>سبد خرید شما خالی است.</h1>
    <p style={{maxWidth:430,fontSize:13,color:"#88958b",lineHeight:2.7,marginTop:15}}>هنوز عطری انتخاب نکرده‌اید. مجموعه را کشف کنید و رایحه خودتان را بیابید.</p>
    <Link href="/products" style={{display:"inline-block",marginTop:42,fontSize:13,color:"#2d4434",paddingBottom:10,borderBottom:"1px solid currentColor"}}>مشاهده عطرها</Link>
  </main>
  <CinematicFooter/>
 </div>;
}
