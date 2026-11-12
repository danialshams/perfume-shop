import {redirect} from "next/navigation";
import {isFertiniPreviewGuestEnabled,isFertiniPublicDemoAdminEnabled} from "@/server/admin-preview-guest";
export default function AdminPage(){
 redirect(isFertiniPublicDemoAdminEnabled()||isFertiniPreviewGuestEnabled()?"/admin/dashboard":"/admin/login");
}
