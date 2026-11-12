import {NextRequest,NextResponse} from "next/server";
import {createHash,randomBytes} from "node:crypto";
import {db} from "@/lib/db";
import type {RowDataPacket,ResultSetHeader} from "mysql2/promise";
export const runtime="nodejs";export const dynamic="force-dynamic";
const send=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"private, no-store"}});
const text=(x:unknown,limit:number)=>typeof x==="string"?x.trim().slice(0,limit):"";
const hash=(value:string)=>createHash("sha256").update(value).digest("hex");
const idOf=(x:unknown)=>{const v=Number(x);return Number.isSafeInteger(v)&&v>0?v:null};
async function threadOf(req:NextRequest,id:number|null){
 if(!id)return false;const token=req.headers.get("x-support-token")||"";
 if(!/^[A-Za-z0-9_-]{30,100}$/.test(token))return false;
 const [rows]=await db.execute<RowDataPacket[]>("SELECT id,status FROM support_threads WHERE id=? AND token_hash=? LIMIT 1",[id,hash(token)]);
 return rows[0]||false;
}
export async function GET(req:NextRequest){
 const type=req.nextUrl.searchParams.get("type");
 try{
  if(type==="settings"){
   const [r]=await db.execute<RowDataPacket[]>('SELECT welcome,expected_response AS "expectedResponse",working_hours AS "workingHours",enabled FROM support_settings WHERE id=1');
   return send(r[0]||{welcome:"به گالری فرتینی خوش آمدید؛ چه رایحه‌ای در ذهن دارید؟",expectedResponse:"مشاور فرتینی در اولین فرصت پاسخ می‌دهد.",workingHours:"",enabled:true});
  }
  if(type==="faq"){
   const [items]=await db.execute<RowDataPacket[]>('SELECT id,question,answer FROM support_faq WHERE published=TRUE AND answer IS NOT NULL ORDER BY updated_at DESC LIMIT 40');
   return send({items});
  }
  if(type==="reviews"){
   const id=idOf(req.nextUrl.searchParams.get("productId"));if(!id)return send({error:"محصول مشخص نیست."},400);
   const [items]=await db.execute<RowDataPacket[]>(`SELECT id,'مهمان' AS author,comment AS body,admin_reply AS "adminReply",created_at AS "createdAt" FROM reviews WHERE product_id=? AND status='APPROVED' AND is_approved=1 ORDER BY created_at DESC LIMIT 60`,[id]);
   return send({items});
  }
  if(type==="related"){
   const id=idOf(req.nextUrl.searchParams.get("productId"));if(!id)return send({items:[]});
   const [items]=await db.execute<RowDataPacket[]>(`SELECT p.id,p.name,p.price,p.scent_family_id AS "scentFamilyId",sf.name AS "scentFamily",COALESCE((SELECT pi.image_url FROM product_images pi WHERE pi.product_id=p.id ORDER BY pi.is_main DESC,pi.id LIMIT 1),p.image) AS image
    FROM products p JOIN scent_families sf ON sf.id=p.scent_family_id
    WHERE p.scent_family_id=(SELECT scent_family_id FROM products WHERE id=? AND deleted_at IS NULL) AND p.id<>?
    AND p.is_active=1 AND p.deleted_at IS NULL AND sf.is_active=1
    ORDER BY p.is_best_seller DESC,p.is_featured DESC,p.id DESC LIMIT 4`,[id,id]);
   return send({items});
  }
  if(type==="messages"){
   const id=idOf(req.nextUrl.searchParams.get("threadId"));const thread=await threadOf(req,id);
   if(!thread)return send({error:"گفتگو معتبر نیست."},403);
   const [messages]=await db.execute<RowDataPacket[]>('SELECT id,role,body,created_at AS "createdAt" FROM support_messages WHERE thread_id=? ORDER BY created_at ASC LIMIT 150',[id!]);
   return send({messages,status:thread.status});
  }
  return send({error:"درخواست معتبر نیست."},400);
 }catch{return send({error:"داده‌های فروشگاه در دسترس نیست."},503)}
}
export async function POST(req:NextRequest){
 let data:Record<string,unknown>;try{data=await req.json()}catch{return send({error:"درخواست نامعتبر است."},400)}
 const action=text(data.action,24);
 try{
  if(action==="review"){
   const productId=idOf(data.productId),body=text(data.text,1200);
   if(!productId||body.length<5)return send({error:"متن دیدگاه را کامل بنویسید."},422);
   const [p]=await db.execute<RowDataPacket[]>("SELECT id FROM products WHERE id=? AND is_active=1 AND deleted_at IS NULL",[productId]);
   if(!p.length)return send({error:"محصول پیدا نشد."},404);
   const [duplicate]=await db.execute<RowDataPacket[]>("SELECT COUNT(*) AS amount FROM reviews WHERE product_id=? AND comment=? AND created_at>NOW()-INTERVAL '1 day'",[productId,body]);
   if(Number(duplicate[0]?.amount)>0)return send({error:"این دیدگاه قبلاً ثبت شده است."},409);
   await db.execute("INSERT INTO reviews (user_id,product_id,rating,comment,status,is_approved) VALUES(NULL,?,0,?,'PENDING',0)",[productId,body]);
   return send({success:true,message:"دیدگاه شما برای بررسی ثبت شد."},201);
  }
  if(action==="faq"){
   const question=text(data.question,600);if(question.length<8)return send({error:"سؤال را کامل‌تر بنویسید."},422);
   await db.execute("INSERT INTO support_faq (question,published) VALUES (?,FALSE)",[question]);
   return send({success:true,message:"سؤال برای بررسی مدیر ثبت شد."},201);
  }
  if(action==="start"){
   const name=text(data.name,60),subject=text(data.subject,100);if(name.length<2||subject.length<2)return send({error:"نام و موضوع را وارد کنید."},422);
   const [cfg]=await db.execute<RowDataPacket[]>("SELECT enabled FROM support_settings WHERE id=1");
   if(cfg[0]?.enabled===false)return send({error:"شروع چت موقتاً غیرفعال است."},403);
   const token=randomBytes(32).toString("base64url");
   const [record]=await db.execute<ResultSetHeader>("INSERT INTO support_threads(visitor_name,subject,token_hash) VALUES(?,?,?)",[name,subject,hash(token)]);
   return send({threadId:String(record.insertId),token},201);
  }
  if(action==="message"){
   const id=idOf(data.threadId),body=text(data.message,1800);if(!id||!body)return send({error:"متن پیام لازم است."},422);
   const thread=await threadOf(req,id);
   if(!thread)return send({error:"گفتگو معتبر نیست."},403);
   if(thread.status==="CLOSED")return send({error:"گفتگو بسته شده است."},409);
   const [count]=await db.execute<RowDataPacket[]>("SELECT COUNT(*) AS n FROM support_messages WHERE thread_id=? AND role='VISITOR' AND created_at>NOW()-INTERVAL '10 minutes'",[id]);
   if(Number(count[0]?.n)>=25)return send({error:"لطفاً چند دقیقه بعد دوباره پیام بفرستید."},429);
   await db.execute("INSERT INTO support_messages(thread_id,role,body) VALUES(?,'VISITOR',?)",[id,body]);
   await db.execute("UPDATE support_threads SET updated_at=NOW() WHERE id=?",[id]);
   return send({success:true},201);
  }
  return send({error:"عملیات نامعتبر است."},400);
 }catch{return send({error:"ذخیره‌سازی موقتاً در دسترس نیست."},503)}
}
