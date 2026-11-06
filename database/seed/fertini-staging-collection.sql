-- FERTINI sample collection (12 items) for a dedicated staging MySQL database ONLY.
-- Prerequisites: take a backup; apply database/migrations/001_products_publication_state.sql.
-- IMPORTANT: DO NOT run on production; this file is never auto-executed.
-- Inserts are idempotent by slug and SKU; never overwrites customer/order data.
SET NAMES utf8mb4;
START TRANSACTION;

INSERT IGNORE INTO categories (name,slug,description,image_url,is_active) VALUES ('چوبی و دودی','fertini-woody','خانوادهٔ بویایی فرتینی','/fertini/nocturne-front.svg',1);
INSERT IGNORE INTO categories (name,slug,description,image_url,is_active) VALUES ('گلی و شفاف','fertini-floral','خانوادهٔ بویایی فرتینی','/fertini/lumiere-front.svg',1);
INSERT IGNORE INTO categories (name,slug,description,image_url,is_active) VALUES ('گرم و شرقی','fertini-amber','خانوادهٔ بویایی فرتینی','/fertini/sillage-front.svg',1);

INSERT IGNORE INTO products (category_id,name,slug,short_description,description,perfume_type,concentration,scent_family,top_notes,middle_notes,base_notes,price,image,voice_file,is_active,is_featured,status)
VALUES ((SELECT id FROM categories WHERE slug='fertini-woody' LIMIT 1),'Fertini — Nocturne','fertini-001','سدر عمیق و کهربا در نوری آرام؛ رایحه‌ای برای حضوری بی‌نیاز از توضیح.','سدر عمیق و کهربا در نوری آرام؛ رایحه‌ای برای حضوری بی‌نیاز از توضیح.','EAU_DE_PARFUM','EAU DE PARFUM','چوبی و دودی','ترنج,فلفل صورتی','سدر,زنبق','کهربا,وتیور,مشک',2370000,'/fertini/nocturne-front.svg',NULL,1,1,'ACTIVE');
INSERT IGNORE INTO product_variants (product_id,sku,volume_ml,price,stock,stock_qty,low_stock_threshold,is_default,status,is_active)
SELECT id,'FERTINI-001-30',30,2370000,8,8,3,0,'ACTIVE',1 FROM products WHERE slug='fertini-001';
INSERT IGNORE INTO product_variants (product_id,sku,volume_ml,price,stock,stock_qty,low_stock_threshold,is_default,status,is_active)
SELECT id,'FERTINI-001-50',50,3290000,12,12,3,1,'ACTIVE',1 FROM products WHERE slug='fertini-001';
INSERT IGNORE INTO product_variants (product_id,sku,volume_ml,price,stock,stock_qty,low_stock_threshold,is_default,status,is_active)
SELECT id,'FERTINI-001-100',100,5130000,5,5,3,0,'ACTIVE',1 FROM products WHERE slug='fertini-001';
INSERT INTO product_images (product_id,image_url,alt_text,sort_order,is_main)
SELECT p.id,'/fertini/nocturne-front.svg','Fertini — Nocturne',0,1 FROM products p WHERE p.slug='fertini-001' AND NOT EXISTS (SELECT 1 FROM product_images i WHERE i.product_id=p.id AND i.image_url='/fertini/nocturne-front.svg');
INSERT INTO product_images (product_id,image_url,alt_text,sort_order,is_main)
SELECT p.id,'/fertini/nocturne-side.svg','Fertini — Nocturne',1,0 FROM products p WHERE p.slug='fertini-001' AND NOT EXISTS (SELECT 1 FROM product_images i WHERE i.product_id=p.id AND i.image_url='/fertini/nocturne-side.svg');

INSERT IGNORE INTO products (category_id,name,slug,short_description,description,perfume_type,concentration,scent_family,top_notes,middle_notes,base_notes,price,image,voice_file,is_active,is_featured,status)
VALUES ((SELECT id FROM categories WHERE slug='fertini-floral' LIMIT 1),'Fertini — Lumière','fertini-002','لطافت گلبرگ‌ها، نور صبح و ردی تمیز از مشک سفید.','لطافت گلبرگ‌ها، نور صبح و ردی تمیز از مشک سفید.','EAU_DE_PARFUM','EAU DE PARFUM','گلی و شفاف','نارنج,برگ بنفشه','یاس,زنبق','مشک سفید,چوب صندل',2270000,'/fertini/lumiere-front.svg',NULL,1,1,'ACTIVE');
INSERT IGNORE INTO product_variants (product_id,sku,volume_ml,price,stock,stock_qty,low_stock_threshold,is_default,status,is_active)
SELECT id,'FERTINI-002-30',30,2270000,8,8,3,0,'ACTIVE',1 FROM products WHERE slug='fertini-002';
INSERT IGNORE INTO product_variants (product_id,sku,volume_ml,price,stock,stock_qty,low_stock_threshold,is_default,status,is_active)
SELECT id,'FERTINI-002-50',50,3150000,12,12,3,1,'ACTIVE',1 FROM products WHERE slug='fertini-002';
INSERT IGNORE INTO product_variants (product_id,sku,volume_ml,price,stock,stock_qty,low_stock_threshold,is_default,status,is_active)
SELECT id,'FERTINI-002-100',100,4910000,5,5,3,0,'ACTIVE',1 FROM products WHERE slug='fertini-002';
INSERT INTO product_images (product_id,image_url,alt_text,sort_order,is_main)
SELECT p.id,'/fertini/lumiere-front.svg','Fertini — Lumière',0,1 FROM products p WHERE p.slug='fertini-002' AND NOT EXISTS (SELECT 1 FROM product_images i WHERE i.product_id=p.id AND i.image_url='/fertini/lumiere-front.svg');
INSERT INTO product_images (product_id,image_url,alt_text,sort_order,is_main)
SELECT p.id,'/fertini/lumiere-side.svg','Fertini — Lumière',1,0 FROM products p WHERE p.slug='fertini-002' AND NOT EXISTS (SELECT 1 FROM product_images i WHERE i.product_id=p.id AND i.image_url='/fertini/lumiere-side.svg');

INSERT IGNORE INTO products (category_id,name,slug,short_description,description,perfume_type,concentration,scent_family,top_notes,middle_notes,base_notes,price,image,voice_file,is_active,is_featured,status)
VALUES ((SELECT id FROM categories WHERE slug='fertini-amber' LIMIT 1),'Fertini — Sillage','fertini-003','گرمای زعفران و رزین؛ امضایی شرقی که آهسته بر پوست می‌ماند.','گرمای زعفران و رزین؛ امضایی شرقی که آهسته بر پوست می‌ماند.','EAU_DE_PARFUM','EAU DE PARFUM','گرم و شرقی','زعفران,دارچین','رز,لابدانوم','وانیل,بنزوئین,عنبر',2480000,'/fertini/sillage-front.svg',NULL,1,1,'ACTIVE');
INSERT IGNORE INTO product_variants (product_id,sku,volume_ml,price,stock,stock_qty,low_stock_threshold,is_default,status,is_active)
SELECT id,'FERTINI-003-30',30,2480000,8,8,3,0,'ACTIVE',1 FROM products WHERE slug='fertini-003';
INSERT IGNORE INTO product_variants (product_id,sku,volume_ml,price,stock,stock_qty,low_stock_threshold,is_default,status,is_active)
SELECT id,'FERTINI-003-50',50,3450000,12,12,3,1,'ACTIVE',1 FROM products WHERE slug='fertini-003';
INSERT IGNORE INTO product_variants (product_id,sku,volume_ml,price,stock,stock_qty,low_stock_threshold,is_default,status,is_active)
SELECT id,'FERTINI-003-100',100,5380000,5,5,3,0,'ACTIVE',1 FROM products WHERE slug='fertini-003';
INSERT INTO product_images (product_id,image_url,alt_text,sort_order,is_main)
SELECT p.id,'/fertini/sillage-front.svg','Fertini — Sillage',0,1 FROM products p WHERE p.slug='fertini-003' AND NOT EXISTS (SELECT 1 FROM product_images i WHERE i.product_id=p.id AND i.image_url='/fertini/sillage-front.svg');
INSERT INTO product_images (product_id,image_url,alt_text,sort_order,is_main)
SELECT p.id,'/fertini/sillage-side.svg','Fertini — Sillage',1,0 FROM products p WHERE p.slug='fertini-003' AND NOT EXISTS (SELECT 1 FROM product_images i WHERE i.product_id=p.id AND i.image_url='/fertini/sillage-side.svg');

INSERT IGNORE INTO products (category_id,name,slug,short_description,description,perfume_type,concentration,scent_family,top_notes,middle_notes,base_notes,price,image,voice_file,is_active,is_featured,status)
VALUES ((SELECT id FROM categories WHERE slug='fertini-woody' LIMIT 1),'Fertini — Obsidian','fertini-004','درخت سرو و دود ملایم در فضایی تیره؛ بی‌پروا اما دقیق.','درخت سرو و دود ملایم در فضایی تیره؛ بی‌پروا اما دقیق.','EAU_DE_PARFUM','EAU DE PARFUM','چوبی و دودی','گریپ‌فروت,فلفل سیاه','سرو,چوب گایاک','خزه بلوط,بخور',3020000,'/fertini/obsidian-front.svg',NULL,1,1,'ACTIVE');
INSERT IGNORE INTO product_variants (product_id,sku,volume_ml,price,stock,stock_qty,low_stock_threshold,is_default,status,is_active)
SELECT id,'FERTINI-004-30',30,3020000,8,8,3,0,'ACTIVE',1 FROM products WHERE slug='fertini-004';
INSERT IGNORE INTO product_variants (product_id,sku,volume_ml,price,stock,stock_qty,low_stock_threshold,is_default,status,is_active)
SELECT id,'FERTINI-004-50',50,4190000,12,12,3,1,'ACTIVE',1 FROM products WHERE slug='fertini-004';
INSERT IGNORE INTO product_variants (product_id,sku,volume_ml,price,stock,stock_qty,low_stock_threshold,is_default,status,is_active)
SELECT id,'FERTINI-004-100',100,6540000,5,5,3,0,'ACTIVE',1 FROM products WHERE slug='fertini-004';
INSERT INTO product_images (product_id,image_url,alt_text,sort_order,is_main)
SELECT p.id,'/fertini/obsidian-front.svg','Fertini — Obsidian',0,1 FROM products p WHERE p.slug='fertini-004' AND NOT EXISTS (SELECT 1 FROM product_images i WHERE i.product_id=p.id AND i.image_url='/fertini/obsidian-front.svg');
INSERT INTO product_images (product_id,image_url,alt_text,sort_order,is_main)
SELECT p.id,'/fertini/obsidian-side.svg','Fertini — Obsidian',1,0 FROM products p WHERE p.slug='fertini-004' AND NOT EXISTS (SELECT 1 FROM product_images i WHERE i.product_id=p.id AND i.image_url='/fertini/obsidian-side.svg');

INSERT IGNORE INTO products (category_id,name,slug,short_description,description,perfume_type,concentration,scent_family,top_notes,middle_notes,base_notes,price,image,voice_file,is_active,is_featured,status)
VALUES ((SELECT id FROM categories WHERE slug='fertini-floral' LIMIT 1),'Fertini — Iris','fertini-005','زنبق پودری و شکوفه‌های سفید در تعادلی نرم و شفاف.','زنبق پودری و شکوفه‌های سفید در تعادلی نرم و شفاف.','EAU_DE_PARFUM','EAU DE PARFUM','گلی و شفاف','برگاموت,گلابی','زنبق,فریزیا','مشک,چوب کشمیر',2770000,'/fertini/iris-front.svg',NULL,1,1,'ACTIVE');
INSERT IGNORE INTO product_variants (product_id,sku,volume_ml,price,stock,stock_qty,low_stock_threshold,is_default,status,is_active)
SELECT id,'FERTINI-005-30',30,2770000,8,8,3,0,'ACTIVE',1 FROM products WHERE slug='fertini-005';
INSERT IGNORE INTO product_variants (product_id,sku,volume_ml,price,stock,stock_qty,low_stock_threshold,is_default,status,is_active)
SELECT id,'FERTINI-005-50',50,3850000,12,12,3,1,'ACTIVE',1 FROM products WHERE slug='fertini-005';
INSERT IGNORE INTO product_variants (product_id,sku,volume_ml,price,stock,stock_qty,low_stock_threshold,is_default,status,is_active)
SELECT id,'FERTINI-005-100',100,6010000,5,5,3,0,'ACTIVE',1 FROM products WHERE slug='fertini-005';
INSERT INTO product_images (product_id,image_url,alt_text,sort_order,is_main)
SELECT p.id,'/fertini/iris-front.svg','Fertini — Iris',0,1 FROM products p WHERE p.slug='fertini-005' AND NOT EXISTS (SELECT 1 FROM product_images i WHERE i.product_id=p.id AND i.image_url='/fertini/iris-front.svg');
INSERT INTO product_images (product_id,image_url,alt_text,sort_order,is_main)
SELECT p.id,'/fertini/iris-side.svg','Fertini — Iris',1,0 FROM products p WHERE p.slug='fertini-005' AND NOT EXISTS (SELECT 1 FROM product_images i WHERE i.product_id=p.id AND i.image_url='/fertini/iris-side.svg');

INSERT IGNORE INTO products (category_id,name,slug,short_description,description,perfume_type,concentration,scent_family,top_notes,middle_notes,base_notes,price,image,voice_file,is_active,is_featured,status)
VALUES ((SELECT id FROM categories WHERE slug='fertini-amber' LIMIT 1),'Fertini — Cendre','fertini-006','وانیل خشک و چوب سوخته؛ برخوردی گرم از نور و سایه.','وانیل خشک و چوب سوخته؛ برخوردی گرم از نور و سایه.','EAU_DE_PARFUM','EAU DE PARFUM','گرم و شرقی','هل,زعفران','چوب خشک,بخور','وانیل,کهربا',3300000,'/fertini/cendre-front.svg',NULL,1,1,'ACTIVE');
INSERT IGNORE INTO product_variants (product_id,sku,volume_ml,price,stock,stock_qty,low_stock_threshold,is_default,status,is_active)
SELECT id,'FERTINI-006-30',30,3300000,8,8,3,0,'ACTIVE',1 FROM products WHERE slug='fertini-006';
INSERT IGNORE INTO product_variants (product_id,sku,volume_ml,price,stock,stock_qty,low_stock_threshold,is_default,status,is_active)
SELECT id,'FERTINI-006-50',50,4590000,12,12,3,1,'ACTIVE',1 FROM products WHERE slug='fertini-006';
INSERT IGNORE INTO product_variants (product_id,sku,volume_ml,price,stock,stock_qty,low_stock_threshold,is_default,status,is_active)
SELECT id,'FERTINI-006-100',100,7160000,5,5,3,0,'ACTIVE',1 FROM products WHERE slug='fertini-006';
INSERT INTO product_images (product_id,image_url,alt_text,sort_order,is_main)
SELECT p.id,'/fertini/cendre-front.svg','Fertini — Cendre',0,1 FROM products p WHERE p.slug='fertini-006' AND NOT EXISTS (SELECT 1 FROM product_images i WHERE i.product_id=p.id AND i.image_url='/fertini/cendre-front.svg');
INSERT INTO product_images (product_id,image_url,alt_text,sort_order,is_main)
SELECT p.id,'/fertini/cendre-side.svg','Fertini — Cendre',1,0 FROM products p WHERE p.slug='fertini-006' AND NOT EXISTS (SELECT 1 FROM product_images i WHERE i.product_id=p.id AND i.image_url='/fertini/cendre-side.svg');

INSERT IGNORE INTO products (category_id,name,slug,short_description,description,perfume_type,concentration,scent_family,top_notes,middle_notes,base_notes,price,image,voice_file,is_active,is_featured,status)
VALUES ((SELECT id FROM categories WHERE slug='fertini-floral' LIMIT 1),'Fertini — Aube','fertini-007','آغاز یک صبح روشن؛ شکوفه پرتقال و مشک شفاف.','آغاز یک صبح روشن؛ شکوفه پرتقال و مشک شفاف.','EAU_DE_PARFUM','EAU DE PARFUM','گلی و شفاف','نارنگی,لیمو','شکوفه پرتقال,یاس','مشک,چوب سفید',2080000,'/fertini/aube-front.svg',NULL,1,0,'ACTIVE');
INSERT IGNORE INTO product_variants (product_id,sku,volume_ml,price,stock,stock_qty,low_stock_threshold,is_default,status,is_active)
SELECT id,'FERTINI-007-30',30,2080000,8,8,3,0,'ACTIVE',1 FROM products WHERE slug='fertini-007';
INSERT IGNORE INTO product_variants (product_id,sku,volume_ml,price,stock,stock_qty,low_stock_threshold,is_default,status,is_active)
SELECT id,'FERTINI-007-50',50,2890000,12,12,3,1,'ACTIVE',1 FROM products WHERE slug='fertini-007';
INSERT IGNORE INTO product_variants (product_id,sku,volume_ml,price,stock,stock_qty,low_stock_threshold,is_default,status,is_active)
SELECT id,'FERTINI-007-100',100,4510000,5,5,3,0,'ACTIVE',1 FROM products WHERE slug='fertini-007';
INSERT INTO product_images (product_id,image_url,alt_text,sort_order,is_main)
SELECT p.id,'/fertini/aube-front.svg','Fertini — Aube',0,1 FROM products p WHERE p.slug='fertini-007' AND NOT EXISTS (SELECT 1 FROM product_images i WHERE i.product_id=p.id AND i.image_url='/fertini/aube-front.svg');
INSERT INTO product_images (product_id,image_url,alt_text,sort_order,is_main)
SELECT p.id,'/fertini/aube-side.svg','Fertini — Aube',1,0 FROM products p WHERE p.slug='fertini-007' AND NOT EXISTS (SELECT 1 FROM product_images i WHERE i.product_id=p.id AND i.image_url='/fertini/aube-side.svg');

INSERT IGNORE INTO products (category_id,name,slug,short_description,description,perfume_type,concentration,scent_family,top_notes,middle_notes,base_notes,price,image,voice_file,is_active,is_featured,status)
VALUES ((SELECT id FROM categories WHERE slug='fertini-amber' LIMIT 1),'Fertini — Solstice','fertini-008','برخورد نور گرم عصر با ادویه و چوب صندل.','برخورد نور گرم عصر با ادویه و چوب صندل.','EAU_DE_PARFUM','EAU DE PARFUM','گرم و شرقی','پرتقال تلخ,هل','کهربا,رز','صندل,وانیل',2820000,'/fertini/solstice-front.svg',NULL,1,0,'ACTIVE');
INSERT IGNORE INTO product_variants (product_id,sku,volume_ml,price,stock,stock_qty,low_stock_threshold,is_default,status,is_active)
SELECT id,'FERTINI-008-30',30,2820000,8,8,3,0,'ACTIVE',1 FROM products WHERE slug='fertini-008';
INSERT IGNORE INTO product_variants (product_id,sku,volume_ml,price,stock,stock_qty,low_stock_threshold,is_default,status,is_active)
SELECT id,'FERTINI-008-50',50,3920000,12,12,3,1,'ACTIVE',1 FROM products WHERE slug='fertini-008';
INSERT IGNORE INTO product_variants (product_id,sku,volume_ml,price,stock,stock_qty,low_stock_threshold,is_default,status,is_active)
SELECT id,'FERTINI-008-100',100,6120000,5,5,3,0,'ACTIVE',1 FROM products WHERE slug='fertini-008';
INSERT INTO product_images (product_id,image_url,alt_text,sort_order,is_main)
SELECT p.id,'/fertini/solstice-front.svg','Fertini — Solstice',0,1 FROM products p WHERE p.slug='fertini-008' AND NOT EXISTS (SELECT 1 FROM product_images i WHERE i.product_id=p.id AND i.image_url='/fertini/solstice-front.svg');
INSERT INTO product_images (product_id,image_url,alt_text,sort_order,is_main)
SELECT p.id,'/fertini/solstice-side.svg','Fertini — Solstice',1,0 FROM products p WHERE p.slug='fertini-008' AND NOT EXISTS (SELECT 1 FROM product_images i WHERE i.product_id=p.id AND i.image_url='/fertini/solstice-side.svg');

INSERT IGNORE INTO products (category_id,name,slug,short_description,description,perfume_type,concentration,scent_family,top_notes,middle_notes,base_notes,price,image,voice_file,is_active,is_featured,status)
VALUES ((SELECT id FROM categories WHERE slug='fertini-woody' LIMIT 1),'Fertini — Épure','fertini-009','سادگی در کامل‌ترین شکل؛ سرو سفید و برگ‌های سبز.','سادگی در کامل‌ترین شکل؛ سرو سفید و برگ‌های سبز.','EAU_DE_PARFUM','EAU DE PARFUM','چوبی و دودی','برگ انجیر,ترنج','سدر,برگ بنفشه','مشک,وتیور',2410000,'/fertini/epure-front.svg',NULL,1,0,'ACTIVE');
INSERT IGNORE INTO product_variants (product_id,sku,volume_ml,price,stock,stock_qty,low_stock_threshold,is_default,status,is_active)
SELECT id,'FERTINI-009-30',30,2410000,8,8,3,0,'ACTIVE',1 FROM products WHERE slug='fertini-009';
INSERT IGNORE INTO product_variants (product_id,sku,volume_ml,price,stock,stock_qty,low_stock_threshold,is_default,status,is_active)
SELECT id,'FERTINI-009-50',50,3350000,12,12,3,1,'ACTIVE',1 FROM products WHERE slug='fertini-009';
INSERT IGNORE INTO product_variants (product_id,sku,volume_ml,price,stock,stock_qty,low_stock_threshold,is_default,status,is_active)
SELECT id,'FERTINI-009-100',100,5230000,5,5,3,0,'ACTIVE',1 FROM products WHERE slug='fertini-009';
INSERT INTO product_images (product_id,image_url,alt_text,sort_order,is_main)
SELECT p.id,'/fertini/epure-front.svg','Fertini — Épure',0,1 FROM products p WHERE p.slug='fertini-009' AND NOT EXISTS (SELECT 1 FROM product_images i WHERE i.product_id=p.id AND i.image_url='/fertini/epure-front.svg');
INSERT INTO product_images (product_id,image_url,alt_text,sort_order,is_main)
SELECT p.id,'/fertini/epure-side.svg','Fertini — Épure',1,0 FROM products p WHERE p.slug='fertini-009' AND NOT EXISTS (SELECT 1 FROM product_images i WHERE i.product_id=p.id AND i.image_url='/fertini/epure-side.svg');

INSERT IGNORE INTO products (category_id,name,slug,short_description,description,perfume_type,concentration,scent_family,top_notes,middle_notes,base_notes,price,image,voice_file,is_active,is_featured,status)
VALUES ((SELECT id FROM categories WHERE slug='fertini-floral' LIMIT 1),'Fertini — Veil','fertini-010','پرده‌ای از گل‌های سفید، سبک و نزدیک به پوست.','پرده‌ای از گل‌های سفید، سبک و نزدیک به پوست.','EAU_DE_PARFUM','EAU DE PARFUM','گلی و شفاف','گلابی,نارنج','پیونی,مگنولیا','مشک سفید,عنبر نرم',2580000,'/fertini/veil-front.svg',NULL,1,0,'ACTIVE');
INSERT IGNORE INTO product_variants (product_id,sku,volume_ml,price,stock,stock_qty,low_stock_threshold,is_default,status,is_active)
SELECT id,'FERTINI-010-30',30,2580000,8,8,3,0,'ACTIVE',1 FROM products WHERE slug='fertini-010';
INSERT IGNORE INTO product_variants (product_id,sku,volume_ml,price,stock,stock_qty,low_stock_threshold,is_default,status,is_active)
SELECT id,'FERTINI-010-50',50,3590000,12,12,3,1,'ACTIVE',1 FROM products WHERE slug='fertini-010';
INSERT IGNORE INTO product_variants (product_id,sku,volume_ml,price,stock,stock_qty,low_stock_threshold,is_default,status,is_active)
SELECT id,'FERTINI-010-100',100,5600000,5,5,3,0,'ACTIVE',1 FROM products WHERE slug='fertini-010';
INSERT INTO product_images (product_id,image_url,alt_text,sort_order,is_main)
SELECT p.id,'/fertini/veil-front.svg','Fertini — Veil',0,1 FROM products p WHERE p.slug='fertini-010' AND NOT EXISTS (SELECT 1 FROM product_images i WHERE i.product_id=p.id AND i.image_url='/fertini/veil-front.svg');
INSERT INTO product_images (product_id,image_url,alt_text,sort_order,is_main)
SELECT p.id,'/fertini/veil-side.svg','Fertini — Veil',1,0 FROM products p WHERE p.slug='fertini-010' AND NOT EXISTS (SELECT 1 FROM product_images i WHERE i.product_id=p.id AND i.image_url='/fertini/veil-side.svg');

INSERT IGNORE INTO products (category_id,name,slug,short_description,description,perfume_type,concentration,scent_family,top_notes,middle_notes,base_notes,price,image,voice_file,is_active,is_featured,status)
VALUES ((SELECT id FROM categories WHERE slug='fertini-woody' LIMIT 1),'Fertini — Atlas','fertini-011','سفر به عمق جنگل؛ ترکیبی از چوب خشک، خزه و صمغ.','سفر به عمق جنگل؛ ترکیبی از چوب خشک، خزه و صمغ.','EAU_DE_PARFUM','EAU DE PARFUM','چوبی و دودی','فلفل صورتی,ترنج','سرو,نعناع هندی','صمغ,خزه بلوط',3090000,'/fertini/atlas-front.svg',NULL,1,0,'ACTIVE');
INSERT IGNORE INTO product_variants (product_id,sku,volume_ml,price,stock,stock_qty,low_stock_threshold,is_default,status,is_active)
SELECT id,'FERTINI-011-30',30,3090000,8,8,3,0,'ACTIVE',1 FROM products WHERE slug='fertini-011';
INSERT IGNORE INTO product_variants (product_id,sku,volume_ml,price,stock,stock_qty,low_stock_threshold,is_default,status,is_active)
SELECT id,'FERTINI-011-50',50,4290000,12,12,3,1,'ACTIVE',1 FROM products WHERE slug='fertini-011';
INSERT IGNORE INTO product_variants (product_id,sku,volume_ml,price,stock,stock_qty,low_stock_threshold,is_default,status,is_active)
SELECT id,'FERTINI-011-100',100,6690000,5,5,3,0,'ACTIVE',1 FROM products WHERE slug='fertini-011';
INSERT INTO product_images (product_id,image_url,alt_text,sort_order,is_main)
SELECT p.id,'/fertini/atlas-front.svg','Fertini — Atlas',0,1 FROM products p WHERE p.slug='fertini-011' AND NOT EXISTS (SELECT 1 FROM product_images i WHERE i.product_id=p.id AND i.image_url='/fertini/atlas-front.svg');
INSERT INTO product_images (product_id,image_url,alt_text,sort_order,is_main)
SELECT p.id,'/fertini/atlas-side.svg','Fertini — Atlas',1,0 FROM products p WHERE p.slug='fertini-011' AND NOT EXISTS (SELECT 1 FROM product_images i WHERE i.product_id=p.id AND i.image_url='/fertini/atlas-side.svg');

INSERT IGNORE INTO products (category_id,name,slug,short_description,description,perfume_type,concentration,scent_family,top_notes,middle_notes,base_notes,price,image,voice_file,is_active,is_featured,status)
VALUES ((SELECT id FROM categories WHERE slug='fertini-amber' LIMIT 1),'Fertini — Safran','fertini-012','زعفران، رز و مشک در تعادلی غنی و شخصی.','زعفران، رز و مشک در تعادلی غنی و شخصی.','EAU_DE_PARFUM','EAU DE PARFUM','گرم و شرقی','زعفران,فلفل صورتی','گل رز,بخور','کهربا,مشک',3450000,'/fertini/safran-front.svg',NULL,1,0,'ACTIVE');
INSERT IGNORE INTO product_variants (product_id,sku,volume_ml,price,stock,stock_qty,low_stock_threshold,is_default,status,is_active)
SELECT id,'FERTINI-012-30',30,3450000,8,8,3,0,'ACTIVE',1 FROM products WHERE slug='fertini-012';
INSERT IGNORE INTO product_variants (product_id,sku,volume_ml,price,stock,stock_qty,low_stock_threshold,is_default,status,is_active)
SELECT id,'FERTINI-012-50',50,4790000,12,12,3,1,'ACTIVE',1 FROM products WHERE slug='fertini-012';
INSERT IGNORE INTO product_variants (product_id,sku,volume_ml,price,stock,stock_qty,low_stock_threshold,is_default,status,is_active)
SELECT id,'FERTINI-012-100',100,7470000,5,5,3,0,'ACTIVE',1 FROM products WHERE slug='fertini-012';
INSERT INTO product_images (product_id,image_url,alt_text,sort_order,is_main)
SELECT p.id,'/fertini/safran-front.svg','Fertini — Safran',0,1 FROM products p WHERE p.slug='fertini-012' AND NOT EXISTS (SELECT 1 FROM product_images i WHERE i.product_id=p.id AND i.image_url='/fertini/safran-front.svg');
INSERT INTO product_images (product_id,image_url,alt_text,sort_order,is_main)
SELECT p.id,'/fertini/safran-side.svg','Fertini — Safran',1,0 FROM products p WHERE p.slug='fertini-012' AND NOT EXISTS (SELECT 1 FROM product_images i WHERE i.product_id=p.id AND i.image_url='/fertini/safran-side.svg');

COMMIT;

-- Check after staging import:
SELECT p.id,p.name,p.slug,p.status,p.is_active,COUNT(v.id) AS active_variants
FROM products p LEFT JOIN product_variants v ON v.product_id=p.id AND v.status='ACTIVE'
WHERE p.slug LIKE 'fertini-%'
GROUP BY p.id,p.name,p.slug,p.status,p.is_active;
