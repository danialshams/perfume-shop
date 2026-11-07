/** Portable PostgreSQL read-only release gate for Neon or any Node-capable hosting. */
import { existsSync } from "node:fs";
import { config } from "dotenv";
import postgres from "postgres";
if(existsSync(".env.local"))config({path:".env.local",override:false});
if(!/^postgres(?:ql)?:\/\//i.test(process.env.DATABASE_URL||"")){
 console.error("Missing PostgreSQL DATABASE_URL");process.exit(1);
}
const sql=postgres(process.env.DATABASE_URL,{max:1,connect_timeout:10});
try{
 const rows=await sql.unsafe("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
 const tables=new Set(rows.map(x=>x.table_name));
 const required=["users","customers","products","product_variants","product_images","orders","payments","admin_notifications","storefront_content"];
 const missing=required.filter(x=>!tables.has(x));
 if(missing.length){console.error("Missing PostgreSQL tables: "+missing.join(", "));process.exitCode=1;}
 else{
  const [products]=await sql.unsafe("SELECT COUNT(*) AS total FROM products WHERE status='ACTIVE' AND deleted_at IS NULL");
  console.log("PostgreSQL connection OK; tables="+tables.size+" publishedProducts="+products.total);
 }
}catch(e){console.error("PostgreSQL check failed: "+(e&&typeof e==="object"&&"code"in e?e.code:"UNKNOWN"));process.exitCode=1;}
finally{await sql.end().catch(()=>{});}
