#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
import assert from "node:assert/strict";

function read(path) { return readFileSync(path, "utf8"); }
assert.equal(existsSync(".env"), false, "Do not commit .env with credentials");
const payment = read("server/services/payment.service.ts");
assert.match(payment, /process\.env\.NODE_ENV === "production"/);
assert.match(payment, /async createPaymentIntent[\s\S]*?assertSandboxAllowed\(\)/);
assert.match(payment, /async verifyPayment[\s\S]*?assertSandboxAllowed\(\)/);
const request = read("app/api/v1/payment/request/route.ts");
assert.match(request, /PAYMENT_GATEWAY_NOT_CONFIGURED/);
assert.match(request, /503/);
const cart = read("components/hooks/useCart.ts");
assert.match(cart, /return cart !== null && cart\.items\.length === 0/);
assert.match(cart, /throw err;/);
console.log("Commerce safety checks passed: no committed .env, sandbox disabled in production, cart errors propagate.");

const database = read("lib/db.ts");
assert.match(database, /function getPool\(\)/);
assert.match(database, /new Proxy\(/);
const upload = read("app/api/v1/uploads/products/route.ts");
assert.match(upload, /process\.env\.NODE_ENV === "production"/);
assert.match(upload, /503/);
