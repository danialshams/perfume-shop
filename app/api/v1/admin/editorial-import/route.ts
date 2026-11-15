import {NextRequest, NextResponse} from "next/server";
import {requireAuth} from "@/server/middlewares/auth";
import {syncCuratedCatalog} from "@/server/curated-catalog-sync";

export const runtime="nodejs";
export const dynamic="force-dynamic";

export async function POST(request:NextRequest) {
 const origin=request.headers.get("origin");
 const allowedOrigins=new Set([
  request.nextUrl.origin,
  process.env.APP_URL?new URL(process.env.APP_URL).origin:"",
  process.env.NEXT_PUBLIC_SITE_URL?new URL(process.env.NEXT_PUBLIC_SITE_URL).origin:"",
 ].filter(Boolean));
 // GitHub Actions runs the disposable PostgreSQL integration server on an
 // IP loopback that Next may normalize to localhost. This exception exists
 // ONLY in the isolated CI database, never on a real hosted deployment.
 if(process.env.CI==="true" &&
    process.env.FERTINI_PG_TEST==="isolated-disposable")
   allowedOrigins.add("http://127.0.0.1:3211");
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

 try{
  const result=await syncCuratedCatalog();
  return NextResponse.json({ok:true,...result},{headers:{"Cache-Control":"no-store"}});
 }catch(error){
  // Do not leak connection strings or private DB information in public errors.
  console.error("editorial import failed",error);
  return NextResponse.json({
    ok:false,
    error:"ثبت کامل نشد. موارد ثبت‌شده حفظ شدند؛ اجرای دوباره موارد تکراری را رد می‌کند.",
  },{status:500,headers:{"Cache-Control":"no-store"}});
 }
}
