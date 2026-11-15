import { NextResponse } from "next/server";
import { constants } from "node:fs";
import { lstat, open, realpath } from "node:fs/promises";
import path from "node:path";
import { editorialMediaRoots, EDITORIAL_MEDIA_DIRECTORIES } from "@/server/storage/editorial-media";
import { EDITORIAL_IMAGE_NAMES, OPTIMIZED_EDITORIAL_IMAGE_NAMES } from "@/lib/fertini-editorial";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowed = new Set<string>([...EDITORIAL_IMAGE_NAMES, ...OPTIMIZED_EDITORIAL_IMAGE_NAMES]);
const pngSignature = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);
const maxImageBytes = 8 * 1024 * 1024;

const missing = () => new NextResponse(null, {
  status: 404,
  headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
});

function isValidPicture(data: Uint8Array, extension: "png" | "webp"): boolean {
  if (extension === "png") return pngSignature.every((byte, index) => data[index] === byte);
  return data.length >= 12 &&
    data[0] === 82 && data[1] === 73 && data[2] === 70 && data[3] === 70 &&
    data[8] === 87 && data[9] === 69 && data[10] === 66 && data[11] === 80;
}

/**
 * Serve only the explicitly approved photographs. Try the configured storage
 * root and the confirmed on-host editorial directory: PM2 may start Next.js
 * with a different cwd and without the cPanel UI's environment variables.
 * The product/voice upload API keeps its stricter storage policy unchanged.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;
  if (typeof filename !== "string" || !allowed.has(filename)) return missing();

  const roots = editorialMediaRoots();
  if (!roots.length) return missing();

  const isWebpRequest = filename.endsWith(".webp");
  const candidateNames = isWebpRequest
    ? [filename, filename.slice(0, -5) + ".png"]
    : [filename];

  for (const root of roots) {
    let canonicalRoot: string;
    try { canonicalRoot = await realpath(root); }
    catch { continue; }

    for (const relativeDirectory of EDITORIAL_MEDIA_DIRECTORIES) {
      const directory = path.join(root, relativeDirectory);
      let canonicalDirectory: string;
      try { canonicalDirectory = await realpath(directory); }
      catch { continue; }
      if (!canonicalDirectory.startsWith(canonicalRoot + path.sep)) continue;

      for (const candidateName of candidateNames) {
        if (!allowed.has(candidateName)) continue;
        const extension = candidateName.endsWith(".webp") ? "webp" : "png";
        const target = path.join(directory, candidateName);
        let file;
        try {
          const stat = await lstat(target);
          if (!stat.isFile() || stat.isSymbolicLink() ||
              stat.size < 12 || stat.size > maxImageBytes) continue;
          if (path.dirname(await realpath(target)) !== canonicalDirectory) continue;

          file = await open(target, constants.O_RDONLY | constants.O_NOFOLLOW);
          const data = await file.readFile();
          if (!isValidPicture(data, extension)) continue;

          const contentType = extension === "webp" ? "image/webp" : "image/png";
          const cachePolicy = isWebpRequest && extension === "png"
            ? "public, max-age=30, must-revalidate"
            : "public, max-age=86400, stale-while-revalidate=604800";
          return new NextResponse(Uint8Array.from(data).buffer, {
            status: 200,
            headers: {
              "Content-Type": contentType,
              "Content-Length": String(data.byteLength),
              "Cache-Control": cachePolicy,
              "X-Content-Type-Options": "nosniff",
            },
          });
        } catch {
          continue;
        } finally {
          await file?.close();
        }
      }
    }
  }
  return missing();
}
