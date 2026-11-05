-- MAISON DB migration 001 (2026-11-05)
-- ADDITIVE, RE-RUNNABLE. Run after backing up the MySQL/MariaDB database.
-- The uploaded 2026-11-05 schema has no products.status, while the app
-- filters published products and checks p.status during checkout.
-- Neither this migration nor its preflight touches orders or customer data.

SET @maison_status_column_exists := (
 SELECT COUNT(*) FROM information_schema.COLUMNS
 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'status'
);

SET @maison_status_ddl := IF(
 @maison_status_column_exists = 0,
 'ALTER TABLE products ADD COLUMN status ENUM(''ACTIVE'',''DRAFT'',''INACTIVE'') NOT NULL DEFAULT ''ACTIVE'' AFTER is_active',
 'SELECT ''products.status already exists; skipping'' AS result'
);
PREPARE maison_status_stmt FROM @maison_status_ddl;
EXECUTE maison_status_stmt;
DEALLOCATE PREPARE maison_status_stmt;

-- Do not overwrite any explicit DRAFT status. Only ensure disabled products
-- cannot have the implicitly added ACTIVE status.
UPDATE products
SET status = 'INACTIVE'
WHERE is_active = 0 AND status = 'ACTIVE';

SELECT status, is_active, COUNT(*) AS item_count
FROM products
GROUP BY status, is_active;
