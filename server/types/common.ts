export type ApiListResult<T> = {
  items: T[];
  total?: number;
  page?: number;
  limit?: number;
};

export type Role = "USER" | "ADMIN";
