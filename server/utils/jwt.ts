import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "@/server/config/env";

export type JwtPayload = {
  userId: number;
  mobile?: string;
  email?: string; // این‌جا رو از اجباری به اختیاری تغییر بده
  role: "USER" | "ADMIN";
};

export function signAccessToken(payload: JwtPayload) {
  return jwt.sign(payload, env.jwtAccessSecret, {
    expiresIn: env.jwtAccessExpiresIn as SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.jwtAccessSecret) as JwtPayload;
}
