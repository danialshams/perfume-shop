import { existsSync } from "node:fs";
import path from "node:path";
import { localMediaDirectory } from "@/server/storage/local-media";

/**
 * Private, on-host editorial photographs.
 *
 * The cPanel process can be restarted by PM2 from a different working
 * directory. Product uploads use their existing restricted media resolver;
 * these curated public editorial files can additionally use this ONE
 * established host directory after a presence check.
 *
 * Do not expose an arbitrary filesystem path from a URL parameter.
 */
const hostRoot = "/home/fertinip/fertini-media";

export function editorialMediaRoots(): string[] {
  const configured = localMediaDirectory();
  const knownHostRoot =
    process.env.NODE_ENV === "production" &&
    existsSync(path.join(hostRoot, "editorial"))
      ? hostRoot : null;

  return [...new Set([configured, knownHostRoot].filter((value): value is string => Boolean(value)))];
}

export const EDITORIAL_MEDIA_DIRECTORIES = [
  "editorial",
  path.join("editorial", "public", "fertini", "editorial"),
  path.join("public", "fertini", "editorial"),
] as const;
