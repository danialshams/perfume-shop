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
const mediaStorage = read("server/storage/save-media.ts");
assert.match(upload, /saveMedia/);
assert.match(upload, /StorageNotConfiguredError/);
assert.match(upload, /503/);
assert.match(mediaStorage, /process\.env\.NODE_ENV==="production"/);
assert.match(mediaStorage, /process\.env\.VERCEL==="1"/);
assert.match(mediaStorage, /validateMediaBytes/);
assert.match(mediaStorage, /putObject/);

const account = read("app/account/page.tsx");
assert.doesNotMatch(account, /NEXT_PUBLIC_API_BASE_URL/);
assert.match(account, /customerAuthService\.me/);

const productApi = read("lib/product.ts");
assert.doesNotMatch(productApi, /"http:\/\/localhost:3000"/);
assert.match(productApi, /typeof window === "undefined"/);
const apiClient = read("lib/api.ts");
assert.doesNotMatch(apiClient, /"http:\/\/localhost:3000"/);
assert.match(apiClient, /typeof window === "undefined"/);

const checkoutRoute = read("app/api/v1/checkout/route.ts");
assert.match(checkoutRoute, /process\.env\.NODE_ENV === "production"/);
assert.match(checkoutRoute, /503/);
const checkoutPage = read("app/checkout/page.tsx");
assert.match(checkoutPage, /!checkoutAvailable/);

const publicCatalog = read("app/api/v1/products/route.ts");
const detail = read("app/api/v1/products/[id]/route.ts");
const productPage = read("app/products/[id]/page.tsx");
assert.match(publicCatalog, /status: "ACTIVE"/);
assert.match(publicCatalog, /visiblePublicVariants/);
assert.match(detail, /isPublicProduct\(result\)/);
assert.match(productPage, /isPublicProduct\(result\)/);
const payments = read("server/services/payment.service.ts");
assert.match(payments, /process\.env\.VERCEL === "1"/);

const productsHook = read("components/hooks/useProductsPageData.ts");
assert.match(productsHook, /limit=100&page=/);
assert.match(productsHook, /Promise\.all\(numbers\.map\(fetchPage\)\)/);

const notificationPaths = [
  "app/api/v1/notifications/route.ts",
  "app/api/v1/notifications/stream/route.ts",
  "app/api/v1/notifications/read-all/route.ts",
  "app/api/v1/notifications/[id]/route.ts",
  "app/api/v1/notifications/[id]/read/route.ts",
];
for (const path of notificationPaths) {
  assert.match(read(path), /rejectNonAdminNotificationRequest\(request\)/,
    "Publicly accessible admin notifications: " + path);
}
assert.match(read("components/hooks/use-admin-notifications.ts"), /visibilityState/);

const dbMigration = read("database/migrations/001_products_publication_state.sql");
assert.match(dbMigration, /information_schema.COLUMNS/);
assert.match(dbMigration, /ADD COLUMN status/);
const paymentScreen = read("app/payment/result/page.tsx");
assert.doesNotMatch(paymentScreen, /status === "success"/);
assert.match(paymentScreen, /در حال بررسی/);

const adminSignup = read("app/api/v1/auth/register/route.ts");
assert.doesNotMatch(adminSignup, /authService\.register/);
assert.match(adminSignup, /403/);

const loginPage = read("app/login/page.tsx");
assert.match(loginPage, /handleLogin/);
assert.match(loginPage, /\/api\/v1\/customers\/auth\/login/);
assert.match(loginPage, /startsWith\("\/\/"\)/);

const sandboxPayment = read("app/sandbox/payment/page.tsx");
const callback = read("app/api/v1/payment/callback/route.ts");
assert.match(sandboxPayment, /process\.env\.NODE_ENV === "production"/);
assert.match(callback, /process\.env\.VERCEL === "1"/);
const searchEndpoint = read("app/api/v1/products/search/route.ts");
assert.doesNotMatch(searchEndpoint, /Failed to search products", 500, \{/);

const cartApi = read("app/api/v1/cart/route.ts");
assert.doesNotMatch(cartApi, /message,\s*\}/);
const addCartApi = read("app/api/v1/cart/items/route.ts");
assert.doesNotMatch(addCartApi, /CART_POST_COOKIE_TOKEN/);
const cartClient = read("app/cart/CartClient.tsx");
assert.doesNotMatch(cartClient, /\{error \|\|/);
