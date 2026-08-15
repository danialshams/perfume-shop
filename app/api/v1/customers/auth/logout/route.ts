// app/api/v1/customers/auth/logout/route.ts
import { NextResponse } from "next/server";
import { USER_ACCESS_COOKIE_NAME } from "@/server/constants/auth";

export async function POST() {
  const response = NextResponse.json(
    {
      success: true,
      message: "Logout successful",
    },
    { status: 200 },
  );

  response.cookies.set({
    name: USER_ACCESS_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
