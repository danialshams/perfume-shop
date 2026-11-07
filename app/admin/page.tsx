import {redirect} from "next/navigation";
import {isFertiniPreviewGuestEnabled} from "@/server/admin-preview-guest";
export default function AdminPage(){
 redirect(isFertiniPreviewGuestEnabled()?"/admin/dashboard":"/admin/login");
}
