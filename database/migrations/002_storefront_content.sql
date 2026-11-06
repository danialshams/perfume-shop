-- FERTINI / MAISON: additive and re-runnable homepage content storage.
-- Apply on staging after a complete SQL backup. NO DROP or data cleanup.
CREATE TABLE IF NOT EXISTS storefront_content (
 id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
 content_json LONGTEXT NOT NULL,
 updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 CONSTRAINT chk_storefront_content_json CHECK (JSON_VALID(content_json))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- No seed required; the storefront falls back to versioned defaults when empty.
