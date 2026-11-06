import {NextRequest} from "next/server";
import {successResponse,errorResponse} from "@/lib/response";
import {requireAdmin} from "@/server/middlewares/admin";
import {orderService} from "@/server/services/order.service";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest){
 try{await requireAdmin(request)}catch{return errorResponse("دسترسی مدیر لازم است.",403)}
 const searchParams=request.nextUrl.searchParams;
 const page=Number(searchParams.get("page")||1),limit=Number(searchParams.get("limit")||10);
 if(!Number.isSafeInteger(page)||page<1||page>100000||!Number.isSafeInteger(limit)||limit<1||limit>100)
  return errorResponse("شماره صفحه یا تعداد نتایج نامعتبر است.",422);
 const search=searchParams.get("search")?.trim()||undefined;
 if(search&&search.length>100)return errorResponse("جستجو بیش از حد طولانی است.",422);
 const status=searchParams.get("status")||undefined,payment_status=searchParams.get("payment_status")||undefined;
 if(status&&!["PENDING_PAYMENT","PAID","PROCESSING","SHIPPED","DELIVERED","CANCELLED","PAYMENT_FAILED"].includes(status))
  return errorResponse("وضعیت سفارش نامعتبر است.",422);
 if(payment_status&&!["UNPAID","PAID","FAILED","REFUNDED"].includes(payment_status))
  return errorResponse("وضعیت پرداخت نامعتبر است.",422);
 try{
  const result=await orderService.getAll({page,limit,search,status,payment_status});
  return successResponse(result,"Orders fetched successfully");
 }catch(error){
  console.error("[ORDERS_GET_ALL_ERROR]",error instanceof Error?error.name:"Unknown");
  return errorResponse("دریافت سفارش‌ها ممکن نیست. اتصال دیتابیس و تنظیمات سرور را بررسی کنید.",503);
 }
}
