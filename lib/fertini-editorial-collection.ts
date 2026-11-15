import {FERTINI_PRODUCT_IMAGES,FERTINI_FAMILY_IMAGES} from "@/lib/fertini-editorial";

export type EditorialFamily = "woody"|"oud"|"vanilla";
export type EditorialFragrance = {
 slug:string;name:string;nameEn:string;subtitle:string;price:number;
 image:string;family:EditorialFamily;description:string;
 notes:{top:string[];heart:string[];base:string[]};
};

export const FERTINI_EDITORIAL_FRAGRANCES: readonly EditorialFragrance[] = [
 {
  slug:"roselia",name:"روزلیا",nameEn:"ROSELIA",subtitle:"FERTINI / EAU DE PARFUM",
  price:2980000,image:FERTINI_PRODUCT_IMAGES[0],family:"vanilla",
  description:"آغازی از گلبرگ‌های رز در نور روشن، با پایه‌ای لطیف از وانیل و مشک.",
  notes:{top:["ترنج","رز تازه"],heart:["گل رز","شکوفه سفید"],base:["وانیل","مشک"]},
 },
 {
  slug:"noir",name:"نوآر",nameEn:"NOIR",subtitle:"FERTINI / EAU DE PARFUM",
  price:3250000,image:FERTINI_PRODUCT_IMAGES[1],family:"woody",
  description:"چوب سدر و وتیور دودی؛ رایحه‌ای آرام، عمیق و کم‌ادعا.",
  notes:{top:["فلفل سیاه","ترنج"],heart:["چوب سدر","وتیور"],base:["چوب خشک","مشک"]},
 },
 {
  slug:"ambra",name:"امبرا",nameEn:"AMBRA",subtitle:"FERTINI / EAU DE PARFUM",
  price:3680000,image:FERTINI_PRODUCT_IMAGES[2],family:"oud",
  description:"کهربا، زعفران و عود در تعادلی گرم، شرقی و سینمایی.",
  notes:{top:["زعفران","فلفل صورتی"],heart:["کهربا","رز"],base:["عود","بخور"]},
 },
 {
  slug:"velora",name:"ولورا",nameEn:"VELORA",subtitle:"FERTINI / EAU DE PARFUM",
  price:2890000,image:FERTINI_PRODUCT_IMAGES[3],family:"vanilla",
  description:"وانیل و تونکا؛ گرمایی نرم با رد ظریف گل‌های روشن.",
  notes:{top:["گلابی","بادام"],heart:["شکوفه وانیل","گل سفید"],base:["وانیل","تونکا"]},
 },
 {
  slug:"lumira",name:"لومیرا",nameEn:"LUMIRA",subtitle:"FERTINI / EAU DE PARFUM",
  price:3120000,image:FERTINI_PRODUCT_IMAGES[4],family:"woody",
  description:"نرولی و چای سبز با پایان ملایم چوبی، سبک و تمیز.",
  notes:{top:["نرولی","مرکبات"],heart:["چای سبز","گل بهار نارنج"],base:["چوب سفید","مشک"]},
 },
 {
  slug:"azure",name:"آزور",nameEn:"AZURE",subtitle:"FERTINI / EAU DE PARFUM",
  price:3450000,image:FERTINI_PRODUCT_IMAGES[5],family:"woody",
  description:"زنبق دریایی و سدر روشن در فضای خنک و شفاف.",
  notes:{top:["نسیم دریایی","ترنج"],heart:["زنبق","مریم‌گلی"],base:["سدر","مشک سفید"]},
 },
];

export const FERTINI_EDITORIAL_FAMILIES: Record<EditorialFamily,{
 name:string;subtitle:string;photo:string;description:string
}> = {
 woody:{
  name:"چوبی و سدر",subtitle:"WOODY / CEDAR",
  photo:FERTINI_FAMILY_IMAGES.woody,
  description:"رایحه‌هایی برگرفته از چوب، پوست درخت و بافت‌های گرم طبیعی.",
 },
 oud:{
  name:"عود و دود",subtitle:"OUD / SMOKE",
  photo:FERTINI_FAMILY_IMAGES.oud,
  description:"عمق عود و بخور در فضایی آرام و گرم، با رد ماندگار چوب شرقی.",
 },
 vanilla:{
  name:"وانیل و شکوفه",subtitle:"VANILLA / ORCHID",
  photo:FERTINI_FAMILY_IMAGES.vanilla,
  description:"گرمای وانیل و شکوفه‌های نرم؛ نزدیک به پوست و دلنشین.",
 },
};

export const editorialFragranceHref=(slug:string)=>"/fragrance/edition/"+slug;
export const editorialFamilyHref=(family:EditorialFamily)=>"/fragrance/collection/"+family;
