import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { FERTINI_DEMOS } from "@/lib/fertini-demo";
import FertiniFragranceDetail from "@/components/maison/FertiniFragranceDetail";
const legacyAliases: Record<string,string> = {
  "demo-001": "nocturne",
  "demo-002": "lumiere",
  "demo-003": "sillage",
  "demo-004": "obsidian",
  "demo-005": "iris",
  "demo-006": "cendre",
  "demo-007": "aube",
  "demo-008": "solstice",
  "demo-009": "epure",
  "demo-010": "veil",
  "demo-011": "atlas",
  "demo-012": "safran",
};
export const dynamicParams=false;
export function generateStaticParams(){return [...FERTINI_DEMOS.map(product=>({id:product.id})),...Object.keys(legacyAliases).map(id=>({id}))];}
export async function generateMetadata({params}:{params:Promise<{id:string}>}):Promise<Metadata>{
 const {id}=await params;
 const product=FERTINI_DEMOS.find(item=>item.id===id);
 if(!product)return{title:"عطر یافت نشد"};
 return {title:product.name+" | FERTINI",description:product.description,robots:{index:false,follow:false}};
}
export default async function FragrancePage({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 if(legacyAliases[id])redirect("/fragrance/"+legacyAliases[id]);
 if(!FERTINI_DEMOS.some(p=>p.id===id))notFound();
 return <FertiniFragranceDetail productId={id}/>;
}
