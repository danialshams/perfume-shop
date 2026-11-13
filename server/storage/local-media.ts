import fs from "node:fs/promises";
import path from "node:path";

/**
 * Opt-in durable on-host media storage for standalone Node/cPanel deployments.
 * Keep the folder OUTSIDE the app directory: runtime bundles are replaced on deploy.
 */
const fileKey = /^products\/(?:voices\/)?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpg|png|webp|mp3|wav|ogg|m4a|aac|flac|webm)$/i;

export function resolveMediaRoot(cwd: string, configured: string | undefined, production: boolean): string | null {
  const normalizedCwd = path.resolve(cwd);
  // This cPanel installation runs directly under PM2 (not CloudLinux Selector).
  // cPanel's UI environment values may never reach the already-running PM2 app.
  // Use the fixed, private host directory only for this exact deployment root.
  // All other hosts must configure LOCAL_MEDIA_STORAGE_DIR explicitly.
  const raw = configured?.trim() ||
    (production &&
     normalizedCwd === "/home/fertinip/fertini-runtime"
      ? "/home/fertinip/fertini-media" : "");
  if (!raw || !path.isAbsolute(raw)) return null;
  const root = path.resolve(raw);
  // Do not put runtime uploads in a replaceable deploy or a public subdirectory.
  if (root === normalizedCwd || root.startsWith(normalizedCwd + path.sep)) return null;
  return root;
}

export function localMediaDirectory(): string | null {
  return resolveMediaRoot(process.cwd(), process.env.LOCAL_MEDIA_STORAGE_DIR, process.env.NODE_ENV === "production");
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
