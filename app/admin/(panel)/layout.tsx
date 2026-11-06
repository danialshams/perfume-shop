import type {ReactNode} from "react";
import AdminShell from "@/components/admin/admin-shell";
import AdminAntdProvider from "@/components/panel-sections/admin-antd-provider";
import "./fertini-studio.css";
export default function AdminPanelLayout({children}:{children:ReactNode}){
 return <AdminAntdProvider><AdminShell>{children}</AdminShell></AdminAntdProvider>;
}
