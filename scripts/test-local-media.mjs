import assert from "node:assert/strict";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { localMediaReady, saveLocalMedia, readLocalMedia, deleteLocalMedia, resolveMediaRoot } from "../server/storage/local-media.ts";

const original = process.env.LOCAL_MEDIA_STORAGE_DIR;
const root = await mkdtemp(path.join(tmpdir(), "fertini-local-media-"));
const key = "products/46f677b3-25a8-48f4-9020-dbf397e90ce1.jpg";
const voice = "products/voices/46f677b3-25a8-48f4-9020-dbf397e90ce2.mp3";
const category = "categories/46f677b3-25a8-48f4-9020-dbf397e90ce3.jpg";
try {
  assert.equal(resolveMediaRoot("/home/fertinip/fertini-runtime", undefined, true),
    "/home/fertinip/fertini-media", "PM2 cPanel runtime must use durable media even without inherited env");
  assert.equal(resolveMediaRoot("/home/fertinip/fertini-runtime", "", true),
    "/home/fertinip/fertini-media");
  assert.equal(resolveMediaRoot("/home/fertinip/fertini-runtime", undefined, false), null);
  assert.equal(resolveMediaRoot("/home/other/fertini-runtime", undefined, true), null);
  assert.equal(resolveMediaRoot("/home/fertinip/fertini-runtime", "relative/uploads", true), null);
  assert.equal(resolveMediaRoot("/home/fertinip/fertini-runtime", "/home/fertinip/fertini-runtime/public/uploads", true), null);
  assert.equal(resolveMediaRoot("/home/fertinip/fertini-runtime", "/home/fertinip/custom-media", true),
    "/home/fertinip/custom-media");

  process.env.LOCAL_MEDIA_STORAGE_DIR = root;
  assert.equal(localMediaReady(), true);
  const photo = Uint8Array.of(255, 216, 255, 224, 0, 0, 0, 0, 0, 0, 0, 0);
  assert.equal(await saveLocalMedia(key, photo), "/api/v1/media/" + key);
  assert.deepEqual(await readLocalMedia(key), photo);
  assert.deepEqual(new Uint8Array(await readFile(path.join(root, key))), photo);
  assert.equal(await saveLocalMedia(voice, Uint8Array.of(73, 68, 51, 4)), "/api/v1/media/" + voice);
  assert.equal(await saveLocalMedia(category, photo), "/api/v1/media/" + category);
  assert.deepEqual(await readLocalMedia(category), photo);
  await deleteLocalMedia(category);
  await assert.rejects(() => readLocalMedia(category), {code:"ENOENT"});
  await assert.rejects(() => deleteLocalMedia("../etc/passwd"));
  await assert.rejects(() => saveLocalMedia("categories/outside.jpg",photo));
  await assert.rejects(() => saveLocalMedia(key, photo), { code: "EEXIST" });
  await assert.rejects(() => readLocalMedia("../.env"));
  await assert.rejects(() => saveLocalMedia("products/../../etc/passwd", photo));
  process.env.LOCAL_MEDIA_STORAGE_DIR = "relative/media";
  assert.equal(localMediaReady(), false);
  await assert.rejects(() => saveLocalMedia(key, photo));
  process.env.LOCAL_MEDIA_STORAGE_DIR = path.join(process.cwd(), "public", "uploads");
  assert.equal(localMediaReady(), false);
  console.log("Local media: durable writes, reads, no overwrite and traversal restrictions OK");
} finally {
  if (original === undefined) delete process.env.LOCAL_MEDIA_STORAGE_DIR;
  else process.env.LOCAL_MEDIA_STORAGE_DIR = original;
  await rm(root, { recursive: true, force: true });
}
