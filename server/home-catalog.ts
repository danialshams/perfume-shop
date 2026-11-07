import "server-only";
import type { RowDataPacket } from "mysql2/promise";
import { db } from "@/lib/db";
import type { HomeProduct } from "@/lib/fertini-home-products";

type ProductRow = RowDataPacket & {
  id: number; name: string; image_url: string | null;
  perfume_type: string | null; unit_price: string | number | null; is_featured: number | boolean;
};
type FamilyRow = RowDataPacket & { id: number; name: string };

function safePhoto(raw: string | null): string {
  if (!raw) return "/fertini/hero-01.svg";
  const src = raw.trim();
  if (src.startsWith("/") && !src.startsWith("//") && !src.includes("..") && !src.includes("\\")) return src;
  if (/^https:\/\/[^\s\\]+$/i.test(src)) return src;
  if (/^[a-zA-Z0-9_/-]+\.(?:jpg|jpeg|png|webp)$/i.test(src) && !src.includes("..")) return "/" + src;
  return "/fertini/hero-01.svg";
}

/** Reads the existing MySQL catalog; no new products or tables are created. */
export async function listHomeProducts(): Promise<HomeProduct[]> {
  const sql = [
    "SELECT p.id,p.name,p.perfume_type,p.is_featured,",
    "COALESCE((SELECT i.image_url FROM product_images i WHERE i.product_id=p.id",
    "ORDER BY i.is_main DESC,i.sort_order ASC,i.id ASC LIMIT 1),p.image) AS image_url,",
    "(SELECT MIN(CASE WHEN v.discount_price>0 AND v.discount_price<v.price",
    "THEN v.discount_price ELSE v.price END) FROM product_variants v",
    "WHERE v.product_id=p.id AND v.deleted_at IS NULL AND v.is_active=1 AND v.status='ACTIVE') AS unit_price",
    "FROM products p WHERE p.deleted_at IS NULL AND p.is_active=1 AND p.status='ACTIVE'",
    "ORDER BY p.id DESC LIMIT 500",
  ].join(" ");
  const [rows] = await db.query<ProductRow[]>(sql);
  return rows.map(row => ({
    id: "db:" + Number(row.id), numericId: Number(row.id), name: row.name,
    subtitle: row.perfume_type?.replaceAll("_", " ") || "EAU DE PARFUM",
    image: safePhoto(row.image_url),
    price: row.unit_price === null ? null : Number(row.unit_price),
    href: "/products/" + Number(row.id),
    featured: Boolean(row.is_featured), isDemo: false,
  }));
}
export async function listHomeCategories(): Promise<Array<{ id: number; name: string }>> {
  const [rows] = await db.query<FamilyRow[]>("SELECT id,name FROM categories WHERE deleted_at IS NULL AND is_active=1 ORDER BY name ASC LIMIT 200");
  return rows.map(x => ({ id: Number(x.id), name: x.name }));
}
export async function listHomeScentFamilies(): Promise<Array<{ id: number; name: string }>> {
  const [rows] = await db.query<FamilyRow[]>("SELECT id,name FROM scent_families WHERE is_active=1 ORDER BY name ASC LIMIT 100");
  return rows.map(x => ({ id: Number(x.id), name: x.name }));
}
