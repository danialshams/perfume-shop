import fs from "node:fs/promises";
import path from "node:path";

/**
 * Opt-in durable on-host media storage for standalone Node/cPanel deployments.
 * Keep the folder OUTSIDE the app directory: runtime bundles are replaced on deploy.
 */
const fileKey = /^products\/(?:voices\/)?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpg|png|webp|mp3|wav|ogg|m4a|aac|flac|webm)$/i;

export function localMediaDirectory(): string | null {
  const raw = process.env.LOCAL_MEDIA_STORAGE_DIR?.trim();
  if (!raw || !path.isAbsolute(raw)) return null;
  const root = path.resolve(raw);
  const cwd = path.resolve(process.cwd());
  // Do not put runtime uploads in a replaceable deploy or a public subdirectory.
  if (root === cwd || root.startsWith(cwd + path.sep)) return null;
  return root;
}
export class StorageNotConfiguredError extends Error {}
export const localMediaReady = (): boolean => localMediaDirectory() !== null;

function fileLocation(key: string): string {
  const root = localMediaDirectory();
  if (!root) throw Error("LOCAL_MEDIA_STORAGE_DIR is not configured as an absolute durable path");
  if (!fileKey.test(key)) throw Error("Invalid media file key");
  return path.join(root, ...key.split("/"));
}

export async function saveLocalMedia(key: string, bytes: Uint8Array): Promise<string> {
  const destination = fileLocation(key);
  await fs.mkdir(path.dirname(destination), { recursive: true, mode: 0o750 });
  await fs.writeFile(destination, bytes, { flag: "wx", mode: 0o640 });
  return "/api/v1/media/" + key;
}

export async function readLocalMedia(key: string): Promise<Uint8Array> {
  return new Uint8Array(await fs.readFile(fileLocation(key)));
}
