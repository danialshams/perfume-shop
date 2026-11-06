import type {ReactNode} from "react";
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import {requireAuth} from "@/server/middlewares/auth";
import AdminShell from "@/components/admin/admin-shell";
import AdminAntdProvider from "@/components/panel-sections/admin-antd-provider";
import "./fertini-studio.css";
export const dynamic="force-dynamic";
export default async function AdminPanelLayout({children}:{children:ReactNode}){
 let allowed=false;
 try{
  const current=await headers();
  const user=await requireAuth(new Request("http://localhost/admin",{headers:current}));
  allowed=user.role==="ADMIN";
 }catch{}
 if(!allowed)redirect("/admin/login");
 return <AdminAntdProvider><AdminShell>{children}</AdminShell></AdminAntdProvider>;
}
