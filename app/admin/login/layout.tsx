import type {ReactNode} from "react";
import {redirect} from "next/navigation";
import {isFertiniPreviewGuestEnabled,isFertiniPublicDemoAdminEnabled} from "@/server/admin-preview-guest";
export default function AdminLoginLayout({children}:{children:ReactNode}){
 if(isFertiniPublicDemoAdminEnabled()||isFertiniPreviewGuestEnabled())redirect("/admin/dashboard");
 return children;
}
