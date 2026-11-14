import {NextRequest,NextResponse} from "next/server";
import {requireAdmin} from "@/server/middlewares/admin";
import {campaignsSchema,musicSchema,shippingSchema} from "@/lib/fertini-site-content";
import {readSiteContent,writeStoreSettings} from "@/server/site-content";
import {listHomeProducts} from "@/server/home-catalog";
export const runtime="nodejs";export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store"};
async function authorized(req:NextRequest){try{await requireAdmin(req);return true}catch{return false}}
export async function GET(req:NextRequest){
 if(!await authorized(req))return NextResponse.json({error:"ورود مدیر لازم است."},{status:403});
 try{
  const [content,products]=await Promise.all([readSiteContent(),listHomeProducts()]);
  return NextResponse.json({campaigns:content.campaigns,shipping:content.shipping,music:content.music,products},{headers});
 }catch{return NextResponse.json({error:"دریافت تنظیمات فروشگاه ممکن نشد."},{status:503,headers})}
}
export async function PUT(req:NextRequest){
 if(!await authorized(req))return NextResponse.json({error:"ورود مدیر لازم است."},{status:403});
 let input:Record<string,unknown>;
 try{input=await req.json()}catch{return NextResponse.json({error:"درخواست معتبر نیست."},{status:400,headers})}
 const kind=input.kind;
 if(kind!=="campaigns"&&kind!=="shipping"&&kind!=="music")return NextResponse.json({error:"تنظیمات نامعتبر است."},{status:422,headers});
 const schema=kind==="campaigns"?campaignsSchema:kind==="shipping"?shippingSchema:musicSchema;
 const parsed=schema.safeParse(input.value);
 if(!parsed.success)return NextResponse.json({error:"فیلدهای تنظیمات معتبر نیستند.",issues:parsed.error.issues},{status:422,headers});
 try{
  if(kind==="campaigns"){
   const products=await listHomeProducts();
   const allowed=new Set(products.map(p=>p.id));
   const campaigns=campaignsSchema.parse(parsed.data);
   if(campaigns.some(c=>c.productIds.some(id=>!allowed.has(id))))return NextResponse.json({error:"فقط عطرهای منتشرشده فروشگاه را می‌توان در کمپین گذاشت."},{status:422,headers});
   const saved=await writeStoreSettings("campaigns",campaigns);
   return NextResponse.json({saved:true,value:saved},{headers});
  }
  if(kind==="shipping"){
   const saved=await writeStoreSettings("shipping",shippingSchema.parse(parsed.data));
   return NextResponse.json({saved:true,value:saved},{headers});
  }
  const saved=await writeStoreSettings("music",musicSchema.parse(parsed.data));
  return NextResponse.json({saved:true,value:saved},{headers});
 }catch{return NextResponse.json({error:"ذخیره در دیتابیس انجام نشد."},{status:503,headers})}
}
