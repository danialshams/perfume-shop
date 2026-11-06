import {NextRequest,NextResponse} from "next/server";
import {db} from "@/lib/db";
import {requireAdmin} from "@/server/middlewares/admin";
import type {RowDataPacket} from "mysql2";
export const runtime="nodejs";
export const dynamic="force-dynamic";
type CountRow=RowDataPacket&{total:number};
type OrderRow=RowDataPacket&{id:number;order_number:string|null;customer_name:string|null;total_amount:number;status:string;created_at:Date|string};
async function count(sql:string){const [rows]=await db.query<CountRow[]>(sql);return Number(rows[0]?.total||0)}
export async function GET(request:NextRequest){
 try{await requireAdmin(request)}catch{return NextResponse.json({error:"دسترسی مدیر لازم است"},{status:403})}
 const queries=[
 count("SELECT COUNT(*) AS total FROM products WHERE deleted_at IS NULL"),
 count("SELECT COUNT(*) AS total FROM orders"),
 count("SELECT COUNT(*) AS total FROM categories WHERE deleted_at IS NULL"),
 count("SELECT COUNT(*) AS total FROM users WHERE role='USER' AND deleted_at IS NULL"),
 count("SELECT COUNT(*) AS total FROM admin_notifications WHERE is_read=0"),
 db.query<OrderRow[]>("SELECT id,order_number,customer_name,total_amount,status,created_at FROM orders ORDER BY id DESC LIMIT 5")
 ] as const;
 const result=await Promise.allSettled(queries);
 if(result.every(item=>item.status==="rejected"))
   return NextResponse.json({error:"اتصال دیتابیس برقرار نیست؛ آمار نمایش داده نمی‌شود."},{status:503,headers:{"Cache-Control":"no-store"}});
 const n=(index:number)=>result[index].status==="fulfilled" ? Number((result[index] as PromiseFulfilledResult<number>).value) : null;
 const recent=result[5].status==="fulfilled"?result[5].value[0].map(o=>({...o,id:Number(o.id),total_amount:Number(o.total_amount||0)})):[];
 return NextResponse.json({products:n(0),orders:n(1),categories:n(2),customers:n(3),notifications:n(4),recent,
  partial:result.some(x=>x.status==="rejected")},{headers:{"Cache-Control":"private, no-store"}});
}
