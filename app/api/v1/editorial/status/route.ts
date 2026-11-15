import { NextResponse } from "next/server";
import { constants } from "node:fs";
import { lstat, open, realpath } from "node:fs/promises";
import path from "node:path";
import { EDITORIAL_MEDIA_DIRECTORIES, editorialMediaRoots } from "@/server/storage/editorial-media";
import { OPTIMIZED_EDITORIAL_IMAGE_NAMES } from "@/lib/fertini-editorial";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public and intentionally minimal: report availability of the eleven
 * published curated WebP files without exposing home paths, PM2 environment,
 * private files or application configuration.
 */
export async function GET() {
  const roots = editorialMediaRoots();
  const available = new Set<string>();
  for (const root of roots) {
    let canonicalRoot: string;
    try { canonicalRoot = await realpath(root); }
    catch { continue; }

    for (const rel of EDITORIAL_MEDIA_DIRECTORIES) {
      const directory = path.join(root, rel);
      let canonicalDirectory: string;
      try { canonicalDirectory = await realpath(directory); }
      catch { continue; }
      if (!canonicalDirectory.startsWith(canonicalRoot + path.sep)) continue;

      for (const name of OPTIMIZED_EDITORIAL_IMAGE_NAMES) {
        if (available.has(name)) continue;
        const filePath = path.join(directory, name);
        let file;
        try {
          const stat = await lstat(filePath);
          if (!stat.isFile() || stat.isSymbolicLink() ||
              stat.size < 12 || stat.size > 8 * 1024 * 1024 ||
              path.dirname(await realpath(filePath)) !== canonicalDirectory) continue;
          file = await open(filePath, constants.O_RDONLY | constants.O_NOFOLLOW);
          const header = Buffer.alloc(12);
          if ((await file.read(header, 0, 12, 0)).bytesRead !== 12) continue;
          if (header.toString("ascii", 0, 4) === "RIFF" &&
              header.toString("ascii", 8, 12) === "WEBP") available.add(name);
        } catch {
          // File not present at this approved location.
        } finally {
          await file?.close();
        }
      }
    }
  }
  return NextResponse.json({
    version: process.env.NEXT_PUBLIC_DEPLOY_SHA || "unknown",
    optimizedWebp: available.size,
    expected: OPTIMIZED_EDITORIAL_IMAGE_NAMES.length,
    ready: available.size === OPTIMIZED_EDITORIAL_IMAGE_NAMES.length,
  }, {
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}
