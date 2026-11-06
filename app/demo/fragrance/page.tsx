import { redirect } from "next/navigation";
export default async function LegacyFragrancePage({searchParams}:{searchParams:Promise<{item?:string}>}){
 const {item}=await searchParams;
 redirect("/fragrance/"+(item&&/^demo-0\d{2}$/.test(item)?item:"demo-001"));
}
