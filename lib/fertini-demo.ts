export type FertiniDemo = {
  id: string;
  name: string;
  subtitle: string;
  image: string;
  photos: string[];
  description: string;
  accords: string[];
  notes: { top: string[]; heart: string[]; base: string[] };
  variants: { volume: number; price: number; stock: number }[];
};
export const FERTINI_DEMOS: FertiniDemo[] = [
  {
    id: "demo-001", name: "Fertini — Nocturne", subtitle: "WOODY / AMBER — EAU DE PARFUM",
    image: "/maison/woody.jpg", photos: ["/maison/woody.jpg","/maison/dark.jpg","/maison/portrait.jpg"],
    description: "روایتی از چوب‌های تیره، گرمای کهربا و سکوت پس از غروب. رایحه‌ای با شروع روشن و پایانی آرام و ماندگار؛ طراحی شده برای نمایش تجربهٔ کامل یک صفحهٔ محصول.",
    accords: ["چوبی","دودی","کهربایی"],
    notes: { top: ["ترنج","فلفل صورتی"], heart: ["سدر","زنبق"], base: ["کهربا","وتیور","مشک"] },
    variants: [{volume:30,price:2350000,stock:8},{volume:50,price:3290000,stock:12},{volume:100,price:4850000,stock:4}],
  },
  {
    id: "demo-002", name: "Fertini — Lumière", subtitle: "FLORAL / MUSK — EAU DE PARFUM",
    image: "/maison/floral.jpg", photos: ["/maison/floral.jpg","/maison/portrait.jpg","/maison/amber.jpg"],
    description: "شفافیت گلبرگ‌ها، لطافت مشک و روشنایی یک صبح آرام. نمونه‌ای برای نمایش رایحه‌های مینیمال و روشن در گالری فرتینی.",
    accords:["گلی","تمیز","مشکی"],
    notes:{ top:["نارنج","برگ بنفشه"],heart:["یاس","زنبق"],base:["مشک سفید","چوب صندل"]},
    variants:[{volume:30,price:2200000,stock:6},{volume:50,price:3150000,stock:10}],
  },
  {
    id: "demo-003",name: "Fertini — Sillage",subtitle:"AMBER / SPICE — EAU DE PARFUM",
    image:"/maison/amber.jpg",photos:["/maison/amber.jpg","/maison/hero.jpg","/maison/dark.jpg"],
    description:"گرمای ادویه، عمق رزین و امضایی که به‌آرامی در فضا می‌ماند. نمونهٔ یک عطر گرم برای بررسی ظاهر گالری و مشخصات محصول.",
    accords:["گرم","ادویه‌ای","رزینی"],
    notes:{top:["زعفران","دارچین"],heart:["رز","لابدانوم"],base:["وانیل","بنزوئین","عنبر"]},
    variants:[{volume:50,price:3450000,stock:7},{volume:100,price:5350000,stock:3}],
  },
];
