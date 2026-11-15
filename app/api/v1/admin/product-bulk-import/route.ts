import {NextRequest,NextResponse} from "next/server";
import {z} from "zod";
import {requireAuth} from "@/server/middlewares/auth";
import {productService} from "@/server/services/product.service";
import {scentFamilyService} from "@/server/services/scent-family.service";
import {createProductSchema,updateProductSchema} from "@/server/validations/product.validation";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const image=z.string().trim().max(2000).refine(value=>
 /^\/(?!\/)(?!.*\.\.)[^\s\\]+$/.test(value)||/^https:\/\/[^\s\\]+$/i.test(value),
 "آدرس تصویر باید HTTPS یا مسیر معتبر همین سایت باشد.");
const rowSchema=z.object({
 sku:z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/,"شناسه انگلیسی محصول معتبر نیست"),
 name:z.string().trim().min(2).max(190),
 group:z.string().trim().min(2).max(120),
 type:z.enum(["SINGLE","GROUPED"]),
 volume_ml:z.number().int().min(1).max(5000),
 price:z.number().positive().max(9999999999),
 discount_price:z.number().positive().nullable().optional(),
 stock_qty:z.number().int().nonnegative().max(10000000),
 images:z.array(image).min(1).max(12),
 main_image:image.optional(),
 description:z.string().trim().max(5000).optional().default(""),
 is_best_seller:z.boolean().optional().default(false),
});
const payloadSchema=z.object({
 rows:z.array(rowSchema).min(1).max(1000),
 action:z.enum(["preview","import"]),
 existing:z.enum(["skip","update"]).default("skip"),
 confirm:z.boolean().optional(),
}).strict();

type ProductRow=z.infer<typeof rowSchema>;
type ProductGroup={sku:string;name:string;group:string;type:"SINGLE"|"GROUPED";description:string;is_best_seller:boolean;
 images:{image_url:string;is_main:boolean}[];
 variants:{volume_ml:number;price:number;discount_price:number|null;stock_qty:number;is_active:boolean;
 images:{image_url:string;is_main:boolean}[]}[]};
function pack(rows:ProductRow[]) {
 const map=new Map<string,ProductGroup>();
 const failures:{line:number;reason:string}[]=[];
 for(const [n,row] of rows.entries()){
  if(row.discount_price!=null&&row.discount_price>=row.price){
   failures.push({line:n+2,reason:"قیمت تخفیف باید از قیمت اصلی کمتر باشد."});continue;
  }
  let group=map.get(row.sku);
  if(!group){
   const main=row.main_image??row.images[0];
   if(!row.images.includes(main)){failures.push({line:n+2,reason:"تصویر اصلی در فهرست تصاویر نیست."});continue;}
   group={sku:row.sku,name:row.name,group:row.group,type:row.type,description:row.description,
    is_best_seller:row.is_best_seller,
    images:row.images.map(url=>({image_url:url,is_main:url===main})),variants:[]};
   map.set(row.sku,group);
  }
  if(group.name!==row.name||group.group!==row.group||group.type!==row.type){
   failures.push({line:n+2,reason:"شناسه یکسان با نام، نوع یا گروه بویایی متفاوت ثبت شده."});continue;
  }
  if(group.variants.some(v=>v.volume_ml===row.volume_ml)){
   failures.push({line:n+2,reason:"حجم تکراری برای همین محصول مجاز نیست."});continue;
  }
  if(row.type==="SINGLE"&&group.variants.length>0){
   failures.push({line:n+2,reason:"عطر تکی فقط یک حجم و قیمت دارد."});continue;
  }
  const main=row.main_image??row.images[0];
  group.variants.push({volume_ml:row.volume_ml,price:row.price,
   discount_price:row.discount_price??null,stock_qty:row.stock_qty,is_active:true,
   images:row.type==="GROUPED"?row.images.map(url=>({image_url:url,is_main:url===main})):[]});
 }
 return {products:[...map.values()],failures};
}
const noCache={"Cache-Control":"private, no-store"};
/** Explicit admin bulk action; no public preview/demo account may edit inventory. */
export async function POST(request:NextRequest){
 const origin=request.headers.get("origin");
 const allowedOrigins=new Set([
  request.nextUrl.origin,
  process.env.APP_URL?new URL(process.env.APP_URL).origin:"",
  process.env.NEXT_PUBLIC_SITE_URL?new URL(process.env.NEXT_PUBLIC_SITE_URL).origin:"",
 ].filter(Boolean));
 allowedOrigins.add("https://fertiniperfume.com");
 if(process.env.CI==="true"&&process.env.FERTINI_PG_TEST==="isolated-disposable")
  allowedOrigins.add("http://127.0.0.1:3211");
 if(!origin||!allowedOrigins.has(origin))
  return NextResponse.json({error:"مبدأ درخواست معتبر نیست."},{status:403,headers:noCache});
 try{const admin=await requireAuth(request);if(admin.role!=="ADMIN")throw Error("Forbidden");}
 catch{return NextResponse.json({error:"ورود مدیر واقعی الزامی است."},{status:401,headers:noCache});}
 if(!request.headers.get("content-type")?.startsWith("application/json"))
  return NextResponse.json({error:"قالب درخواست معتبر نیست."},{status:415,headers:noCache});
 const body=await request.json().catch(()=>null);
 const parsed=payloadSchema.safeParse(body);
 if(!parsed.success)return NextResponse.json({
  error:"اطلاعات فایل معتبر نیست.",issues:parsed.error.issues.slice(0,25).map(v=>v.message)
 },{status:422,headers:noCache});
 const {products,failures}=pack(parsed.data.rows);
 if(failures.length)return NextResponse.json({ok:false,errors:failures,products:products.length},
  {status:422,headers:noCache});
 if(parsed.data.action==="preview"){
  // Preview never writes to the DB.
  const results=await Promise.all(products.map(async p=>({
   sku:p.sku,name:p.name,models:p.variants.length,
   existing:Boolean(await productService.getByIdOrSlug(p.sku))
  })));
  return NextResponse.json({ok:true,products:results,total:results.length},{headers:noCache});
 }
 if(parsed.data.confirm!==true)return NextResponse.json({error:"تأیید عملیات لازم است."},{status:400,headers:noCache});
 const created:string[]=[],updated:string[]=[],skipped:string[]=[],errors:{sku:string;reason:string}[]=[];
 let families=await scentFamilyService.getList();
 for(const item of products){
  try{
   let family=families.find(x=>x.name.trim()===item.group);
   if(!family){
    family=await scentFamilyService.create({name:item.group,image_url:"",is_active:true,sort_order:families.length});
    if(!family)throw Error("ساخت گروه بویایی ناموفق بود.");
    families=[...families,family];
   }
   const current=await productService.getByIdOrSlug(item.sku);
   if(current&&parsed.data.existing==="skip"){skipped.push(item.sku);continue;}
   const base={
    name:item.name,description:item.description,scent_family_id:Number(family.id),
    is_active:true,is_best_seller:item.is_best_seller,
    images:item.images,variants:item.variants,
   };
   if(current){
    const checked=updateProductSchema.parse({...base,type:item.type});
    await productService.update(Number(current.id),checked);
    updated.push(item.sku);
   }else{
    const checked=createProductSchema.parse({...base,slug:item.sku,type:item.type,
     is_featured:false,status:"ACTIVE" as const,
     category_id:null,parent_category_id:null,category_links:[]});
    await productService.create(checked);
    created.push(item.sku);
   }
  }catch(e){console.error("bulk catalog record import",item.sku,e);
    errors.push({sku:item.sku,reason:"ثبت این محصول انجام نشد. نام، گروه بویایی، حجم و شناسه را بررسی کنید."});}
 }
 return NextResponse.json({ok:errors.length===0,created,updated,skipped,errors},
  {status:errors.length?207:200,headers:noCache});
}
