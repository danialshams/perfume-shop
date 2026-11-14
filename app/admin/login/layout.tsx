import type {Metadata} from "next";
import type {ReactNode} from "react";
import {redirect} from "next/navigation";
import {isFertiniPreviewGuestEnabled,isFertiniPublicDemoAdminEnabled} from "@/server/admin-preview-guest";
export const metadata:Metadata={robots:{index:false,follow:false}};
export default function AdminLoginLayout({children}:{children:ReactNode}){
 if(isFertiniPublicDemoAdminEnabled()||isFertiniPreviewGuestEnabled())redirect("/admin/dashboard");
 return children;
}
