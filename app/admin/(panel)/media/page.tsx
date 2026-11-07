import {redirect} from "next/navigation";
/** Product media is edited on its own product, not in a separate library. */
export default function AdminMediaRedirect(){redirect("/admin/products")}
