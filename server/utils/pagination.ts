export function getPagination(searchParams?: URLSearchParams) {
  const page = Math.max(Number(searchParams?.get("page") || 1), 1);
  const limit = Math.max(Number(searchParams?.get("limit") || 12), 1);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}
