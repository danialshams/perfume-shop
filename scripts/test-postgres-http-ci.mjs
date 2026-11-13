import assert from "node:assert/strict";
import postgres from "postgres";
const base="http://127.0.0.1:3211";
const url=process.env.DATABASE_URL||"";
if(process.env.CI!=="true"||process.env.FERTINI_PG_TEST!=="isolated-disposable"||!url.includes("127.0.0.1:5432/fertini_ci")) {
 throw Error("Never run FERTINI HTTP integration tests outside disposable PostgreSQL CI");
}
const sql=postgres(url,{max:1});
const mail="ci-fertini-admin@example.invalid",password="ci-not-a-real-password-2026";
try{
 const setupPage=await fetch(base+"/admin/setup",{redirect:"manual"});
 assert.equal(setupPage.status,200,"First owner setup must not redirect to admin login");
 const setupBody={full_name:"CI FERTINI",email:mail,password,setup_code:process.env.FERTINI_BOOTSTRAP_TOKEN};
 const setup=await fetch(base+"/api/v1/admin/initialize",{
  method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(setupBody),
 });
 assert.equal(setup.status,201,"One-time first owner setup failed: "+await setup.text());
 const duplicate=await fetch(base+"/api/v1/admin/initialize",{
  method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(setupBody),
 });
 assert.equal(duplicate.status,409,"First owner setup must not run twice");
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

 const preflight=await read("/api/v1/admin/media-upload/start",{
   method:"POST",headers:{...auth,"Content-Type":"application/json"},
   body:JSON.stringify({kind:"image",name:"qa.jpg",type:"image/jpeg",size:16}),
 });
 assert.equal(preflight.status,200,"authenticated local media preflight failed: "+await preflight.text());
 const formImage=new FormData();
 formImage.append("file",new Blob([Uint8Array.of(255,216,255,224,0,0,0,0,0,0,0,0,0,0,0,0)],{type:"image/jpeg"}),"qa.jpg");
 const imageUpload=await read("/api/v1/uploads/products",{
   method:"POST",headers:auth,body:formImage,
 });
 assert.equal(imageUpload.status,201,"authenticated product image upload failed: "+await imageUpload.text());
 const imageData=await imageUpload.json();
 const imagePath=imageData.data?.url;
 assert.match(imagePath,/^\/api\/v1\/media\/products\/[0-9a-f-]{36}\.jpg$/);
 const imageRead=await read(imagePath);
 assert.equal(imageRead.status,200,"uploaded product image not publicly readable");
 assert.equal(imageRead.headers.get("content-type"),"image/jpeg");

 const formVoice=new FormData();
 formVoice.append("file",new Blob([Uint8Array.of(73,68,51,4,0,0,0,0,0,0,0,0,0,0,0,0)],{type:"audio/mpeg"}),"qa.mp3");
 const voiceUpload=await read("/api/v1/uploads/products/voice",{
   method:"POST",headers:auth,body:formVoice,
 });
 assert.equal(voiceUpload.status,201,"authenticated product voice upload failed: "+await voiceUpload.text());
 const voiceData=await voiceUpload.json();
 assert.match(voiceData.data?.url,/^\/api\/v1\/media\/products\/voices\/[0-9a-f-]{36}\.mp3$/);
 assert.equal((await read(voiceData.data.url)).status,200,"uploaded voice not publicly readable");

 const result=await read("/api/v1/admin/content",{headers:auth});
 assert.equal(result.status,200,"Admin studio API denied or database error");
 const data=await result.json();
 assert.equal(data.source,"database");
 assert.equal(data.products.length,12);
 assert.equal(data.content.bestsellerIds.length,6);
 const updated={...data.content,bestsellerTitle:"محصولات منتخب آزمایش PostgreSQL",
   latestTitle:"جدیدترین‌ها از پنل",footerCaption:"فوتر متصل به دیتابیس",
   heroSlides:data.content.heroSlides.slice(0,2).map((slide,index)=>({
     ...slide,alt:index===0?"FERTINI FIRST ADMIN EDIT":"FERTINI SECOND ADMIN EDIT"
   })),sectionOrder:["latest","bestsellers","families"]};
 const save=await read("/api/v1/admin/content",{
  method:"PUT",headers:{...auth,"Content-Type":"application/json"},
  body:JSON.stringify(updated),
 });
 assert.equal(save.status,200,"Homepage save API failed: "+await save.text());
 const after=await read("/api/v1/admin/content",{headers:auth});
 const reloaded=await after.json();
 assert.equal(reloaded.content.bestsellerTitle,updated.bestsellerTitle,"Homepage setting was not persisted");
 const renderedHome=await read("/");
 assert.equal(renderedHome.status,200);
 const renderedHtml=await renderedHome.text();
 for(const expected of [updated.bestsellerTitle,updated.latestTitle,updated.footerCaption,updated.heroSlides[0].alt]){
   assert.ok(renderedHtml.includes(expected),"Homepage must reflect saved admin content: "+expected);
 }
 assert.ok(renderedHtml.indexOf(updated.latestTitle)<renderedHtml.indexOf(updated.bestsellerTitle),
   "Homepage must respect saved section order");
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

 const [family]=await sql.unsafe("SELECT id FROM scent_families WHERE slug='woody'");
 const cats=await sql.unsafe("SELECT id,slug FROM categories WHERE slug IN ('fertini-woody','fertini-floral')");
 const parent=Number(cats.find(x=>x.slug==="fertini-woody").id);
 const child=Number(cats.find(x=>x.slug==="fertini-floral").id);
 const body={name:"FERTINI QA",slug:"fertini-ci-qa",type:"SINGLE",status:"DRAFT",
  scent_family_id:Number(family.id),category_id:child,parent_category_id:parent,
  category_links:[{parent_id:parent,child_id:child}],images:[],
  variants:[{volume_ml:75,price:190000,stock_qty:4,is_active:true}]};
 const creation=await read("/api/v1/products",{method:"POST",
  headers:{...auth,"Content-Type":"application/json"},body:JSON.stringify(body)});
 const creationPayload=await creation.text();
 assert.equal(creation.status,201,"product create failed "+creationPayload);
 const record=JSON.parse(creationPayload);
 const id=Number(record.data?.id);
 assert.ok(id>0);
 assert.equal((await read("/api/v1/products/"+id)).status,404);
 const update=await read("/api/v1/products/"+id,{method:"PUT",
  headers:{...auth,"Content-Type":"application/json"},
  body:JSON.stringify({status:"ACTIVE",name:"FERTINI QA published"})});
 assert.equal(update.status,200,"product publish failed "+await update.text());
 assert.equal((await read("/api/v1/products/"+id)).status,200);
 const visible=await read("/api/v1/admin/content",{headers:auth});
 assert.equal(visible.status,200);
 const selected={...(await visible.json()).content,bestsellerIds:["db:"+id]};
 const chosen=await read("/api/v1/admin/content",{method:"PUT",
   headers:{...auth,"Content-Type":"application/json"},body:JSON.stringify(selected)});
 assert.equal(chosen.status,200,"Newly published product must be selectable in admin");
 const productHome=await read("/");
 assert.equal(productHome.status,200);
 const productHtml=await productHome.text();
 assert.ok(productHtml.includes("FERTINI QA published"),"Published product should render on homepage");
 assert.ok(productHtml.includes("/products/"+id),"Home links to its real database product");
 const [variant]=await sql.unsafe("SELECT id FROM product_variants WHERE product_id=$1",[id]);
 const cart=await read("/api/v1/cart/items",{method:"POST",
  headers:{"Content-Type":"application/json"},body:JSON.stringify({variant_id:Number(variant.id),quantity:1})});
 assert.equal(cart.status,200,"cart add failed "+await cart.text());
 const guestCartToken=(cart.headers.get("set-cookie")||"").match(/cart_token=[^;]+/);
 assert.ok(guestCartToken);
 const cartRead=await read("/api/v1/cart",{headers:{cookie:guestCartToken[0]}});
 const cartPayload=await cartRead.text();
 assert.equal(cartRead.status,200,"cart read failed "+cartPayload);
 const cartJson=JSON.parse(cartPayload);
 assert.equal(cartJson.data?.items?.length,1);
 // Editing the hero and headings must work even before publishing any products.
 await sql.unsafe("UPDATE products SET status='DRAFT'");
 const empty=await read("/api/v1/admin/content",{headers:auth});
 assert.equal(empty.status,200);
 const state=await empty.json();
 assert.equal(state.products.length,0);
 assert.deepEqual(state.content.bestsellerIds,[]);
 assert.deepEqual(state.content.latestIds,[]);
 const copy={...state.content,bestsellerTitle:"هیرو و متن‌ها بدون محصول"};
 const saveEmpty=await read("/api/v1/admin/content",{
   method:"PUT",headers:{...auth,"Content-Type":"application/json"},body:JSON.stringify(copy)});
 assert.equal(saveEmpty.status,200,"Empty catalog should still permit homepage editing");
 const emptyHome=await read("/");
 assert.equal(emptyHome.status,200);
 const emptyHtml=await emptyHome.text();
 assert.ok(emptyHtml.includes(copy.bestsellerTitle));
 assert.ok(!emptyHtml.includes("FERTINI QA published"),"Draft products must be hidden");
 const [dbRow]=await sql.unsafe("SELECT content_json FROM storefront_content WHERE id=1");
 assert.equal(JSON.parse(dbRow.content_json).bestsellerTitle,copy.bestsellerTitle);
 console.log("POSTGRES LIVE HTTP SUCCESS: catalog, admin login, homepage save/read, invalid ID, overview, health, notifications.");
}finally{await sql.end();}
