import { createReadStream } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const types: Record<string, string> = {
  ".mp4": "video/mp4",
  ".m4v": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
};

type FoundVideo = { file: string; size: number; mime: string };

async function findVideo(): Promise<FoundVideo | null> {
  // Opt-in exact file override for hosting environments with a different upload directory.
  const explicit = process.env.TEMP_PROJECT_VIDEO_FILE;
  if (explicit && path.isAbsolute(explicit)) {
    try {
      const info = await stat(explicit);
      const mime = types[path.extname(explicit).toLowerCase()];
      if (info.isFile() && mime) return { file: explicit, size: info.size, mime };
    } catch { /* try managed upload directories */ }
  }

  // The video has already been uploaded by the owner into a folder named "app".
  // Only look for videos directly inside these specific folders, never in arbitrary
  // paths or from an untrusted query parameter.
  const home = process.env.HOME || "/home/fertinip";
  const dirs = [
    path.join(home, "app"),
    path.join(home, "public_html", "app"),
    path.join(home, "fertini-media", "app"),
    path.join(home, "fertini-runtime", "app"),
    path.join(home, "fertini-runtime", "public", "app"),
  ];
  for (const directory of dirs) {
    try {
      const entries = await readdir(directory, { withFileTypes: true });
      const candidates = await Promise.all(entries.filter((e) =>
        e.isFile() && types[path.extname(e.name).toLowerCase()],
      ).map(async (entry) => {
        const file = path.join(directory, entry.name);
        const info = await stat(file);
        return { file, info, mime: types[path.extname(file).toLowerCase()] };
      }));
      const found = candidates.filter((c) => c.info.isFile() && c.info.size > 0)
        .sort((a, b) => b.info.mtimeMs - a.info.mtimeMs)[0];
      if (found) return { file: found.file, size: found.info.size, mime: found.mime };
    } catch { /* directory not present or not readable */ }
  }
  return null;
}

const commonHeaders = {
  "Accept-Ranges": "bytes",
  "Cache-Control": "private, no-store",
  "Content-Disposition": "inline",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "X-Content-Type-Options": "nosniff",
};

function notFound() {
  return new Response("Video file not found in the uploaded app folder.", {
    status: 404,
    headers: { ...commonHeaders, "Content-Type": "text/plain; charset=utf-8" },
  });
}

export async function HEAD() {
  const video = await findVideo();
  if (!video) return notFound();
  return new Response(null, {
    status: 200,
    headers: {
      ...commonHeaders,
      "Content-Type": video.mime,
      "Content-Length": String(video.size),
    },
  });
}

export async function GET(request: Request) {
  const video = await findVideo();
  if (!video) return notFound();

  let start = 0;
  let end = video.size - 1;
  const range = request.headers.get("range");
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match || (!match[1] && !match[2])) {
      return new Response(null, {
        status: 416,
        headers: { ...commonHeaders, "Content-Range": `bytes */${video.size}` },
      });
    }
    if (match[1]) {
      start = Number(match[1]);
      if (match[2]) end = Math.min(Number(match[2]), video.size - 1);
    } else {
      const suffixBytes = Number(match[2]);
      start = Math.max(0, video.size - suffixBytes);
    }
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) ||
        start >= video.size || end < start) {
      return new Response(null, {
        status: 416,
        headers: { ...commonHeaders, "Content-Range": `bytes */${video.size}` },
      });
    }
  }

  const stream = Readable.toWeb(createReadStream(video.file, { start, end }));
  const headers: Record<string, string> = {
    ...commonHeaders,
    "Content-Type": video.mime,
    "Content-Length": String(end - start + 1),
  };
  if (range) headers["Content-Range"] = `bytes ${start}-${end}/${video.size}`;
  return new Response(stream as unknown as ReadableStream<Uint8Array>, {
    status: range ? 206 : 200,
    headers,
  });
}
