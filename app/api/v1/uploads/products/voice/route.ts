import {NextRequest} from "next/server";
import {requireAdmin} from "@/server/middlewares/admin";
import {successResponse,errorResponse} from "@/lib/response";
import {saveMedia} from "@/server/storage/save-media";
import {StorageNotConfiguredError} from "@/server/storage/local-media";
export const runtime="nodejs";
export async function POST(request:NextRequest){
 try{await requireAdmin(request)}catch{return errorResponse("دسترسی مدیر لازم است.",403)}
 try{
  const data=await request.formData(),file=data.get("file");
  if(!(file instanceof File))return errorResponse("فایل ارسال نشده است.",400);
  const saved=await saveMedia(file,"voice");
  if(!saved.ok)return errorResponse(saved.error,saved.status);
  return successResponse(saved,"فایل ذخیره شد",201);
 }catch(e){
  if(e instanceof StorageNotConfiguredError)return errorResponse(e.message,503);
  console.error("[ADMIN_UPLOAD]",e instanceof Error?e.name:"unknown");
  return errorResponse("آپلود فایل ناموفق بود.",500);
 }
}
