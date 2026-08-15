import { Role } from "@/server/types/common";

export type AuthUser = {
  id: number;
  full_name: string;
  email: string;
  role: Role;
};

export type LoginResult = {
  user: AuthUser;
  accessToken: string;
};
