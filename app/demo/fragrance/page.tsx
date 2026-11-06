import { redirect } from "next/navigation";
import { FERTINI_DEMOS } from "@/lib/fertini-demo";
export default async function LegacyFragrancePage({searchParams}:{searchParams:Promise<{item?:string}>}){
 const {item}=await searchParams;
 const index=item&&/^demo-0\d{2}$/.test(item)?Number(item.slice(-3))-1:0;
 redirect("/fragrance/"+(FERTINI_DEMOS[index]?.id||FERTINI_DEMOS[0].id));
}
