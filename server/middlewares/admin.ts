import { NextRequest } from "next/server";
import { requireAuth } from "@/server/middlewares/auth";
import { isFertiniPublicDemoAdminEnabled } from "@/server/admin-preview-guest";

export async function requireAdmin(request: NextRequest) {
  if (isFertiniPublicDemoAdminEnabled()) return {userId:0,email:"demo@fertini.local",role:"ADMIN" as const};
  const user = await requireAuth(request);

  if (user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }

  return user;
}
