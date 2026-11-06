"use client";
import { useSyncExternalStore } from "react";
import { FERTINI_DEMOS, type FertiniDemo } from "@/lib/fertini-demo";
const KEY="fertini:guest-cart:v1", CHANGE="fertini:guest-cart:changed";
export type GuestCartLine={productId:string;volume:number;quantity:number};
let memory="[]";
function readRaw(){
 if(typeof window==="undefined")return "[]";
 try{return localStorage.getItem(KEY)||"[]";}catch{return memory;}
}
function subscribe(callback:()=>void){
 window.addEventListener(CHANGE,callback);
 window.addEventListener("storage",callback);
 return()=>{window.removeEventListener(CHANGE,callback);window.removeEventListener("storage",callback);};
}
function parse(raw:string):GuestCartLine[]{
 try{
  const list:unknown=JSON.parse(raw);
  if(!Array.isArray(list))return [];
  return list.filter((item):item is GuestCartLine=>{
   if(!item||typeof item!=="object")return false;
   const x=item as Record<string,unknown>;
   const product=FERTINI_DEMOS.find(product=>product.id===x.productId);
   return !!product && product.variants.some(v=>v.volume===x.volume)&&
       Number.isSafeInteger(x.quantity)&&Number(x.quantity)>=1;
  }).map(item=>{
   const stock=FERTINI_DEMOS.find(p=>p.id===item.productId)?.variants.find(v=>v.volume===item.volume)?.stock??1;
   return {...item,quantity:Math.min(item.quantity,stock)};
  });
 }catch{return [];}
}
function persist(lines:GuestCartLine[]){
 if(typeof window==="undefined")return;
 const json=JSON.stringify(lines);
 memory=json;
 try{localStorage.setItem(KEY,json);}catch{}
 window.dispatchEvent(new Event(CHANGE));
}
export function readGuestCart(){return parse(readRaw());}
export function addGuestCartProduct(productId:string,volume:number,quantity=1):boolean{
 const product=FERTINI_DEMOS.find(p=>p.id===productId);
 const variant=product?.variants.find(v=>v.volume===volume);
 if(!product||!variant||quantity<1)return false;
 const current=readGuestCart(),existing=current.find(x=>x.productId===productId&&x.volume===volume);
 if(existing){existing.quantity=Math.min(variant.stock,existing.quantity+quantity);}
 else current.push({productId,volume,quantity:Math.min(variant.stock,quantity)});
 persist(current);return true;
}
/** Atomically add a selection of multiple fragrance volumes to the local showroom cart. */
export function addGuestCartProducts(productId:string,selection:Array<{volume:number;quantity:number}>):boolean{
 const product=FERTINI_DEMOS.find(item=>item.id===productId);
 if(!product||selection.length===0)return false;
 const unique=new Set(selection.map(item=>item.volume));
 if(unique.size!==selection.length)return false;
 const next=readGuestCart().map(item=>({...item}));
 for(const item of selection){
  if(!Number.isSafeInteger(item.quantity)||item.quantity<1)return false;
  const variant=product.variants.find(v=>v.volume===item.volume);
  if(!variant)return false;
  const existing=next.find(line=>line.productId===productId&&line.volume===item.volume);
  if((existing?.quantity??0)+item.quantity>variant.stock)return false;
  if(existing)existing.quantity+=item.quantity;
  else next.push({productId,volume:item.volume,quantity:item.quantity});
 }
 persist(next);
 return true;
}
export function changeGuestCartQuantity(productId:string,volume:number,quantity:number){
 const product=FERTINI_DEMOS.find(p=>p.id===productId);
 const variant=product?.variants.find(v=>v.volume===volume);
 if(!variant)return;
 const next=readGuestCart().filter(x=>!(x.productId===productId&&x.volume===volume));
 if(quantity>0)next.push({productId,volume,quantity:Math.min(variant.stock,quantity)});
 persist(next);
}
export function removeGuestCartProduct(productId:string,volume:number){changeGuestCartQuantity(productId,volume,0);}
export function clearGuestCart(){persist([]);}
export function useGuestCart(){
 const serialized=useSyncExternalStore(subscribe,readRaw,()=> "[]");
 const lines=parse(serialized);
 const items=lines.flatMap(line=>{
  const product=FERTINI_DEMOS.find(p=>p.id===line.productId);
  const variant=product?.variants.find(v=>v.volume===line.volume);
  return product&&variant?[{...line,product:product as FertiniDemo,variant}]:[];
 });
 return{items,count:items.reduce((sum,x)=>sum+x.quantity,0),
  total:items.reduce((sum,x)=>sum+x.quantity*x.variant.price,0)};
}
