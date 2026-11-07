# FERTINI — PostgreSQL deployment and host migration

Database engine: PostgreSQL, accessed through the open-source postgres.js driver.
Prisma is optional; it is not necessary for PostgreSQL compatibility or portability.
All runtime environments use DATABASE_URL; never commit a connection string.

Current development branch has database/postgres/schema.sql and database/postgres/seed-demo.sql.
The SQL includes no personal/customer/order information from the previous XAMPP database.
Run schema and seed only against a BRAND-NEW, isolated empty PostgreSQL database after reviewing SQL.
Run the read-only npm run db:verify and test the full authenticated store and admin flows.

Deployment: provision a dedicated PostgreSQL database under your own provider account (Neon or Supabase).
Configure DATABASE_URL in Vercel Preview first, plus independent JWT_ACCESS_SECRET and JWT_REFRESH_SECRET.
Redeploy Preview, create the first owner via the secure one-time /admin/setup flow, then test product CRUD,
image/audio upload (requires S3-compatible object storage), checkout and the homepage content editor.
Only after those tests succeed should production main be merged.

Migration to your own host: export the PostgreSQL DB via pg_dump, restore via pg_restore or psql
to any supported PostgreSQL server; transfer media from S3-compatible storage; set the same DATABASE_URL
and other environment variables in your self-hosted Next.js/Node.js runtime.
No Vercel-specific database SDK is required.

Important: The Neon integration connected to this conversation is currently Vercel-managed and
refuses creation of new projects via the exposed Neon API. Do not reuse existing unrelated projects.
Until a new dedicated provider database is connected, the Preview has NO operational database.
