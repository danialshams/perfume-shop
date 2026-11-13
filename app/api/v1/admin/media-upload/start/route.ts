import {NextRequest,NextResponse} from "next/server";
import {requireAdmin} from "@/server/middlewares/admin";
import {validateMediaMeta} from "@/lib/admin-media-validation";
import {localMediaReady} from "@/server/storage/local-media";
export const runtime="nodejs";
export async function POST(request:NextRequest){
 try{await requireAdmin(request)}catch{return NextResponse.json({error:"Forbidden"},{status:403})}
 let body:Record<string,unknown>;
 try{body=await request.json()}catch{return NextResponse.json({error:"JSON نامعتبر"},{status:400})}
 const kind=body.kind==="image"?"image":body.kind==="voice"?"voice":null;
 if(!kind)return NextResponse.json({error:"نوع فایل نامعتبر است"},{status:422});
 const verdict=validateMediaMeta({
  name:String(body.name||""),size:Number(body.size),type:String(body.type||"")
 },kind);
 if(!verdict.ok)return NextResponse.json({error:verdict.error},{status:422});
 if(!localMediaReady()&&process.env.NODE_ENV==="production")
  return NextResponse.json({error:"پوشه دائمی ذخیره‌سازی فایل‌ها در هاست تنظیم نشده است."},{status:503});
 return NextResponse.json({mode:"local"},{headers:{"Cache-Control":"no-store"}});
}
