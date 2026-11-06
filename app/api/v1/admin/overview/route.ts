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
 try{
  const [products,orders,categories,customers,notifications,recent]=await Promise.all([
   count("SELECT COUNT(*) AS total FROM products WHERE deleted_at IS NULL"),
   count("SELECT COUNT(*) AS total FROM orders"),
   count("SELECT COUNT(*) AS total FROM categories WHERE deleted_at IS NULL"),
   count("SELECT COUNT(*) AS total FROM users"),
   count("SELECT COUNT(*) AS total FROM admin_notifications WHERE is_read = 0"),
   db.query<OrderRow[]>("SELECT id,order_number,customer_name,total_amount,status,created_at FROM orders ORDER BY id DESC LIMIT 5")
  ]);
  return NextResponse.json({products,orders,categories,customers,notifications,
   recent:recent[0].map(o=>({...o,id:Number(o.id),total_amount:Number(o.total_amount||0)}))},
   {headers:{"Cache-Control":"private, no-store"}});
 }catch{
  return NextResponse.json({error:"اتصال دیتابیس فروشگاه در این محیط برقرار نیست. تا زمان اتصال، آمار واقعی نمایش داده نمی‌شود."},
   {status:503,headers:{"Cache-Control":"no-store"}});
 }
}
