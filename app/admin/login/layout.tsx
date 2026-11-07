import type {ReactNode} from "react";
import {redirect} from "next/navigation";
import {isFertiniPreviewGuestEnabled} from "@/server/admin-preview-guest";
export default function AdminLoginLayout({children}:{children:ReactNode}){
 if(isFertiniPreviewGuestEnabled())redirect("/admin/dashboard");
 return children;
}
