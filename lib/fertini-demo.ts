export type FertiniFamily = "woody" | "floral" | "amber";
export type FertiniDemo = {
  id: string;
  name: string;
  subtitle: string;
  image: string;
  photos: string[];
  description: string;
  accords: string[];
  family: FertiniFamily;
  collection: "bestseller" | "new";
  notes: { top: string[]; heart: string[]; base: string[] };
  variants: { volume: number; price: number; stock: number }[];
};
type Seed = {
  id: string; name:string; family:FertiniFamily; image:string; secondary:string;
  description:string; top:string[]; heart:string[]; base:string[];
  price:number; collection:"bestseller"|"new";
};
const seeds: Seed[] = [
  {id:"nocturne",name:"Fertini — Nocturne",family:"woody",image:"/fertini/nocturne-front.svg",secondary:"/fertini/nocturne-side.svg",description:"سدر عمیق و کهربا در نوری آرام؛ رایحه‌ای برای حضوری بی‌نیاز از توضیح.",top:["ترنج","فلفل صورتی"],heart:["سدر","زنبق"],base:["کهربا","وتیور","مشک"],price:3290000,collection:"bestseller"},
  {id:"lumiere",name:"Fertini — Lumière",family:"floral",image:"/fertini/lumiere-front.svg",secondary:"/fertini/lumiere-side.svg",description:"لطافت گلبرگ‌ها، نور صبح و ردی تمیز از مشک سفید.",top:["نارنج","برگ بنفشه"],heart:["یاس","زنبق"],base:["مشک سفید","چوب صندل"],price:3150000,collection:"bestseller"},
  {id:"sillage",name:"Fertini — Sillage",family:"amber",image:"/fertini/sillage-front.svg",secondary:"/fertini/sillage-side.svg",description:"گرمای زعفران و رزین؛ امضایی شرقی که آهسته بر پوست می‌ماند.",top:["زعفران","دارچین"],heart:["رز","لابدانوم"],base:["وانیل","بنزوئین","عنبر"],price:3450000,collection:"bestseller"},
  {id:"obsidian",name:"Fertini — Obsidian",family:"woody",image:"/fertini/obsidian-front.svg",secondary:"/fertini/obsidian-side.svg",description:"درخت سرو و دود ملایم در فضایی تیره؛ بی‌پروا اما دقیق.",top:["گریپ‌فروت","فلفل سیاه"],heart:["سرو","چوب گایاک"],base:["خزه بلوط","بخور"],price:4190000,collection:"bestseller"},
  {id:"iris",name:"Fertini — Iris",family:"floral",image:"/fertini/iris-front.svg",secondary:"/fertini/iris-side.svg",description:"زنبق پودری و شکوفه‌های سفید در تعادلی نرم و شفاف.",top:["برگاموت","گلابی"],heart:["زنبق","فریزیا"],base:["مشک","چوب کشمیر"],price:3850000,collection:"bestseller"},
  {id:"cendre",name:"Fertini — Cendre",family:"amber",image:"/fertini/cendre-front.svg",secondary:"/fertini/cendre-side.svg",description:"وانیل خشک و چوب سوخته؛ برخوردی گرم از نور و سایه.",top:["هل","زعفران"],heart:["چوب خشک","بخور"],base:["وانیل","کهربا"],price:4590000,collection:"bestseller"},
  {id:"aube",name:"Fertini — Aube",family:"floral",image:"/fertini/aube-front.svg",secondary:"/fertini/aube-side.svg",description:"آغاز یک صبح روشن؛ شکوفه پرتقال و مشک شفاف.",top:["نارنگی","لیمو"],heart:["شکوفه پرتقال","یاس"],base:["مشک","چوب سفید"],price:2890000,collection:"new"},
  {id:"solstice",name:"Fertini — Solstice",family:"amber",image:"/fertini/solstice-front.svg",secondary:"/fertini/solstice-side.svg",description:"برخورد نور گرم عصر با ادویه و چوب صندل.",top:["پرتقال تلخ","هل"],heart:["کهربا","رز"],base:["صندل","وانیل"],price:3920000,collection:"new"},
  {id:"epure",name:"Fertini — Épure",family:"woody",image:"/fertini/epure-front.svg",secondary:"/fertini/epure-side.svg",description:"سادگی در کامل‌ترین شکل؛ سرو سفید و برگ‌های سبز.",top:["برگ انجیر","ترنج"],heart:["سدر","برگ بنفشه"],base:["مشک","وتیور"],price:3350000,collection:"new"},
  {id:"veil",name:"Fertini — Veil",family:"floral",image:"/fertini/veil-front.svg",secondary:"/fertini/veil-side.svg",description:"پرده‌ای از گل‌های سفید، سبک و نزدیک به پوست.",top:["گلابی","نارنج"],heart:["پیونی","مگنولیا"],base:["مشک سفید","عنبر نرم"],price:3590000,collection:"new"},
  {id:"atlas",name:"Fertini — Atlas",family:"woody",image:"/fertini/atlas-front.svg",secondary:"/fertini/atlas-side.svg",description:"سفر به عمق جنگل؛ ترکیبی از چوب خشک، خزه و صمغ.",top:["فلفل صورتی","ترنج"],heart:["سرو","نعناع هندی"],base:["صمغ","خزه بلوط"],price:4290000,collection:"new"},
  {id:"safran",name:"Fertini — Safran",family:"amber",image:"/fertini/safran-front.svg",secondary:"/fertini/safran-side.svg",description:"زعفران، رز و مشک در تعادلی غنی و شخصی.",top:["زعفران","فلفل صورتی"],heart:["گل رز","بخور"],base:["کهربا","مشک"],price:4790000,collection:"new"},
];
const familyLabels: Record<FertiniFamily,{name:string;subtitle:string;accords:string[]}> = {
  woody:{name:"چوبی و دودی",subtitle:"WOODY / SMOKY",accords:["چوبی","دودی","عمیق"]},
  floral:{name:"گلی و شفاف",subtitle:"FLORAL / MUSK",accords:["گلی","لطیف","شفاف"]},
  amber:{name:"گرم و شرقی",subtitle:"AMBER / SPICE",accords:["گرم","شرقی","ادویه‌ای"]},
};
export const FERTINI_DEMOS: FertiniDemo[] = seeds.map(seed=>({
  id:seed.id,name:seed.name,subtitle:familyLabels[seed.family].subtitle+" — EAU DE PARFUM",
  family:seed.family,collection:seed.collection,
  image:seed.image,
  photos:[seed.image,seed.secondary,seed.image.replace("-front.svg","-detail.svg")],
  description:seed.description,accords:familyLabels[seed.family].accords,
  notes:{top:seed.top,heart:seed.heart,base:seed.base},
  variants:[
    {volume:30,price:Math.round(seed.price*.72/10000)*10000,stock:8},
    {volume:50,price:seed.price,stock:12},
    {volume:100,price:Math.round(seed.price*1.56/10000)*10000,stock:5},
  ],
}));
export const FERTINI_FAMILIES = (Object.entries(familyLabels) as Array<[FertiniFamily,typeof familyLabels[FertiniFamily]]>).map(([id,detail])=>({id,...detail,image:id==="woody"?"/maison/woody.jpg":id==="floral"?"/maison/floral.jpg":"/maison/amber.jpg"}));
