import {NextRequest,NextResponse} from "next/server";
import {requireAdmin} from "@/server/middlewares/admin";
import {validateMediaMeta} from "@/lib/admin-media-validation";
import {issueSession} from "@/server/storage/presigned-admin-media";
import {storageReady} from "@/server/storage/s3-object";
import {localMediaReady} from "@/server/storage/local-media";
export const runtime="nodejs";
export async function POST(request:NextRequest){
 let user;try{user=await requireAdmin(request)}catch{return NextResponse.json({error:"Forbidden"},{status:403})}
 let body:Record<string,unknown>;
 try{body=await request.json()}catch{return NextResponse.json({error:"JSON نامعتبر"},{status:400})}
 const kind=body.kind==="image"?"image":body.kind==="voice"?"voice":null;
 if(!kind)return NextResponse.json({error:"نوع فایل نامعتبر است"},{status:422});
 const name=String(body.name||"");
 const size=Number(body.size);
 const mime=String(body.type||"");
 const verdict=validateMediaMeta({name,size,type:mime},kind);
 if(!verdict.ok)return NextResponse.json({error:verdict.error},{status:422});
 if(!storageReady()){
  if(process.env.VERCEL!=="1"&&localMediaReady())return NextResponse.json({mode:"local"},{headers:{"Cache-Control":"no-store"}});
  return NextResponse.json({error:"فضای ذخیره‌سازی تنظیم نشده است؛ S3 یا LOCAL_MEDIA_STORAGE_DIR را فعال کنید."},{status:503});
 }
 try{return NextResponse.json(issueSession(kind,name,size,verdict.mime,user.userId),{headers:{"Cache-Control":"no-store"}})}
 catch{return NextResponse.json({error:"صدور اجازه آپلود ممکن نیست."},{status:503})}
}
