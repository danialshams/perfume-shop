import {NextRequest,NextResponse} from "next/server";
import {requireAuth} from "@/server/middlewares/auth";
import {db} from "@/lib/db";
import type {RowDataPacket} from "mysql2/promise";
export const runtime="nodejs";
export const dynamic="force-dynamic";

type PaidRow=RowDataPacket&{customer_phone:string;customer_name:string|null;purchase_count:number|string;total_spent:number|string;last_purchase_at:string|null};
type CustomerRow=RowDataPacket&{id:number;first_name:string;last_name:string;mobile:string};
type LegacyRow=RowDataPacket&{id:number;full_name:string|null;phone:string|null};
type Member={mobile:string;name:string;purchaseCount:number;totalSpent:number;lastPurchaseAt:string|null;registered:boolean};

const persianDigits="۰۱۲۳۴۵۶۷۸۹",arabicDigits="٠١٢٣٤٥٦٧٨٩";
export function normalizePhone(phone:unknown):string {
 let digits=String(phone??"").replace(/[۰-۹٠-٩]/g,c=>{
  const p=persianDigits.indexOf(c);return String(p>=0?p:arabicDigits.indexOf(c));
 }).replace(/\D/g,"");
 if(digits.startsWith("0098"))digits="0"+digits.slice(4);
 else if(digits.startsWith("98")&&digits.length===12)digits="0"+digits.slice(2);
 else if(digits.length===10&&digits.startsWith("9"))digits="0"+digits;
 return digits;
}
/** Ranking uses actual PAID orders only; no artificial loyalty-point formula. */
export async function GET(request:NextRequest){
 try{
  const admin=await requireAuth(request);
  if(admin.role!=="ADMIN")return NextResponse.json({error:"دسترسی مدیر لازم است."},{status:403});
 }catch{return NextResponse.json({error:"برای مشاهده باشگاه مشتریان وارد حساب مدیر شوید."},{status:401});}
 try{
  const [paid]=await db.query<PaidRow[]>(`
   SELECT customer_phone,MAX(customer_name) AS customer_name,
          COUNT(*) AS purchase_count,SUM(total_amount) AS total_spent,
          MAX(COALESCE(paid_at,created_at)) AS last_purchase_at
   FROM orders
   WHERE payment_status='PAID'
     AND status NOT IN ('CANCELLED','CANCELED','REFUNDED')
     AND total_amount>0
   GROUP BY customer_phone
   ORDER BY SUM(total_amount) DESC
   LIMIT 50000`);
  const members=new Map<string,Member>();
  for(const row of paid){
   const mobile=normalizePhone(row.customer_phone);
   if(mobile.length<10||mobile.length>15)continue;
   const prev=members.get(mobile);
   const count=Number(row.purchase_count)||0,amount=Number(row.total_spent)||0;
   const last=row.last_purchase_at?new Date(row.last_purchase_at).toISOString():null;
   if(prev){
    prev.purchaseCount+=count;prev.totalSpent+=amount;
    if(last&&(!prev.lastPurchaseAt||last>prev.lastPurchaseAt)){
     prev.name=row.customer_name?.trim()||prev.name;prev.lastPurchaseAt=last;
    }
   }else members.set(mobile,{mobile,name:row.customer_name?.trim()||"مشتری",
    purchaseCount:count,totalSpent:amount,lastPurchaseAt:last,registered:false});
  }
  // Include registered customers with no paid purchases at the end of the list.
  let registered:CustomerRow[]=[];
  try{[registered]=await db.query<CustomerRow[]>(
   "SELECT id,first_name,last_name,mobile FROM customers WHERE role='USER' AND is_active=1 LIMIT 50000");}catch{}
  for(const item of registered){
   const mobile=normalizePhone(item.mobile);
   if(mobile.length<10||mobile.length>15)continue;
   const name=[item.first_name,item.last_name].filter(Boolean).join(" ").trim();
   const prev=members.get(mobile);
   if(prev){prev.registered=true;if(name)prev.name=name;}
   else members.set(mobile,{mobile,name:name||"مشتری",purchaseCount:0,totalSpent:0,lastPurchaseAt:null,registered:true});
  }
  let users:LegacyRow[]=[];
  try{[users]=await db.query<LegacyRow[]>(
   "SELECT id,full_name,phone FROM users WHERE role='USER' AND deleted_at IS NULL LIMIT 50000");}catch{}
  for(const user of users){
   const mobile=normalizePhone(user.phone);
   if(mobile.length<10||mobile.length>15)continue;
   const existing=members.get(mobile);
   if(existing){existing.registered=true;if(existing.name==="مشتری"&&user.full_name)existing.name=user.full_name.trim();}
   else members.set(mobile,{mobile,name:user.full_name?.trim()||"مشتری",purchaseCount:0,totalSpent:0,lastPurchaseAt:null,registered:true});
  }
  const query=(new URL(request.url)).searchParams.get("q")?.trim().toLowerCase()||"";
  const ranked=[...members.values()].filter(m=>!query||m.mobile.includes(normalizePhone(query))||m.name.toLowerCase().includes(query))
   .sort((a,b)=>b.totalSpent-a.totalSpent||b.purchaseCount-a.purchaseCount||a.name.localeCompare(b.name,"fa"));
  const params=new URL(request.url).searchParams;
  const page=Math.max(1,Math.min(10000,Number(params.get("page"))||1));
  const limit=Math.max(1,Math.min(100,Number(params.get("limit"))||20));
  const response={
   items:ranked.slice((page-1)*limit,page*limit).map((m,i)=>({...m,rank:(page-1)*limit+i+1})),
   total:ranked.length,page,limit,
   summary:{customers:members.size,paidCustomers:[...members.values()].filter(m=>m.purchaseCount>0).length,
     paidOrders:[...members.values()].reduce((sum,m)=>sum+m.purchaseCount,0),
     totalPaid:[...members.values()].reduce((sum,m)=>sum+m.totalSpent,0)}
  };
  return NextResponse.json(response,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  console.error("customer club summary failed",error);
  return NextResponse.json({error:"دریافت اطلاعات باشگاه مشتریان از دیتابیس ممکن نشد."},{status:503,headers:{"Cache-Control":"no-store"}});
 }
}
