import {redirect} from "next/navigation";
/** Operational diagnostics remain behind the authenticated API, not in the merchant UI. */
export default function RetiredDatabasePage(){redirect("/admin/dashboard")}
