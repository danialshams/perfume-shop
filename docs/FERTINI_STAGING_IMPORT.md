# FERTINI staging collection

This file contains 12 fictional showroom fragrances and 36 volume variants, with descriptive imagery and product fields. Only import to a separate staging MySQL/MariaDB database after taking a backup and running the publication-state migration. It does **not** run automatically and must not be applied to production. Live credentials are not included. Until a staging database is connected, the current showroom uses browser-persisted guest cart interactions and cannot submit paid orders. Product voice tracks are not yet recorded; the showroom uses the browser's speech engine for the product narration. Replace media with licensed product photography and voice tracks before launch.

After import, verify admin product CRUD, public API visibility, URL mapping, checkout safety, cart consistency, stock decrease, authentication and order ownership on staging before enabling real checkout.
