import {NextRequest,NextResponse} from "next/server";
import {requireAdmin} from "@/server/middlewares/admin";
import {contentSchema} from "@/lib/fertini-site-content";
import {readSiteContent,writeSiteContent} from "@/server/site-content";
export const dynamic="force-dynamic";
export const runtime="nodejs";
export async function GET(request:NextRequest){
 try{await requireAdmin(request)}catch{return NextResponse.json({error:"Forbidden"},{status:403})}
 try{return NextResponse.json({content:await readSiteContent()},{headers:{"Cache-Control":"no-store"}})}
 catch{return NextResponse.json({error:"برای ذخیره محتوای سایت، اتصال دیتابیس و migration شماره ۰۰۲ لازم است."},{status:503})}
}
export async function PUT(request:NextRequest){
 try{await requireAdmin(request)}catch{return NextResponse.json({error:"Forbidden"},{status:403})}
 let raw:unknown;
 try{raw=await request.json()}catch{return NextResponse.json({error:"JSON نامعتبر"},{status:400})}
 const checked=contentSchema.safeParse(raw);
 if(!checked.success)return NextResponse.json({error:"محتوا معتبر نیست",details:checked.error.flatten()},{status:422});
 try{await writeSiteContent(checked.data);
 return NextResponse.json({content:checked.data,saved:true},{headers:{"Cache-Control":"no-store"}})}
 catch{return NextResponse.json({error:"ذخیره به دیتابیس ممکن نشد؛ تغییری روی سایت ثبت نشد."},{status:503})}
}
