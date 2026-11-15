import {redirect} from "next/navigation";
/** Payment details are part of each order, rather than a separate empty panel. */
export default function RetiredPaymentsPage(){redirect("/admin/orders")}
