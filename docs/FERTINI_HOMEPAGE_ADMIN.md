# FERTINI — administration, old database and host portability

Homepage editor: /admin/content. The on-page studio shows the hero slider, most-loved products, new products, scent-family cards and footer in the same order as the actual homepage. It supports editable hero images (2–5), selected published products (1–6 per collection), family image/label and links selected from actual categories or scent families, footer taglines, visibility, and reorder.

Database: use the EXISTING PostgreSQL/MariaDB instance. No new database or production data copy was created. The new storefront_content and admin_notifications tables are additive migrations within that same existing database. The previous orders, customers, media, and payment rows must be retained and backed up before applying any migrations on a staging restore.

Catalog: homepage product cards are read from existing products, product_images and product_variants. Published records link to /products/[id]. Demo images and fragrances are used only when no live database environment was configured, as a clearly separate showcase mode. A configured but offline DB must not display fictitious purchasable inventory.

Notifications: unpaid order creation creates no admin sale alert. A confirmed payment event inserts exactly one payment_success notification in the order transaction; the order row is locked during the transition. The admin bell shows only successful payment events, with SSE polling every two seconds and a ten-second browser fallback. This is near-real-time delivery, not a hard instant guarantee. Previous unrelated events are kept but not shown in the sales bell.

Payments: no real payment gateway has been installed. The old sandbox provider is forbidden on Vercel and production. A future provider must be validated server-side, including amount, order, signature/reference and idempotency, before a paid order and sale notification are committed.

Hosting: Node.js/Next.js, postgres.js and S3-compatible storage use environment variables. Move a verified SQL backup and all media objects to the final Node-capable host; configure DATABASE_URL, S3_*, TLS and runtime settings; test protected admin CRUD and paid-order notifications before switching domains. A generic PHP-only shared hosting plan cannot run this Next.js server.

Release gate: the branch must pass GitHub Actions AND real authenticated staging database and media upload tests. The Vercel project does not yet have usable DB or S3 configuration, so DO NOT merge it to main or claim full live functionality until those external dependencies are fixed.