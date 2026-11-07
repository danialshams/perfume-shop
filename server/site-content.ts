import "server-only";
import {db} from "@/lib/db";
import type {RowDataPacket} from "mysql2";
import {DEFAULT_SITE_CONTENT,parseContent,type FertiniSiteContent} from "@/lib/fertini-site-content";
type SectionRow=RowDataPacket&{content_json:string};
export async function readSiteContent():Promise<FertiniSiteContent>{
 const [rows]=await db.execute<SectionRow[]>("SELECT content_json FROM storefront_content WHERE id = 1 LIMIT 1");
 if(!rows[0])return DEFAULT_SITE_CONTENT;
 try{const value=typeof rows[0].content_json==="string"?JSON.parse(rows[0].content_json):rows[0].content_json;
 return parseContent(value)}catch{return DEFAULT_SITE_CONTENT}
}
export async function writeSiteContent(content:FertiniSiteContent){
 await db.execute(
  "INSERT INTO storefront_content (id,content_json,updated_at) VALUES (1,?,NOW()) ON CONFLICT (id) DO UPDATE SET content_json=EXCLUDED.content_json,updated_at=NOW()",
  [JSON.stringify(content)]
 );
}
