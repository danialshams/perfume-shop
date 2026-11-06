import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FERTINI_DEMOS } from "@/lib/fertini-demo";
import FertiniFragranceDetail from "@/components/maison/FertiniFragranceDetail";
export const dynamicParams=false;
export function generateStaticParams(){return FERTINI_DEMOS.map(product=>({id:product.id}));}
export async function generateMetadata({params}:{params:Promise<{id:string}>}):Promise<Metadata>{
 const {id}=await params;
 const product=FERTINI_DEMOS.find(item=>item.id===id);
 if(!product)return{title:"عطر یافت نشد"};
 return {title:product.name+" | FERTINI",description:product.description,robots:{index:false,follow:false}};
}
export default async function FragrancePage({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 if(!FERTINI_DEMOS.some(p=>p.id===id))notFound();
 return <FertiniFragranceDetail productId={id}/>;
}
