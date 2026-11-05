# MAISON — database review (sanitized, 2026-11-05)

Source: the owner-provided phpMyAdmin MariaDB 10.4 dump.
**The actual dump contains customer names, phone numbers, address data and password hashes. Never commit the raw dump to a public repository.**

## Verified inventory
- 26 tables, 14 products, 20 product variants, 15 product photos, 13 variant photos.
- 16 categories, 4 brands, 3 scent families, 7 sliders.
- 28 orders and 28 payment rows; **all 28 have provider=sandbox**, so do not classify these as real settled sales.
- 77 carts; older data includes abandoned/ordered sessions.

## Confirmed schema/code mismatches
1. **Missing products.status:** code in product.repository, slider.repository and checkout.repository accesses p.status. The uploaded dump's products table has is_active but not status. See migrations/001_products_publication_state.sql (non-destructive and idempotent).
2. **Stock duplication:** product_variants.stock is zero in all 20 samples, while stock_qty is positive in 12; checkout reads stock_qty under alias stock. Keep stock_qty as the current source of truth; do NOT synchronize or delete columns blindly until all dependent code is audited.
3. **Default variants:** all 20 product_variants.is_default flags are zero. Frontend currently has fallback selection, but the admin should require exactly one default per product/volume policy.
4. **Legacy parallel columns:** products.price/image/scent_family and order_items.variant_id/product_variant_id, variant_title/variant_label, total_price/line_total appear duplicated. Compare all read/write paths before deprecation.
5. **Legacy tables:** categories_old and categories_backup are snapshots. Keep until dependencies have been checked and an offsite backup exists; omit from any future clean fresh-install schema only after verification.
6. **Duplicated foreign keys:** category_parents, customer_addresses and wishlist_items each have multiple FKs on the same relationship. Review/drop redundant constraints only after examining information_schema and live data.
7. **Wrong address relationship:** orders.address_id references user_addresses while actual customer registration uses customer_addresses. All imported order address_id values are NULL, but fix the target schema only with a tested migration that preserves historical snapshot fields.
8. **Misleading payment states:** 25 payment records report success under the sandbox provider; old order payment_status values mirror these tests. Never recalculate revenue from them. Future gateway needs real backend verification plus immutable payment transaction records.
9. **Invalid/seed data:** sample products include zero-price variants and unusually huge stock_qty; a brand has contradictory ACTIVE/INACTIVE flags and some brand/category names are test placeholders. Do not auto-change prices, stock or names.
10. **Media references:** historical product/category/variant/slider images are referenced in multiple tables; deleting public/uploads before a reference-preserving image migration will break storefront and admin.
11. **Portability:** use versioned migrations, mysql2 connection settings from environment, durable object storage (S3-compatible/Blob), and test restore from a sanitized staging copy.

## Migration order
1. Make an encrypted full SQL backup and separately archive all media.
2. Import into an isolated development or staging MariaDB/MySQL instance.
3. Run 001_products_publication_state.sql, review its result and run read-only quality checks.
4. Audit frontend/API routes for compatibility, then normalize test data only with owner-confirmed mapping.
5. Connect object storage and verified payment provider before switching on real checkout.
6. Only after end-to-end QA, deploy the tested database and storefront together.

The production database was not modified.
