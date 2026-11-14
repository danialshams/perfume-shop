import {NextRequest,NextResponse} from "next/server";
import {requireAdmin} from "@/server/middlewares/admin";
import {seoConfigSchema,seoAbsolute} from "@/lib/fertini-seo";
import {readSiteContent,writeSiteSeo} from "@/server/site-content";
import {productService} from "@/server/services/product.service";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store"};

async function authorization(request:NextRequest) {
  try {await requireAdmin(request);return null}
  catch {return NextResponse.json({error:"برای ویرایش سئو وارد حساب مدیر شوید."},{status:403,headers})}
}

export async function GET(request:NextRequest){
  const rejected=await authorization(request);if(rejected)return rejected;
  try {
    const content=await readSiteContent();
    const fixed=[
      {path:"/",title:"صفحه اصلی",imageUrl:content.heroSlides[0]?.photo||""},
      {path:"/products",title:"همه عطرها",imageUrl:""},
      {path:"/journal",title:"مجله عطر",imageUrl:""},
      {path:"/journal/how-to-choose-a-fragrance",title:"راهنمای انتخاب عطر",imageUrl:""},
      {path:"/about",title:"درباره ما",imageUrl:""},
      {path:"/contact",title:"تماس با ما",imageUrl:""},
      {path:"/shipping",title:"ارسال سفارش",imageUrl:""},
      {path:"/privacy",title:"حریم خصوصی",imageUrl:""},
      {path:"/terms",title:"قوانین و مقررات",imageUrl:""},
    ];
    let products:Array<{id:number|string;name:string;images?:Array<{image_url:string}>}>=[];
    try {
      const results=await productService.getAll({status:"ACTIVE",is_active:1,withDeleted:false,onlyDeleted:false},{page:1,limit:300});
      products=results.items;
    } catch {}
    const items=[...fixed,...products.map(p=>({
      path:"/products/"+p.id,title:p.name,imageUrl:p.images?.[0]?.image_url||""
    }))];
    return NextResponse.json({seo:content.seo,items}, {headers});
  } catch {
    return NextResponse.json({error:"خواندن تنظیمات سئو ممکن نشد؛ اتصال PostgreSQL را بررسی کنید."},{status:503,headers});
  }
}

export async function PUT(request:NextRequest){
  const rejected=await authorization(request);if(rejected)return rejected;
  let raw:unknown;
  try{raw=await request.json()}catch{return NextResponse.json({error:"داده‌های ارسالی معتبر نیستند."},{status:400,headers})}
  const checked=seoConfigSchema.safeParse(raw);
  if(!checked.success) return NextResponse.json({
    error:"بعضی تنظیمات سئو نامعتبر هستند.",
    issues:checked.error.issues.map(issue=>({path:issue.path.join("."),message:issue.message})),
  },{status:422,headers});
  if(checked.data.indexSite&&!checked.data.siteUrl.trim())
    return NextResponse.json({error:"ابتدا دامنه اصلی را مشخص کنید."},{status:422,headers});
  // Domain and social URLs must remain HTTPS; schema validates these.
  // Do not allow a canonical override that points to the private admin panel.
  for(const [route,page] of Object.entries(checked.data.pages)){
    const canonical=page.canonical;
    if(canonical && seoAbsolute(canonical,checked.data).includes("/admin/"))
      return NextResponse.json({error:"آدرس کانونیکال صفحات نباید به پنل مدیریت اشاره کند: "+route},{status:422,headers});
  }
  try {
    const saved=await writeSiteSeo(checked.data);
    return NextResponse.json({saved:true,seo:saved},{headers});
  } catch {
    return NextResponse.json({error:"ذخیره تنظیمات سئو در PostgreSQL انجام نشد."},{status:503,headers});
  }
}
