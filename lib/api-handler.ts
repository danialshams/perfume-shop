import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/response";

export async function withErrorHandler<T>(fn: () => Promise<T>) {
  try {
    const result = await fn();
    return NextResponse.json(result);
  } catch (error: any) {
    return errorResponse(error?.message || "Internal server error", 500);
  }
}
