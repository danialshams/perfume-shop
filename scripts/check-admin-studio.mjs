import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");
const shell=read("components/admin/admin-shell.tsx");
const sidebar=read("components/admin/admin-sidebar.tsx");
const stylesheet=read("app/admin/(panel)/fertini-studio.css");
const auth=read("app/admin/(panel)/layout.tsx");
const storage=read("server/storage/save-media.ts");
const notifications=read("app/api/v1/notifications/stream/route.ts");
const content=read("app/admin/(panel)/content/page.tsx");
const migration=read("database/migrations/002_storefront_content.sql");
for(const route of ["content","products","categories","orders","sliders","media","database"]){
 assert.match(sidebar,new RegExp("/admin/"+route));
}
assert.match(shell,/fst-mobile-bottom/);
assert.match(stylesheet,/@media\(max-width:820px\)/);
assert.match(auth,/requireAuth/);
assert.match(auth,/role==="ADMIN"/);
assert.match(notifications,/adminNotificationService\.getInitialState/);
assert.match(notifications,/setInterval/);
assert.match(storage,/validateMediaBytes/);
assert.match(storage,/putObject/);
assert.match(content,/method:"PUT"/);
assert.match(read("app/page.tsx"),/readSiteContent/);
assert.match(migration,/CREATE TABLE IF NOT EXISTS storefront_content/);
assert.doesNotMatch(migration,/\bDROP\s+TABLE\b/i);
console.log("Authenticated editor, management navigation, storage, DB migration and live notifications wired.");
