/**
 * FERTINI MySQL release gate: READ ONLY. Set DB_* in the environment or .env.local.
 * Exit 1 when the application cannot connect or required schema objects are missing.
 */
import { existsSync } from "node:fs";
import { config } from "dotenv";
import mysql from "mysql2/promise";

if (existsSync(".env.local")) config({path:".env.local",override:false});
const needed=["DB_HOST","DB_USER","DB_NAME"];
const missing=needed.filter(key=>!process.env[key]?.trim());
if(missing.length){
 console.error("Missing database configuration: "+missing.join(", "));
 process.exit(1);
}
const host=process.env.DB_HOST.trim();
if(process.env.VERCEL==="1"&&["localhost","127.0.0.1","::1"].includes(host.toLowerCase())){
 console.error("DB_HOST cannot point to localhost from a Vercel function.");
 process.exit(1);
}
const mode=(process.env.DB_SSL_MODE||"disabled").toLowerCase();
if(!["disabled","required"].includes(mode)){
 console.error("Invalid DB_SSL_MODE. Use disabled or required.");
 process.exit(1);
}
const required={
 users:["id","role","password_hash"],
 customers:["id","mobile","password_hash","first_name","last_name"],
 customer_addresses:["id","customer_id"],
 products:["id","name","status","deleted_at","voice_file"],
 product_variants:["id","product_id","price","stock_qty","status"],
 product_images:["id","product_id","image_url"],
 categories:["id","name"],
 orders:["id","order_number","customer_id","cart_id","shipping_floor","payment_status"],
 order_items:["id","order_id","product_id","variant_id"],
 payments:["id","order_id","status"],
 admin_notifications:["id","type","entity_id","is_read","created_at"],
 storefront_content:["id"],
};
let connection;
try{
 connection=await mysql.createConnection({
  host,port:Number(process.env.DB_PORT||3306),
  user:process.env.DB_USER,password:process.env.DB_PASSWORD||"",
  database:process.env.DB_NAME,connectTimeout:10000,
  ssl:mode==="required"?{rejectUnauthorized:true,...(process.env.DB_SSL_CA?{ca:process.env.DB_SSL_CA.replace(/\\n/g,"\n")}:{})}:undefined,
 });
 await connection.query("SELECT 1");
 const [rows]=await connection.query("SELECT TABLE_NAME,COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE()");
 const present=new Set(rows.map(row=>row.TABLE_NAME+"."+row.COLUMN_NAME));
 const violations=Object.entries(required).flatMap(([table,columns])=>columns.filter(col=>!present.has(table+"."+col)).map(col=>table+"."+col));
 if(violations.length){
  console.error("Database schema is not compatible. Missing table/column entries:\n"+violations.map(x=>" - "+x).join("\n"));
  process.exitCode=1;
 }else{
  console.log("MySQL connection OK; checked "+Object.keys(required).length+" required tables and their columns.");
 }
}catch(error){
 const code=error&&typeof error==="object"&&"code" in error?String(error.code):"UNKNOWN";
 console.error("MySQL verification failed (redacted): "+code);
 process.exitCode=1;
}finally{
 await connection?.end().catch(()=>{});
}
