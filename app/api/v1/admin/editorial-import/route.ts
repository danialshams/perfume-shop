import {NextRequest, NextResponse} from "next/server";
import {requireAuth} from "@/server/middlewares/auth";
import {productService} from "@/server/services/product.service";
import {scentFamilyService} from "@/server/services/scent-family.service";
import {createProductSchema} from "@/server/validations/product.validation";
import {
 FERTINI_EDITORIAL_FRAGRANCES,FERTINI_EDITORIAL_FAMILIES,
 type EditorialFamily
} from "@/lib/fertini-editorial-collection";

export const runtime="nodejs";
export const dynamic="force-dynamic";

const families:EditorialFamily[]=["woody","oud","vanilla"];
const slugPrefix="fertini-editorial-";

/** Only server-maintained image URLs can enter the import, never user input. */
function storedPhoto(url:string):string {
 const parsed=new URL(url,"https://fertiniperfume.com");
 if(parsed.origin!=="https://fertiniperfume.com" ||
    !/^\/api\/v1\/editorial\/[a-z0-9-]+\.webp$/.test(parsed.pathname))
  throw Error("Invalid bundled editorial photograph");
 return parsed.pathname;
}

/**
 * One deliberate, real-ADMIN-only import from the curated photo gallery into
 * the actual PostgreSQL product service, which populates the admin panel too.
 * Stock is ZERO: imported concept prices are not treated as saleable stock.
 * This endpoint is never called by a public homepage view or Cron deployment.
 *
 * Repeated requests skip existing editorial slugs, so partial retries are safe.
 */
export async function POST(request:NextRequest) {
 const origin=request.headers.get("origin");
 const allowedOrigins=new Set([
  request.nextUrl.origin,
  process.env.APP_URL?new URL(process.env.APP_URL).origin:"",
  process.env.NEXT_PUBLIC_SITE_URL?new URL(process.env.NEXT_PUBLIC_SITE_URL).origin:"",
 ].filter(Boolean));
 if(!origin||!allowedOrigins.has(origin))
  return NextResponse.json({error:"Origin not allowed"},{status:403});

 let admin;
 try{admin=await requireAuth(request);}
 catch{return NextResponse.json({error:"ورود مدیر واقعی برای ثبت محصولات لازم است."},{status:401})}
 if(admin.role!=="ADMIN")
  return NextResponse.json({error:"فقط مدیر می‌تواند این عملیات را اجرا کند."},{status:403});
 if(!request.headers.get("content-type")?.startsWith("application/json"))
  return NextResponse.json({error:"Invalid content type"},{status:415});
 const body=await request.json().catch(()=>null);
 if(body?.confirm!==true)
  return NextResponse.json({error:"تأیید صریح مدیر لازم است."},{status:400});

 const created:{slug:string;id:number}[]=[];
 const skipped:string[]=[];
 try{
  const known=await scentFamilyService.getList();
  const familyIds=new Map<EditorialFamily,number>();
  for(const [index,key] of families.entries()){
   const family=FERTINI_EDITORIAL_FAMILIES[key];
   const existing=known.find(x=>x.name.trim()===family.name.trim());
   const record=existing??await scentFamilyService.create({
    name:family.name,image_url:storedPhoto(family.photo),is_active:true,sort_order:index
   });
   if(!record?.id)throw Error("Could not resolve scent family "+key);
   familyIds.set(key,Number(record.id));
  }

  for(const [index,item] of FERTINI_EDITORIAL_FRAGRANCES.entries()){
   const slug=slugPrefix+item.slug;
   const existing=await productService.getByIdOrSlug(slug);
   if(existing){skipped.push(item.slug);continue}
   const familyId=familyIds.get(item.family);
   if(!familyId)throw Error("Missing scent family for "+item.slug);
   const data={
    type:"SINGLE" as const,
    name:item.name,
    slug,description:item.description,
    category_id:null,parent_category_id:null,category_links:[],
    scent_family_id:familyId,
    is_active:true,
    status:"ACTIVE" as const,
    is_featured:index<3,
    is_best_seller:index<3,
    images:[{image_url:storedPhoto(item.image),is_main:true}],
    variants:[{
      volume_ml:50,price:item.price,discount_price:null,
      stock_qty:0,is_active:true,images:[]
    }],
  };
   const validated=createProductSchema.parse(data);
   const saved=await productService.create(validated);
   if(!saved?.id)throw Error("Product insert returned no id for "+item.slug);
   created.push({slug:item.slug,id:Number(saved.id)});
  }
  return NextResponse.json({ok:true,created,skipped,stock:"zero",total:6},
   {headers:{"Cache-Control":"no-store"}});
 }catch(error){
  // Do not leak connection strings or private DB information in public errors.
  console.error("editorial import failed",error);
  return NextResponse.json({
    ok:false,
    error:"ثبت کامل نشد. موارد ثبت‌شده حفظ شدند؛ اجرای دوباره موارد تکراری را رد می‌کند.",
    created,skipped
  },{status:500,headers:{"Cache-Control":"no-store"}});
 }
}
