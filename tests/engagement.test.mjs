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

test("Admin chat writes enforce browser same-origin while accepting reverse proxy host rewrites",()=>{
 const route=read("app/api/v1/admin/engagement/route.ts");
 const helper=read("server/middlewares/admin-mutation-origin.ts");
 assert.match(route,/await requireAdmin\(req\)/);
 assert.match(route,/isSameOriginAdminMutation\(req\)/);
 assert.match(route,/invalid-origin/);
 assert.doesNotMatch(route,/new URL\(origin\)\.host!==req\.nextUrl\.host/);
 assert.match(helper,/sec-fetch-site/);
 assert.match(helper,/fetchSite === "cross-site"/);
 assert.match(helper,/fetchSite === "same-origin"/);
 assert.match(helper,/x-forwarded-host/);
});
test("Demo navigation and every coupon mutation use the same server-side admin rule",()=>{
 const proxy=read("proxy.ts");
 const auth=read("server/middlewares/admin.ts");
 assert.match(proxy,/if\(isFertiniPublicDemoAdminEnabled\(\)\)/);
 assert.match(auth,/if \(isFertiniPublicDemoAdminEnabled\(\)\)/);
 for(const path of ["app/api/v1/coupons/route.ts","app/api/v1/coupons/create/route.ts"]){
  const source=read(path);
  assert.doesNotMatch(source,/const admin = requireAdmin\(/);
  assert.match(source,/await requireAdmin\(request\)/);
  assert.match(source,/catch \{ return unauthorizedResponse/);
 }
});
test("Chat is a responsive modal with retained exit animation and storefront scroll lock",()=>{
 const chat=read("components/maison/SupportChat.tsx");
 const css=read("app/fertini-engagement.css");
 assert.match(chat,/className="support-backdrop"/);
 assert.match(chat,/onClick=\{\(\)=>setOpen\(false\)\}/);
 assert.match(chat,/body\.style\.position="fixed"/);
 assert.match(chat,/window\.scrollTo\(0,scrollY\)/);
 assert.match(chat,/event\.key==="Escape"/);
 assert.match(chat,/inert=\{!open\}/);
 assert.match(css,/\.support-root\.is-open \.support-window/);
 assert.match(css,/\.support-root\.is-open \.support-backdrop/);
 assert.match(css,/transition:opacity/);
});
