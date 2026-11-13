import {randomUUID} from "node:crypto";
import {mkdir, unlink, writeFile} from "node:fs/promises";
import path from "node:path";
import {validateMediaBytes} from "@/lib/admin-media-validation";
import {deleteLocalMedia, localMediaReady, saveLocalMedia} from "@/server/storage/local-media";

/** Categories, like products and hero images, must survive standalone runtime upgrades. */
export async function saveCategoryImage(file: File): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const verdict = validateMediaBytes(file,"image",bytes);
  if (!verdict.ok) throw new Error(verdict.error);

  const key = "categories/" + randomUUID() + "." + verdict.ext;
  if (localMediaReady()) return await saveLocalMedia(key,bytes);
  if (process.env.NODE_ENV === "production") {
    throw new Error("مسیر ذخیره‌سازی تصاویر در هاست در دسترس نیست.");
  }
  const developmentDir = path.join(process.cwd(),"public","uploads","categories");
  await mkdir(developmentDir,{recursive:true});
  await writeFile(path.join(developmentDir,path.basename(key)),bytes,{flag:"wx"});
  return "/uploads/" + key;
}

/** Delete only UUID-named category uploads; never delete checked-in static assets. */
export async function deletePublicUpload(publicUrl?:string|null):Promise<void> {
  if (!publicUrl) return;
  const match = publicUrl.match(/^\/api\/v1\/media\/(categories\/[0-9a-f-]{36}\.(?:jpg|png|webp))$/i);
  if (match && localMediaReady()) {
    await deleteLocalMedia(match[1]);
    return;
  }
  // Legacy public uploads can only be removed in development.
  const old = publicUrl.match(/^\/uploads\/categories\/([0-9a-f-]{36}\.(?:jpg|png|webp))$/i);
  if (!old || process.env.NODE_ENV === "production") return;
  try { await unlink(path.join(process.cwd(),"public","uploads","categories",old[1])); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}
