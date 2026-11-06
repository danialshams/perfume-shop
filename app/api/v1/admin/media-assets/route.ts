import {NextRequest,NextResponse} from "next/server";
import {db} from "@/lib/db";
import {requireAdmin} from "@/server/middlewares/admin";
import type {RowDataPacket} from "mysql2/promise";
export const runtime="nodejs";export const dynamic="force-dynamic";
type AssetRow=RowDataPacket&{url:string;label:string};
const safe=(raw:string)=>{if(raw.startsWith("/")&&!raw.startsWith("//")&&!raw.includes(".."))return true;
 try{return new URL(raw).protocol==="https:"}catch{return false}};
export async function GET(request:NextRequest){
 try{await requireAdmin(request)}catch{return NextResponse.json({error:"Forbidden"},{status:403})}
 try{
  const [rows]=await db.query<AssetRow[]>("SELECT image_url AS url,CONCAT('محصول #',product_id) AS label FROM product_images ORDER BY id DESC LIMIT 80");
  const assets=new Map<string,string>();
  for(const row of rows)if(row.url&&safe(row.url))assets.set(row.url,row.label);
  return NextResponse.json({items:[...assets].map(([url,label])=>({url,label}))},{headers:{"Cache-Control":"private, no-store"}});
 }catch{return NextResponse.json({error:"کتابخانه تصاویر دیتابیس در دسترس نیست.",items:[]},{status:503})}
}
