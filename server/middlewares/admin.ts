import { NextRequest } from "next/server";
import { requireAuth } from "@/server/middlewares/auth";

export async function requireAdmin(request: NextRequest) {
  const user = await requireAuth(request);

  if (user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }

  return user;
}
