import {NextRequest,NextResponse} from "next/server";
import {db} from "@/lib/db";
import {requireAdmin} from "@/server/middlewares/admin";
import {isFertiniPublicDemoAdminEnabled} from "@/server/admin-preview-guest";
import type {RowDataPacket} from "mysql2/promise";
export const runtime="nodejs";export const dynamic="force-dynamic";
const send=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{"Cache-Control":"private, no-store"}});
const text=(v:unknown,n:number)=>typeof v==="string"?v.trim().slice(0,n):"";
const idOf=(v:unknown)=>{const n=Number(v);return Number.isSafeInteger(n)&&n>0?n:null};
async function access(req:NextRequest){try{
 await requireAdmin(req);
 if(req.method!=="GET"&&req.method!=="HEAD"){const origin=req.headers.get("origin");if(!origin||new URL(origin).host!==req.nextUrl.host)return false}
 return true;
}catch{return false}}
export async function GET(req:NextRequest){
 if(!await access(req))return send({error:"ورود مدیر الزامی است."},403);
 const view=req.nextUrl.searchParams.get("view");
 try{
  if(view==="reviews"){
   const [rows]=await db.execute<RowDataPacket[]>(`SELECT r.id,r.comment AS body,r.admin_reply AS "adminReply",r.status,r.created_at AS "createdAt",p.name AS "productName" FROM reviews r LEFT JOIN products p ON p.id=r.product_id ORDER BY r.created_at DESC LIMIT 100`);
   return send({items:rows.map(r=>({...r,product:{name:r.productName}}))});
  }
  if(view==="faq"){
   const [items]=await db.execute<RowDataPacket[]>("SELECT id,question,answer,published,created_at FROM support_faq ORDER BY created_at DESC LIMIT 100");
   return send({items});
  }
  if(view==="settings"){
   const [rows]=await db.execute<RowDataPacket[]>(`SELECT welcome,expected_response AS "expectedResponse",working_hours AS "workingHours",enabled FROM support_settings WHERE id=1`);
   return send({item:rows[0]||null});
  }
  if(view==="threads"){
   const [items]=await db.execute<RowDataPacket[]>(`SELECT id,visitor_name AS "visitorName",subject,status,updated_at AS "updatedAt" FROM support_threads${isFertiniPublicDemoAdminEnabled()?" WHERE token_hash LIKE 't%'":""} ORDER BY updated_at DESC LIMIT 80`);
   return send({items});
  }
  if(view==="thread"){
   const id=idOf(req.nextUrl.searchParams.get("id"));if(!id)return send({error:"شناسه نامعتبر."},400);
   const [threads]=await db.execute<RowDataPacket[]>(`SELECT id,visitor_name AS "visitorName",subject,status FROM support_threads WHERE id=?${isFertiniPublicDemoAdminEnabled()?" AND token_hash LIKE 't%'":""}`,[id]);
   if(!threads.length)return send({error:"گفتگو یافت نشد."},404);
   const [messages]=await db.execute<RowDataPacket[]>(`SELECT id,role,body,created_at AS "createdAt" FROM support_messages WHERE thread_id=? ORDER BY created_at ASC LIMIT 150`,[id]);
   return send({thread:threads[0],messages});
  }
  return send({error:"بخش نامعتبر است."},400);
 }catch{return send({error:"دیتابیس در دسترس نیست."},503)}
}
export async function POST(req:NextRequest){
 if(!await access(req))return send({error:"ورود مدیر الزامی است."},403);
 let data:Record<string,unknown>;try{data=await req.json()}catch{return send({error:"داده نامعتبر."},400)}
 const action=text(data.action,50),id=idOf(data.id);
 try{
  if((action==="chatStatus"||action==="chatReply")&&id&&isFertiniPublicDemoAdminEnabled()){
   const [demoThread]=await db.execute<RowDataPacket[]>("SELECT id FROM support_threads WHERE id=? AND token_hash LIKE 't%'",[id]);
   if(!demoThread.length)return send({error:"فقط گفتگوهای آزمایشی در حالت بدون ورود قابل دسترسی هستند."},403);
  }
  if(action==="review"&&id){
   const status=text(data.status,20);
   if(!["PENDING","APPROVED","REJECTED"].includes(status))return send({error:"وضعیت نامعتبر."},422);
   await db.execute("UPDATE reviews SET status=?,is_approved=?,updated_at=NOW() WHERE id=?",[status,status==="APPROVED"?1:0,id]);
   return send({success:true});
  }
  if(action==="reviewReply"&&id){
   await db.execute("UPDATE reviews SET admin_reply=?,updated_at=NOW() WHERE id=?",[text(data.answer,1500)||null,id]);
   return send({success:true});
  }
  if(action==="faqCreate"){
   const question=text(data.question,600),answer=text(data.answer,2000);
   if(question.length<8||!answer)return send({error:"سؤال و پاسخ معتبر لازم است."},422);
   await db.execute("INSERT INTO support_faq(question,answer,published) VALUES(?,?,TRUE)",[question,answer]);
   return send({success:true},201);
  }
  if(action==="faqReply"&&id){
   const answer=text(data.answer,2000);
   if(!answer)return send({error:"برای نمایش سؤال، پاسخ را وارد کنید."},422);
   await db.execute("UPDATE support_faq SET answer=?,published=TRUE,updated_at=NOW() WHERE id=?",[answer,id]);
   return send({success:true});
  }
  if(action==="settings"){
   const welcome=text(data.welcome,250),expectedResponse=text(data.expectedResponse,200),workingHours=text(data.workingHours,250);
   if(!welcome||!expectedResponse)return send({error:"متن خوشامدگویی و زمان پاسخ‌گویی لازم است."},422);
   await db.execute(`INSERT INTO support_settings(id,welcome,expected_response,working_hours,enabled) VALUES(1,?,?,?,?) ON CONFLICT (id) DO UPDATE SET welcome=EXCLUDED.welcome,expected_response=EXCLUDED.expected_response,working_hours=EXCLUDED.working_hours,enabled=EXCLUDED.enabled,updated_at=NOW()`,[welcome,expectedResponse,workingHours,data.enabled!==false]);
   return send({success:true});
  }
  if(action==="chatStatus"&&id){
   const status=text(data.status,20);if(!["OPEN","CLOSED"].includes(status))return send({error:"وضعیت نامعتبر."},422);
   await db.execute("UPDATE support_threads SET status=?,updated_at=NOW() WHERE id=?",[status,id]);return send({success:true});
  }
  if(action==="chatReply"&&id){
   const body=text(data.body,1800);if(!body)return send({error:"پاسخ خالی است."},422);
   const [found]=await db.execute<RowDataPacket[]>("SELECT id FROM support_threads WHERE id=?",[id]);
   if(!found.length)return send({error:"گفتگو پیدا نشد."},404);
   await db.execute("INSERT INTO support_messages(thread_id,role,body) VALUES(?,'ADMIN',?)",[id,body]);
   await db.execute("UPDATE support_threads SET status='OPEN',updated_at=NOW() WHERE id=?",[id]);
   return send({success:true});
  }
  return send({error:"عملیات نامعتبر."},400);
 }catch{return send({error:"ذخیره‌سازی ممکن نیست."},503)}
}
