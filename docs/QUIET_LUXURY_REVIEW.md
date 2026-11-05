# MAISON — Quiet Luxury / Cinema (Design Review)

## Safety, rollback, deployment

- **Original untouched baseline:** `493a8fe5c01b2c7dbe3e262936757a84ad901150`
- **Immutable starting-point branch:** `backup/before-quiet-luxury-20261105`
- **Current experimental branch:** `feature/quiet-luxury-cinematic-v2-20261105`
- **Draft PR:** https://github.com/danialshams/perfume-shop/pull/1
- **Production:** Do not merge to `main` or deploy to Vercel until full production build, baseline TypeScript debt, business flow tests, image migration and manual responsive browser review pass.
- **Preview deployments:** disabled at the Vercel project level to avoid quota use.
- **Rollback:** If not merged, discard the draft PR and experiment branches; `main` is unchanged. If eventually merged and disapproved, restore baseline selectively using a new audited revert PR; do not `git reset --hard` on a shared main branch.

## Editorial design

- Keep a unified MAISON logo, no FERTINI/Next.js loader.
- Ivory `#f5f2ed`, charcoal `#302d29`, restrained brass `#9b8263`.
- Hero: staggered editorial text and slow image reveal, no fake carousel functionality.
- Layout: hero → statement → image-led story → scent families → dark filmic campaign → real live products → concise service statement → footer.
- Spacing scales with `clamp`, responsive layouts at 900 and 600 px, reduced-motion support.
- Cinematic image URLs are presently approved photography *candidates* from Unsplash, not verified locally hosted, final rights-cleared production assets.
- Brand-specific product imagery and database media references are *not* yet replaced; do not remove product records/uploads prematurely.

## Shopping

- Preserve existing customer authentication, cart APIs, checkout and administrative data.
- The products page retains the existing category/filter UI, but now has normal mobile scrolling instead of a locked two-second sheet transition.
- Sorting is applied to live product cards for cheapest, most expensive and best-selling.
- Desktop product details show image and product purchase control in the first viewport. Mobile keeps gallery, purchase surface and sticky bottom cart bar.
- Product image/title/price always come from the existing product API — no invented prices.

## Outstanding before publish

- Fix pre-existing TypeScript errors in API, coupons, cart and admin; don't bypass production type checks.
- Complete a real production build and inspect responsive layout, loading, interactions, image reliability and accessibility in a browser.
- Replace every legacy product/category/slider image using a verified product-to-photo mapping and database migration plan; audit licensing and retention.
- Validate actual order creation, login, search, filtering, cart, coupon and shipping behavior against a safe test database.
- Do not merge a draft PR simply because the isolated visual tests pass.

## Operational findings (2026-11-05)

- A Vercel preview build failed while collecting route data: the original `lib/db.ts` created a MySQL pool eagerly. This was refactored to create the pool only on the first query.
- The repository previously tracked `.env`; it is removed in the feature branch, but **any exposed credentials must be rotated**, as removing a file does not erase Git history.
- **Real payments are not configured.** The existing `payment.service` is sandbox-only and accepted a simulated callback status; both payment creation and verification are blocked in production until a real provider with server-side verification is integrated.
- Product/voice uploads wrote to `public/uploads` at runtime. Vercel functions do not provide persistent public-file storage; these endpoints now return a controlled 503 in production rather than pretend to save permanent assets.
- Do not sell real products or accept live payment until the gateway, durable object storage and database connectivity are provisioned and end-to-end tested.
