import "server-only";
import {db} from "@/lib/db";
import type {RowDataPacket} from "mysql2";
import {DEFAULT_SITE_CONTENT,parseContent,type FertiniSiteContent} from "@/lib/fertini-site-content";
import {seoConfigSchema,type FertiniSeoConfig} from "@/lib/fertini-seo";
type SectionRow=RowDataPacket&{content_json:string};
function decode(raw:unknown):FertiniSiteContent {
  if(typeof raw==="string"){try{return parseContent(JSON.parse(raw))}catch{return DEFAULT_SITE_CONTENT}}
  return parseContent(raw);
}
export async function readSiteContent():Promise<FertiniSiteContent>{
  const [rows]=await db.execute<SectionRow[]>("SELECT content_json FROM storefront_content WHERE id = 1 LIMIT 1");
  return rows[0]?decode(rows[0].content_json):DEFAULT_SITE_CONTENT;
}

/** Atomic writes to the existing singleton JSON row; SEO and homepage editors
 * never overwrite each other's changes or require a new database migration. */
async function updateStoredContent(
  change:(current:FertiniSiteContent)=>FertiniSiteContent,
):Promise<FertiniSiteContent>{
  const connection=await db.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query(
      "INSERT INTO storefront_content (id,content_json,updated_at) VALUES (1,?,NOW()) ON CONFLICT (id) DO NOTHING",
      [JSON.stringify(DEFAULT_SITE_CONTENT)],
    );
    const [rows]=await connection.query<SectionRow[]>(
      "SELECT content_json FROM storefront_content WHERE id = 1 FOR UPDATE",
    );
    const next=change(rows[0]?decode(rows[0].content_json):DEFAULT_SITE_CONTENT);
    await connection.query(
      "UPDATE storefront_content SET content_json=?,updated_at=NOW() WHERE id=1",
      [JSON.stringify(next)],
    );
    await connection.commit();
    return next;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
}

export async function writeSiteContent(content:FertiniSiteContent){
  return updateStoredContent(current=>({...content,seo:current.seo}));
}
export async function writeSiteSeo(value:FertiniSeoConfig):Promise<FertiniSeoConfig>{
  const parsed=seoConfigSchema.parse(value);
  const next=await updateStoredContent(current=>({...current,seo:parsed}));
  return next.seo;
}
