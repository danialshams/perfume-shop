import "server-only";
import type { RowDataPacket } from "mysql2/promise";
import { db } from "@/lib/db";
import type { HomeProduct } from "@/lib/fertini-home-products";

type ProductRow = RowDataPacket & {
  id: number; name: string; image_url: string | null;
  scent_family: string | null; unit_price: string | number | null; is_best_seller: number | boolean;
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

/** Reads published products from the shared database for both storefront and admin editor. */
export async function listHomeProducts(): Promise<HomeProduct[]> {
  const sql = [
    "SELECT p.id,p.name,COALESCE(sf.name,p.scent_family) AS scent_family,p.is_best_seller,",
    "COALESCE((SELECT i.image_url FROM product_images i WHERE i.product_id=p.id",
    "ORDER BY i.is_main DESC,i.sort_order ASC,i.id ASC LIMIT 1),p.image) AS image_url,",
    "(SELECT MIN(CASE WHEN v.discount_price>0 AND v.discount_price<v.price",
    "THEN v.discount_price ELSE v.price END) FROM product_variants v",
    "WHERE v.product_id=p.id AND v.deleted_at IS NULL AND v.is_active=1 AND v.status='ACTIVE') AS unit_price",
    "FROM products p LEFT JOIN scent_families sf ON sf.id=p.scent_family_id",
    "WHERE p.deleted_at IS NULL AND p.is_active=1 AND p.status='ACTIVE'",
    "ORDER BY p.id DESC LIMIT 500",
  ].join(" ");
  const [rows] = await db.query<ProductRow[]>(sql);
  return rows.map(row => ({
    id: "db:" + Number(row.id), numericId: Number(row.id), name: row.name,
    subtitle: row.scent_family?.replaceAll("_", " ") || "EAU DE PARFUM",
    image: safePhoto(row.image_url),
    price: row.unit_price === null ? null : Number(row.unit_price),
    href: "/products/" + Number(row.id),
    featured: Boolean(row.is_best_seller), isDemo: false,
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
