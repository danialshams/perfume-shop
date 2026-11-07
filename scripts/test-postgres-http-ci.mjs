import assert from "node:assert/strict";
import postgres from "postgres";
import bcrypt from "bcryptjs";
const base="http://127.0.0.1:3211";
const url=process.env.DATABASE_URL||"";
if(process.env.CI!=="true"||process.env.FERTINI_PG_TEST!=="isolated-disposable"||!url.includes("127.0.0.1:5432/fertini_ci")) {
 throw Error("Never run FERTINI HTTP integration tests outside disposable PostgreSQL CI");
}
const sql=postgres(url,{max:1});
const mail="ci-fertini-admin@example.invalid",password="ci-not-a-real-password-2026";
try{
 const hash=await bcrypt.hash(password,10);
 await sql.unsafe("INSERT INTO users (full_name,email,password_hash,role,status,is_active) VALUES ('CI FERTINI', $1,$2,'ADMIN','ACTIVE',1)",[mail,hash]);
 const read=async(path,init)=>fetch(base+path,init);
 const home=await read("/");
 assert.equal(home.status,200,"Home must render with active PostgreSQL catalog");
 const html=await home.text();
 assert.ok(html.includes("FERTINI"),"Homepage should display showroom branding");
 const products=await read("/api/v1/products?limit=20&page=1");
 assert.equal(products.status,200,"Public product API failed: "+products.status);
 const catalog=await products.json();
 assert.equal(catalog.success,true);
 assert.equal(catalog.data?.items?.length,12,"Catalog should list 12 active demo products");
 const login=await read("/api/v1/auth/login",{
  method:"POST",headers:{"Content-Type":"application/json"},
  body:JSON.stringify({email:mail,password}),
 });
 assert.equal(login.status,200,"Admin login failed: "+await login.text());
 const cookies=login.headers.get("set-cookie")||"";
 const token=cookies.match(/admin_access_token=[^;]+/);
 assert.ok(token,"Admin session cookie was not issued");
 const auth={cookie:token[0]};
 const result=await read("/api/v1/admin/content",{headers:auth});
 assert.equal(result.status,200,"Admin studio API denied or database error");
 const data=await result.json();
 assert.equal(data.source,"database");
 assert.equal(data.products.length,12);
 assert.equal(data.content.bestsellerIds.length,6);
 const updated={...data.content,bestsellerTitle:"محصولات منتخب آزمایش PostgreSQL"};
 const save=await read("/api/v1/admin/content",{
  method:"PUT",headers:{...auth,"Content-Type":"application/json"},
  body:JSON.stringify(updated),
 });
 assert.equal(save.status,200,"Homepage save API failed: "+await save.text());
 const after=await read("/api/v1/admin/content",{headers:auth});
 const reloaded=await after.json();
 assert.equal(reloaded.content.bestsellerTitle,updated.bestsellerTitle,"Homepage setting was not persisted");
 const invalid={...updated,bestsellerIds:["db:999999999"]};
 const denied=await read("/api/v1/admin/content",{
  method:"PUT",headers:{...auth,"Content-Type":"application/json"},
  body:JSON.stringify(invalid),
 });
 assert.equal(denied.status,422,"Cannot allow product IDs that are not published");
 const overview=await read("/api/v1/admin/overview",{headers:auth});
 assert.equal(overview.status,200,"Dashboard SQL should work against PostgreSQL");
 const stats=await overview.json();
 assert.equal(stats.products,12);
 const health=await read("/api/v1/admin/health",{headers:auth});
 assert.equal(health.status,200,"PostgreSQL health endpoint failed");
 assert.equal((await health.json()).connected,true);
 const bell=await read("/api/v1/notifications",{headers:auth});
 assert.equal(bell.status,200,"Notifications should read PostgreSQL database");
 const notices=await bell.json();assert.equal(notices.unread_count,0);
 const [dbRow]=await sql.unsafe("SELECT content_json FROM storefront_content WHERE id=1");
 assert.equal(JSON.parse(dbRow.content_json).bestsellerTitle,updated.bestsellerTitle);
 console.log("POSTGRES LIVE HTTP SUCCESS: catalog, admin login, homepage save/read, invalid ID, overview, health, notifications.");
}finally{await sql.end();}
