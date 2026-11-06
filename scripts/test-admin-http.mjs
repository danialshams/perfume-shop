import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
const base="http://127.0.0.1:3100";
const secret=process.env.JWT_ACCESS_SECRET;
if(!secret)throw Error("Test JWT secret not configured");
const token=jwt.sign({userId:1,role:"ADMIN",email:"ci-test@local.invalid"},secret,{expiresIn:"10m"});
const authenticated={"Cookie":"admin_access_token="+token};
async function get(path,auth=false){return fetch(base+path,{headers:auth?authenticated:{},redirect:"manual"})}
for(const path of ["/api/v1/admin/records/customers","/api/v1/admin/content","/api/v1/admin/health","/api/v1/notifications/stream"]){
 const r=await get(path);
 assert.equal(r.status,403,"Unauthorized access allowed to "+path);
 await r.body?.cancel();
}
const invalidContent=await fetch(base+"/api/v1/admin/content",{method:"PUT",headers:{...authenticated,"content-type":"application/json"},body:JSON.stringify({heroSlides:[]})});
assert.equal(invalidContent.status,422,"Malformed editorial content must be rejected");
const invalidEdit=await fetch(base+"/api/v1/admin/records/reviews",{method:"PATCH",headers:{...authenticated,"content-type":"application/json"},body:JSON.stringify({id:0,status:"APPROVED"})});
assert.equal(invalidEdit.status,422,"Nonpositive record ID must be rejected");
const invalidCoupon=await fetch(base+"/api/v1/admin/records/coupons",{method:"POST",headers:{...authenticated,"content-type":"application/json"},body:JSON.stringify({code:"TEST",discount_type:"PERCENT",discount_value:120})});
assert.equal(invalidCoupon.status,422,"Coupon percentages >100 must be rejected");
async function upload(route,name,type,bytes,expected){
 const body=new FormData();
 body.append("file",new File([bytes],name,{type}));
 const r=await fetch(base+route,{method:"POST",headers:authenticated,body});
 assert.equal(r.status,expected,route+" "+name+" returned "+r.status+" instead of "+expected+": "+(await r.text()).slice(0,230));
}
const png=Uint8Array.from([137,80,78,71,13,10,26,10,0,0,0,0,0,0,0,0]);
const mp3=Uint8Array.from([73,68,51,4,0,0,0,0,0,0,1,2]);
await upload("/api/v1/uploads/products","invalid.svg","image/svg+xml",png,400);
await upload("/api/v1/uploads/products","corrupt.png","image/png",new TextEncoder().encode("<script>alert(1)</script>"),400);
await upload("/api/v1/uploads/products/voice","fake.mp3","audio/mpeg",new TextEncoder().encode("not a real mp3"),400);
await upload("/api/v1/uploads/products","demo.png","image/png",png,503);
await upload("/api/v1/uploads/products/voice","demo.mp3","audio/mpeg",mp3,503);
console.log("Admin HTTP authorization, editor validation, coupon bounds, and media rejection/503 storage gating passed.");
