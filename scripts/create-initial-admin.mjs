/** Create the FIRST admin in an empty FERTINI database. Never print credentials. */
import { existsSync } from "node:fs";
import { config } from "dotenv";
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";
if(existsSync(".env.local"))config({path:".env.local",override:false});
if(process.env.NODE_ENV==="production"||process.env.VERCEL==="1"||
  process.env.FERTINI_CREATE_ADMIN_CONFIRM!=="CREATE_FIRST_ADMIN"){
  console.error("Refusing admin setup without explicit local confirmation.");process.exit(1);
}
const email=(process.env.FERTINI_ADMIN_EMAIL||"").trim().toLowerCase();
const password=process.env.FERTINI_ADMIN_PASSWORD||"";
const name=(process.env.FERTINI_ADMIN_NAME||"FERTINI Administrator").trim();
if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||password.length<14||name.length<2||
  !process.env.DB_HOST||!process.env.DB_NAME||!process.env.DB_USER){
  console.error("Provide DB_*, FERTINI_ADMIN_EMAIL, FERTINI_ADMIN_NAME and password >=14 characters.");
  process.exit(1);
}
let connection;
try{
  connection=await mysql.createConnection({
    host:process.env.DB_HOST,port:Number(process.env.DB_PORT||3306),
    database:process.env.DB_NAME,user:process.env.DB_USER,password:process.env.DB_PASSWORD||"",
    connectTimeout:10000,
    ssl:process.env.DB_SSL_MODE==="required"?{rejectUnauthorized:true,...(process.env.DB_SSL_CA?
      {ca:process.env.DB_SSL_CA.replace(/\\n/g,"\n")}: {})}:undefined,
  });
  const [rows]=await connection.query("SELECT COUNT(*) AS count FROM users WHERE role='ADMIN' AND deleted_at IS NULL");
  if(Number(rows[0].count)!==0)throw Error("An admin already exists. Refusing duplicate admin.");
  const hash=await bcrypt.hash(password,12);
  await connection.execute("INSERT INTO users (full_name,email,password_hash,role,status,is_active) VALUES (?, ?, ?, 'ADMIN','ACTIVE',1)",[name,email,hash]);
  console.log("Initial administrator created successfully.");
}catch(error){
  console.error("Admin setup failed: "+(error&&typeof error==="object"&&"code"in error?error.code:error.message));
  process.exitCode=1;
}finally{await connection?.end().catch(()=>{});}
