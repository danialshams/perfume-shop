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

test("Chat anchors right, navigation overlays chat and mobile inputs do not trigger iOS Safari zoom",()=>{
 const css=read("app/fertini-engagement.css");
 assert.match(css,/\.support-root\{position:fixed;bottom:22px;right:22px;left:auto/);
 assert.match(css,/\.support-window\{position:absolute;bottom:72px;right:0;left:auto/);
 assert.match(css,/\.support-root\{right:12px;left:auto;bottom:/);
 assert.ok(css.includes(".maison-overlay{z-index:3200}"));
 assert.ok(css.includes("body:has([data-fertini-menu-open=\"true\"]) .support-root"));
 assert.match(css,/@media \(max-width:767px\)/);
 assert.match(css,/select\{font-size:16px!important\}/);
});

test("Fertini open mobile menu exposes a stable state for hiding the chat layer",()=>{
 const source=read("components/NavbarComponents/MobileMenuOverlay.tsx");
 assert.match(source,/data-fertini-menu-open=\{isOpen/);
});

test("Admin mutations accept genuine browser same-origin fetches behind reverse proxies without bypassing login",()=>{
 const route=read("app/api/v1/admin/engagement/route.ts");
 assert.match(route,/await requireAdmin\(req\)/);
 assert.match(route,/sec-fetch-site/);
 assert.match(route,/site==="same-origin"/);
 assert.match(route,/x-forwarded-host/);
 assert.match(route,/if\(!sameOriginWrite\(req\)\)/);
 assert.match(route,/مبدأ درخواست معتبر نیست/);
});
test("Open chat blocks page scroll and click-away dismisses with a smooth exit on all devices",()=>{
 const chat=read("components/maison/SupportChat.tsx");
 const css=read("app/fertini-engagement.css");
 assert.match(chat,/body\.style\.position="fixed"/);
 assert.match(chat,/window\.scrollTo\(0,y\)/);
 assert.match(chat,/support-backdrop/);
 assert.match(chat,/onClick=\{\(\)=>setOpen\(false\)\}/);
 assert.match(chat,/inert=\{!open\}/);
 assert.match(chat,/event\.key==="Escape"/);
 assert.match(css,/\.support-backdrop\.is-open/);
 assert.match(css,/\.support-window\.is-open/);
 assert.match(css,/transition:opacity \.3s ease,transform \.38s/);
});
