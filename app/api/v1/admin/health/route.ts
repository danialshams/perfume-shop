import {NextRequest,NextResponse} from "next/server";
import {db} from "@/lib/db";
import {storageReady} from "@/server/storage/s3-object";
import {requireAdmin} from "@/server/middlewares/admin";
import type {RowDataPacket} from "mysql2";
export const runtime="nodejs";export const dynamic="force-dynamic";
type TableRow=RowDataPacket&{TABLE_NAME:string};
type ColRow=RowDataPacket&{TABLE_NAME:string;COLUMN_NAME:string};
type FKRow=RowDataPacket&{TABLE_NAME:string;COLUMN_NAME:string;REFERENCED_TABLE_NAME:string;REFERENCED_COLUMN_NAME:string;total:number};
const expected=["products","product_variants","categories","orders","order_items","payments","users","admin_notifications","customers","customer_addresses"];
export async function GET(request:NextRequest){
 try{await requireAdmin(request)}catch{return NextResponse.json({error:"Forbidden"},{status:403})}
 const mediaStorageConfigured=storageReady();
 const missingEnv=["DB_HOST","DB_USER","DB_NAME"].filter(k=>!process.env[k]);
 if(missingEnv.length)return NextResponse.json({connected:false,configured:false,missingEnv,mediaStorageConfigured,
  message:"تنظیمات دیتابیس در این محیط کامل نیست. هیچ تغییری در دیتابیس انجام نشده است."},{status:503});
 try{
  const [tables]=await db.query<TableRow[]>("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()");
  const [columns]=await db.query<ColRow[]>("SELECT TABLE_NAME,COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('products','product_variants','orders')");
  const [fks]=await db.query<FKRow[]>(`SELECT TABLE_NAME,COLUMN_NAME,REFERENCED_TABLE_NAME,REFERENCED_COLUMN_NAME,COUNT(*) AS total
   FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL
   GROUP BY TABLE_NAME,COLUMN_NAME,REFERENCED_TABLE_NAME,REFERENCED_COLUMN_NAME HAVING COUNT(*)>1`);
  const names=new Set(tables.map(x=>x.TABLE_NAME));
  const cols=new Set(columns.map(x=>x.TABLE_NAME+"."+x.COLUMN_NAME));
  const legacy=["categories_old","categories_backup"].filter(k=>names.has(k));
  return NextResponse.json({connected:true,configured:true,mediaStorageConfigured,tableCount:names.size,
   missingTables:expected.filter(k=>!names.has(k)),legacyTables:legacy,
   productStatusPresent:cols.has("products.status"),
   missingCheckoutOrderColumns:["customer_id","cart_id","shipping_floor"].filter(k=>!cols.has("orders."+k)),
   stockColumns:["stock","stock_qty"].filter(k=>cols.has("product_variants."+k)),
   duplicatedForeignKeys:fks.map(x=>({table:x.TABLE_NAME,column:x.COLUMN_NAME,target:x.REFERENCED_TABLE_NAME,count:Number(x.total)})),
   message:"این بررسی فقط خواندنی است؛ هیچ داده یا جدولی پاک یا ویرایش نشده است."},
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  const code=error&&typeof error==="object"&&"code" in error?String(error.code):"";
  const reason=code==="ENOTFOUND"?"آدرس سرور دیتابیس قابل شناسایی نیست.":code==="ECONNREFUSED"?"سرور دیتابیس اتصال را رد کرد.":code==="ETIMEDOUT"?"مهلت اتصال دیتابیس تمام شد؛ فایروال یا شبکه را بررسی کنید.":code==="ER_ACCESS_DENIED_ERROR"?"نام کاربری یا رمز عبور دیتابیس صحیح نیست.":code==="ER_BAD_DB_ERROR"?"نام دیتابیس تنظیم‌شده وجود ندارد.":"ارتباط MySQL برقرار نشد. تنظیمات، دسترسی شبکه و ساختار دیتابیس را بررسی کنید.";
  return NextResponse.json({connected:false,configured:true,mediaStorageConfigured,message:reason},
   {status:503,headers:{"Cache-Control":"no-store"}});
 }
}
