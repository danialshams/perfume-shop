import { NextResponse } from "next/server";
import { readLocalMedia } from "@/server/storage/local-media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const mime: Record<string, string> = {
  jpg: "image/jpeg", png: "image/png", webp: "image/webp",
  mp3: "audio/mpeg", wav: "audio/wav", ogg: "audio/ogg",
  m4a: "audio/mp4", aac: "audio/aac", flac: "audio/flac",
  webm: "audio/webm",
};

/** Serve only locally stored UUID-named public media. No arbitrary file access. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ segments: string[] }> },
) {
  const { segments } = await params;
  if (!Array.isArray(segments) || (segments.length !== 2 && segments.length !== 3) ||
      segments[0] !== "products" || (segments.length === 3 && segments[1] !== "voices")) {
    return new NextResponse(null, { status: 404 });
  }
  const key = segments.join("/");
  const ext = segments[segments.length - 1].split(".").pop()?.toLowerCase() || "";
  if (!mime[ext]) return new NextResponse(null, { status: 404 });
  try {
    const bytes = await readLocalMedia(key);
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": mime[ext],
        "Content-Length": String(bytes.byteLength),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
