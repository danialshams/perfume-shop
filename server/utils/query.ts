export function buildWhereClause(filters: Record<string, any>) {
  const clauses: string[] = [];
  const params: Record<string, any> = {};

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      clauses.push(`${key} = :${key}`);
      params[key] = value;
    }
  });

  return {
    where: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    params,
  };
}
