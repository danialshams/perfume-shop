import type { NextRequest } from "next/server";

/**
 * The external browser host can differ from request.nextUrl.host behind
 * a cPanel/PM2 reverse proxy. Trust the browser's same-origin Fetch Metadata
 * signal or an exact host match, never a cross-site write.
 */
export function isSameOriginAdminMutation(request: NextRequest): boolean {
  if (request.method === "GET" || request.method === "HEAD") return true;

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site" || fetchSite === "same-site") return false;

  const origin = request.headers.get("origin");
  if (!origin) return fetchSite === "same-origin";

  let parsed: URL;
  try {
    parsed = new URL(origin);
  } catch {
    return false;
  }
  if (
    (parsed.protocol !== "https:" && parsed.protocol !== "http:") ||
    parsed.username || parsed.password || parsed.pathname !== "/" ||
    parsed.search || parsed.hash
  ) return false;

  const publicHosts = [
    request.headers.get("host"),
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim(),
    request.nextUrl.host,
  ].filter((host): host is string => Boolean(host));

  // Browsers set Sec-Fetch-Site themselves; this survives proxy rewrites.
  return publicHosts.includes(parsed.host) || fetchSite === "same-origin";
}
