import bcrypt from "bcryptjs";
import { env } from "@/server/config/env";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, env.bcryptSaltRounds);
}

export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
