/** Disposable MySQL 8 service test. No production hosts or data accepted. */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import mysql from "mysql2/promise";
assert.equal(process.env.CI,"true");
assert.equal(process.env.DB_TEST_ALLOW,"ci-disposable");
assert.equal(process.env.DB_HOST,"127.0.0.1");
const name="fertini_ci_fresh";
const db=await mysql.createConnection({
  host:"127.0.0.1",port:Number(process.env.DB_PORT||3306),
  user:process.env.DB_USER,password:process.env.DB_PASSWORD,
});
try{
  await db.query("CREATE DATABASE "+name+" CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
  function run(script,confirm){
    return spawnSync(process.execPath,[script],{
      encoding:"utf8",timeout:90000,
      env:{...process.env,DB_NAME:name,NODE_ENV:"test",VERCEL:"",
        FERTINI_BOOTSTRAP_CONFIRM:confirm},
    });
  }
  const denied=run("scripts/bootstrap-fresh-mysql.mjs","NO");
  assert.notEqual(denied.status,0,"Explicit authorization must be required");
  const first=run("scripts/bootstrap-fresh-mysql.mjs","CREATE_EMPTY_DATABASE_SCHEMA");
  assert.equal(first.status,0,first.stderr+"\n"+first.stdout);
  const [tables]=await db.execute("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=?",[name]);
  const names=new Set(tables.map(x=>x.TABLE_NAME));
  for(const table of ["users","customers","customer_addresses","products","product_variants","product_images",
    "orders","order_items","payments","admin_notifications","storefront_content","scent_families"]){
    assert.ok(names.has(table),"Missing table: "+table);
  }
  const check=run("scripts/verify-database.mjs","");
  assert.equal(check.status,0,check.stderr+"\n"+check.stdout);
  const replay=run("scripts/bootstrap-fresh-mysql.mjs","CREATE_EMPTY_DATABASE_SCHEMA");
  assert.notEqual(replay.status,0,"Second run must reject a nonempty database");
  const [users]=await db.query("SELECT COUNT(*) AS n FROM "+name+".users");
  const [orders]=await db.query("SELECT COUNT(*) AS n FROM "+name+".orders");
  assert.equal(Number(users[0].n),0);
  assert.equal(Number(orders[0].n),0);
  console.log("Empty MySQL bootstrap, verification, no historical data, and replay guard passed.");
}finally{await db.end();}
