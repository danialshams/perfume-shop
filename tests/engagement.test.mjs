import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("Fertini recommendations use the real catalog's exact scent_family_id",()=>{
 const api=read("app/api/v1/engagement/route.ts");
 assert.match(api,/type==="related"/);
 assert.match(api,/p\.scent_family_id=\(SELECT scent_family_id FROM products WHERE id=\?/);
 assert.match(api,/p\.id<>\?/);
 assert.match(read("components/HomeProductsPage/ProductDetailPage.tsx"),/<FertiniRelated productId=/);
});
test("Visitor starts chat with name/subject only and a protected token",()=>{
 const view=read("components/maison/SupportChat.tsx");
 const route=read("app/api/v1/engagement/route.ts");
 assert.match(view,/موضوع گفتگو<select/);
 assert.match(view,/نام<input/);
 assert.doesNotMatch(view,/type="email"|type="tel"|name="phone"|name="email"/);
 assert.match(route,/randomBytes\(32\)/);
 assert.match(route,/x-support-token/);
});
test("Text reviews and FAQ have editable administrator replies and moderation",()=>{
 const route=read("app/api/v1/admin/engagement/route.ts");
 const ddl=read("database/migrations/004_customer_support_faq_text_reviews.sql");
 const ui=read("components/admin/EngagementAdmin.tsx");
 assert.match(route,/action==="reviewReply"/);
 assert.match(route,/action==="faqReply"/);
 assert.match(ddl,/admin_reply/);
 assert.match(ddl,/DROP NOT NULL/);
 assert.match(ddl,/support_faq/);
 assert.match(ui,/دیدگاه‌ها/);
});
test("Fertini design presents floating bubble and responsive mobile layout",()=>{
 const css=read("app/fertini-engagement.css");
 assert.match(css,/border-radius:50%/);
 assert.match(css,/@media\(max-width:520px\)/);
 assert.match(read("app/layout.tsx"),/<SupportChat\/>/);
});

test("Temporary no-login admin can only read and reply to demo-tagged chat threads",()=>{
 const admin=read("app/api/v1/admin/engagement/route.ts");
 const visitor=read("app/api/v1/engagement/route.ts");
 const auth=read("server/middlewares/admin.ts");
 const layout=read("app/admin/(panel)/layout.tsx");
 assert.match(visitor,/demoHash\(token\)/);
 assert.match(admin,/token_hash LIKE/);
 assert.match(admin,/demoThread\.length/);
 assert.match(auth,/isFertiniPublicDemoAdminEnabled\(\)/);
 assert.match(layout,/if\(isFertiniPublicDemoAdminEnabled\(\)\)/);
});
