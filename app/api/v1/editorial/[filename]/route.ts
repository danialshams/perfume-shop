import { NextResponse } from "next/server";
import { constants } from "node:fs";
import { lstat, open, realpath } from "node:fs/promises";
import path from "node:path";
import { localMediaDirectory } from "@/server/storage/local-media";
import { EDITORIAL_IMAGE_NAMES } from "@/lib/fertini-editorial";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowed = new Set<string>(EDITORIAL_IMAGE_NAMES);
const signature = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);
const maxImageBytes = 8 * 1024 * 1024;

const missing = () => new NextResponse(null, {
  status: 404,
  headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
});

/**
 * Read ONLY the ten approved site photographs from Fertini's durable media
 * storage. The existing /api/v1/media route stays strictly UUID-only.
 *
 * ZIP extraction in cPanel can either flatten the ten PNGs into "editorial",
 * or preserve the public/fertini/editorial/ subdirectory inside it.
 * Both exact, private locations are supported; arbitrary paths never are.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;
  if (typeof filename !== "string" || !allowed.has(filename)) return missing();

  const root = localMediaDirectory();
  if (!root) return missing();

  try {
    const canonicalRoot = await realpath(root);
    const relativeDirectories = [
      "editorial",
      path.join("editorial", "public", "fertini", "editorial"),
      path.join("public", "fertini", "editorial"),
    ];

    for (const relativeDirectory of relativeDirectories) {
      const directory = path.join(root, relativeDirectory);
      let canonicalDirectory: string;
      try {
        canonicalDirectory = await realpath(directory);
      } catch {
        continue;
      }
      if (!canonicalDirectory.startsWith(canonicalRoot + path.sep)) continue;

      const target = path.join(directory, filename);
      let file;
      try {
        const stat = await lstat(target);
        if (!stat.isFile() || stat.isSymbolicLink() ||
            stat.size < signature.length || stat.size > maxImageBytes) continue;
        const canonicalTarget = await realpath(target);
        if (path.dirname(canonicalTarget) !== canonicalDirectory) continue;
        // Reject symlink substitution while opening the approved filename.
        file = await open(target, constants.O_RDONLY | constants.O_NOFOLLOW);
        const data = await file.readFile();
        if (!signature.every((byte, index) => data[index] === byte)) continue;

        return new NextResponse(Uint8Array.from(data).buffer, {
          status: 200,
          headers: {
            "Content-Type": "image/png",
            "Content-Length": String(data.byteLength),
            "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
            "X-Content-Type-Options": "nosniff",
          },
        });
      } catch {
        // The expected file may not exist in this ZIP extraction location.
        continue;
      } finally {
        await file?.close();
      }
    }
  } catch {
    return missing();
  }

  return missing();
}
