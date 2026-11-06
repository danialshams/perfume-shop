import {NextRequest,NextResponse} from "next/server";
import {requireAdmin} from "@/server/middlewares/admin";
import {verifySession,validateStoredObject} from "@/server/storage/presigned-admin-media";
export const runtime="nodejs";
export async function POST(request:NextRequest){
 let user;try{user=await requireAdmin(request)}catch{return NextResponse.json({error:"Forbidden"},{status:403})}
 let body:Record<string,unknown>;
 try{body=await request.json()}catch{return NextResponse.json({error:"JSON نامعتبر"},{status:400})}
 try{
  const info=verifySession(String(body.session||""),user.userId);
  const url=await validateStoredObject(info);
  return NextResponse.json({url,file_name:info.key,size:info.size,mime_type:info.mime},
   {headers:{"Cache-Control":"no-store"}});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"تأیید فایل ممکن نشد."},{status:422})}
}
