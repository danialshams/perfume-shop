import {NextRequest,NextResponse} from "next/server";
import {db} from "@/lib/db";
import {requireAdmin} from "@/server/middlewares/admin";
import type {RowDataPacket,ResultSetHeader} from "mysql2/promise";
export const runtime="nodejs";export const dynamic="force-dynamic";
type Context={params:Promise<{resource:string}>};
type Resource="customers"|"coupons"|"reviews"|"payments"|"brands";
const known=new Set<Resource>(["customers","coupons","reviews","payments","brands"]);
const queries:Record<Resource,string>={
 customers:`SELECT id,full_name,email,phone,status,created_at,last_login_at FROM users WHERE role='USER' AND deleted_at IS NULL ORDER BY id DESC LIMIT ? OFFSET ?`,
 coupons:`SELECT id,code,title,discount_type,discount_value,min_order_amount,usage_limit,used_count,expires_at,status,created_at FROM coupons ORDER BY id DESC LIMIT ? OFFSET ?`,
 reviews:`SELECT r.id,r.product_id,p.name AS product_name,u.full_name AS customer_name,r.rating,r.title,r.comment,r.status,r.created_at FROM reviews r LEFT JOIN products p ON p.id=r.product_id LEFT JOIN users u ON u.id=r.user_id ORDER BY r.id DESC LIMIT ? OFFSET ?`,
 payments:`SELECT p.id,p.order_id,o.order_number,o.customer_name,p.provider,p.ref_id,p.amount,p.status,p.created_at,p.paid_at FROM payments p LEFT JOIN orders o ON o.id=p.order_id ORDER BY p.id DESC LIMIT ? OFFSET ?`,
 brands:`SELECT id,name,slug,country,status,is_active,created_at FROM brands WHERE deleted_at IS NULL ORDER BY id DESC LIMIT ? OFFSET ?`
};
const send=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{"Cache-Control":"private, no-store"}});
async function guard(req:NextRequest){try{await requireAdmin(req);return true}catch{return false}}
function resourceOf(x:string):Resource|null{return known.has(x as Resource)?x as Resource:null}
export async function GET(req:NextRequest,{params}:Context){
 if(!await guard(req))return send({error:"دسترسی مدیر لازم است."},403);
 const resource=resourceOf((await params).resource);if(!resource)return send({error:"بخش نامعتبر است."},404);
 const page=Math.max(1,Math.min(100000,Number(req.nextUrl.searchParams.get("page")||1)||1));
 const limit=Math.max(1,Math.min(50,Number(req.nextUrl.searchParams.get("limit")||30)||30));
 try{
  const [rows]=await db.execute<RowDataPacket[]>(queries[resource],[limit,(page-1)*limit]);
  return send({items:rows,page,limit,hasNext:rows.length===limit});
 }catch{return send({error:"دریافت اطلاعات از دیتابیس ممکن نشد."},503)}
}
export async function POST(req:NextRequest,{params}:Context){
 if(!await guard(req))return send({error:"دسترسی مدیر لازم است."},403);
 const resource=resourceOf((await params).resource);
 if(resource!=="coupons"&&resource!=="brands")return send({error:"ایجاد رکورد برای این بخش مجاز نیست."},405);
 let body:Record<string,unknown>;try{body=await req.json()}catch{return send({error:"بدنه نامعتبر است."},400)}
 try{
  if(resource==="coupons"){
   const code=String(body.code||"").trim().toUpperCase();
   const title=String(body.title||"").trim().slice(0,150);
   const discount_type=body.discount_type==="PERCENT"?"PERCENT":body.discount_type==="FIXED"?"FIXED":null;
   const value=Number(body.discount_value);
   if(!/^[A-Z0-9_-]{3,40}$/.test(code)||!discount_type||!Number.isFinite(value)||value<=0||(discount_type==="PERCENT"&&value>100))
    return send({error:"کد یا مقدار تخفیف نامعتبر است."},422);
   const [result]=await db.execute<ResultSetHeader>(
    "INSERT INTO coupons (code,title,discount_type,discount_value,status) VALUES (?,?,?,?,'ACTIVE')",
    [code,title||null,discount_type,value]);
   return send({id:result.insertId,created:true},201);
  }
  const name=String(body.name||"").trim(),slug=String(body.slug||"").toLowerCase().trim();
  if(name.length<2||name.length>120||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||slug.length>160)
   return send({error:"نام یا شناسه برند نامعتبر است."},422);
  const [result]=await db.execute<ResultSetHeader>(
   "INSERT INTO brands (name,slug,status,is_active) VALUES (?,?,'INACTIVE',0)",[name,slug]);
  return send({id:result.insertId,created:true},201);
 }catch(e){
  if(e instanceof Error&&/Duplicate entry/i.test(e.message))return send({error:"این کد یا شناسه قبلاً ثبت شده است."},409);
  return send({error:"ایجاد رکورد در دیتابیس ممکن نشد."},503);
 }
}
export async function PATCH(req:NextRequest,{params}:Context){
 if(!await guard(req))return send({error:"دسترسی مدیر لازم است."},403);
 const resource=resourceOf((await params).resource);
 if(!resource||resource==="payments")return send({error:"ویرایش این بخش مجاز نیست؛ پرداخت فقط از درگاه معتبر تأیید می‌شود."},405);
 let body:Record<string,unknown>;try{body=await req.json()}catch{return send({error:"بدنه نامعتبر است."},400)}
 const id=Number(body.id),status=String(body.status||"");
 if(!Number.isSafeInteger(id)||id<1)return send({error:"شناسه نامعتبر است."},422);
 try{
  let query:string,params:(number|string)[];
  if(resource==="customers"){
   if(!["ACTIVE","BLOCKED"].includes(status))return send({error:"وضعیت نامعتبر است."},422);
   query="UPDATE users SET status=?,is_active=? WHERE id=? AND role='USER' AND deleted_at IS NULL";
   params=[status,status==="ACTIVE"?1:0,id];
  }else if(resource==="reviews"){
   if(!["PENDING","APPROVED","REJECTED"].includes(status))return send({error:"وضعیت نامعتبر است."},422);
   query="UPDATE reviews SET status=?,is_approved=? WHERE id=?";params=[status,status==="APPROVED"?1:0,id];
  }else if(resource==="coupons"){
   if(!["ACTIVE","INACTIVE"].includes(status))return send({error:"وضعیت نامعتبر است."},422);
   query="UPDATE coupons SET status=? WHERE id=?";params=[status,id];
  }else {
   if(!["ACTIVE","INACTIVE"].includes(status))return send({error:"وضعیت نامعتبر است."},422);
   query="UPDATE brands SET status=?,is_active=? WHERE id=? AND deleted_at IS NULL";
   params=[status,status==="ACTIVE"?1:0,id];
  }
  const [res]=await db.execute<ResultSetHeader>(query,params);
  return res.affectedRows?send({updated:true,id,status}):send({error:"رکورد پیدا نشد."},404);
 }catch{return send({error:"ذخیره تغییرات ممکن نشد."},503)}
}
