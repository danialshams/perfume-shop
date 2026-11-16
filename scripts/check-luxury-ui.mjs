import { readFileSync, existsSync } from "node:fs";
import assert from "node:assert/strict";

const read = path => readFileSync(path, "utf8");
const shell = read("components/HomeWrapper/home-page-shell.tsx");
const home = read("components/home-sections/FertiniHomeV5.tsx");
const shop = read("components/HomeProductsPage/LuxuryProductsView.tsx");
const layout = read("app/layout.tsx");
const nav = read("components/home-sections/navbar.tsx");
const product = read("app/products/[id]/page.tsx");
const card = read("components/HomeProductsComponnents/MobileProductCard.tsx");
const audio = read("components/maison/MaisonAmbientSound.tsx");
const app = read("app/fertini-refinement.css");

assert.match(shell, /CinematicStorefront/);
assert.match(shell, /CinematicFooter/);
assert.match(shell, /<MaisonIntro/);
assert.doesNotMatch(shell, /<InitialLoader/);
const intro = read("components/maison/MaisonIntro.tsx");
assert.match(read("app/maison-experience.css"), /\.maison-intro__brand,\.maison-intro__sub \{ opacity: 0; visibility: hidden; \}/);
assert.match(intro, /const START_KEY = "fertini:intro:started:v4"/);
assert.doesNotMatch(intro,/عبور از مقدمه|maison-intro__skip/);
assert.match(intro, /window\.sessionStorage\.setItem\(START_KEY, "1"\)/);
assert.match(intro, /introStartedAt/);
assert.match(intro, /performance\.now\(\) - introStartedAt/);
assert.match(intro, /const firstCompletion = !introFinishedInDocument/);
assert.match(intro, /if \(firstCompletion\) window\.dispatchEvent/);
assert.match(intro, /sessionStorage\.setItem\(SESSION_KEY/);
assert.match(intro, /useLayoutEffect/);
assert.doesNotMatch(intro, /setTimeout\(/);
assert.match(layout, /<MaisonAmbientSound/);
assert.match(layout, /generateMetadata/);
assert.match(layout, /currentSeo/);
const seoMeta = read("server/seo-metadata.ts");
assert.match(seoMeta, /metadataBase:/);
assert.match(seoMeta, /openGraph:/);
assert.match(seoMeta, /locale:language/);
assert.match(read("app/admin/(panel)/seo/page.tsx"), /SeoStudio/);
assert.match(audio, /preload="none"/);
assert.match(audio, /background-music:pause-for-voice/);
assert.match(home, /fertini-hero/);
assert.match(home, /fertini-v5-best/);
assert.match(home, /fertini-v5-new/);
assert.match(home, /fertini-v5-families/);
assert.doesNotMatch(home, /maison-film/);
assert.match(home, /data-fertini-card/);
assert.match(home, /fertini:intro:complete/);
assert.match(home, /ScrollTrigger\.create/);
// The new heading animation intentionally uses clipPath only on the title,
 // while photos retain their separate decode-ahead cinematic reveal.
assert.ok(home.includes('clipPath:"inset(0% 0% 100% 0%)"'));
assert.match(home, /clearProps:"clipPath,filter,transform/);
assert.match(home, /data-fertini-photo/);
assert.match(intro, /data-intro-letter/);
assert.match(intro, /scatteredX/);
assert.ok(intro.includes('.to(line,{scaleX:1'));
assert.ok(intro.includes('.to(sheen,{backgroundPosition'));
for (const name of ["hero-amber","hero-bronze","product-amber-01","product-amber-02","product-amber-03","product-ivory-01","product-ivory-02","family-woody","family-floral","family-oud"]) {
 assert.ok(existsSync("public/fertini/editorial/" + name + ".avif"),"Missing editorial media: "+name);
}

// Regression guards for the hosted homepage: the legacy refinement sheet
// must not hide the intro hairline, and the light sweep must not tile/repeat.
const introCss=read("app/maison-experience.css");
const refinementCss=read("app/fertini-refinement.css");
const galleryCss=read("app/fertini-home-v5.css");
assert.doesNotMatch(refinementCss,/\.fertini-intro \.maison-intro__overline,\.fertini-intro \.maison-intro__rule\{display:none!important\}/);
assert.match(introCss,/\.fertini-intro \.maison-intro__rule\{[\s\S]*?display:block!important/);
assert.match(introCss,/background-repeat:no-repeat/);
assert.ok(intro.indexOf('.to(line,{scaleX:1')<intro.indexOf('.to(sheen,{autoAlpha:.78'));
assert.ok(intro.indexOf('.to(line,{scaleX:1')<intro.indexOf('.to(sheen,{backgroundPosition'));
assert.match(home,/function ResilientPhoto/);
assert.match(home,/fill unoptimized priority=/);
assert.match(home,/src=\{product.isDemo\?\(editorialImage\|\|product.image\):product.image\}/);
assert.match(home,/fallback=\{slide.fallback\}/);
assert.match(home,/photo:builtin\?FERTINI_HERO_IMAGES\[index%2\]:slide.photo/);
assert.doesNotMatch(home,/editorialHeroes/);
assert.match(read("app/fertini-polish-v6.css"),/\.fertini-hero__image\.is-vector-art img/);
assert.match(home,/src=\{family.photo\}/);
assert.match(galleryCss,/\.fertini-v5-family__photo::after/);
assert.match(galleryCss,/\.fertini-v5-family__photo \.fertini-v5-family__info/);
assert.match(home,/\{family.subtitle\}/);

// The user uploaded real photography to durable cPanel media storage, not
// to a GitHub build or to arbitrary public_html paths.
const editorial=read("lib/fertini-editorial.ts");
const editorialRoute=read("app/api/v1/editorial/[filename]/route.ts");
assert.match(editorial,/https:\/\/fertiniperfume\.com\/api\/v1\/editorial\//);
assert.match(editorial,/hero-01-golden-citrus-blossom\.png/);
assert.match(editorial,/hero-02-luxury-oud-amber\.png/);
assert.match(editorial,/family-01-woody\.png/);
assert.match(editorial,/family-02-oud-smoky\.png/);
assert.match(editorial,/family-03-vanilla\.png/);
assert.match(editorialRoute,/editorialMediaRoots/);
const editorialStorage=read("server/storage/editorial-media.ts");
assert.match(editorialStorage,/localMediaDirectory/);
assert.match(editorialStorage,/home\/fertinip\/fertini-media/);
assert.match(editorialStorage,/existsSync/);
const editorialStatus=read("app/api/v1/editorial/status/route.ts");
assert.match(editorialStatus,/optimizedWebp/);
assert.match(editorialStatus,/expected:/);
assert.doesNotMatch(home,/fallback="\/fertini\/editorial\/family-woody\.avif"/);
assert.match(home,/fallback="" alt=\{name\}/);
assert.match(home,/fallback=""\s+sizes=/);
assert.match(editorialRoute,/allowed\.has\(filename\)/);
assert.match(editorialRoute,/O_NOFOLLOW/);
assert.match(editorialRoute,/const contentType = extension === "webp" \? "image\/webp" : "image\/png"/);
assert.doesNotMatch(editorialRoute,/readLocalMedia\(/);
assert.match(home,/bestEditorialPreviews\.map/);
assert.match(home,/newestEditorialPreviews\.map/);
assert.match(home,/familyStory\.map/);
assert.match(home,/live\?"\/products\?scent_family_id="/);
assert.doesNotMatch(home,/familyStillLife/);

assert.match(editorial,/OPTIMIZED_EDITORIAL_IMAGE_NAMES/);
for(const filename of [
  "hero-01-golden-citrus-blossom.webp",
  "hero-02-luxury-oud-amber.webp",
  "product-01-rose-crystal.webp",
  "product-02-vanilla-tonka.webp",
  "product-03-smoked-vetiver-cedar.webp",
  "product-04-neroli-green-tea.webp",
  "product-05-ruby-amber-saffron.webp",
  "product-06-iris-marine.webp",
  "family-01-woody.webp",
  "family-02-oud-smoky.webp",
  "family-03-vanilla.webp",
]){
  assert.ok(editorial.includes(filename),"Missing optimized editorial filename "+filename);
}
assert.match(editorialRoute,/isValidPicture/);
assert.match(editorialRoute,/candidateNames/);
assert.match(editorialRoute,/max-age=86400/);
assert.match(home,/const duration=5600/);
assert.match(home,/editorialNewest = FERTINI_PRODUCT_IMAGES.slice\(3,6\)/);
assert.ok(home.includes("newestEditorialPreviews=FERTINI_EDITORIAL_FRAGRANCES.slice(3,6)"));
assert.match(home,/price.toLocaleString\("fa-IR"\)/);
assert.doesNotMatch(home,/تصویر مفهومی مجموعه فرتینی/);
assert.doesNotMatch(home,/FERTINI \/ DELIVERY/);
assert.doesNotMatch(home,/fertini-v5-delivery maison-wide/);
assert.match(home,/shipping:null/);


assert.doesNotMatch(home, /fertini-hero__text/);
assert.match(nav, /menuMounted/);
assert.match(home, /HomeProduct/);
assert.match(home, /content\.sectionOrder\.map/);
assert.match(read("server/home-catalog.ts"), /FROM products p/);
assert.match(read("app\/api\/v1\/admin\/content\/route.ts"), /listHomeProducts/);
assert.match(read("components/maison/FertiniVoicePlayer.tsx"), /speechSynthesis/);
assert.match(read("components/maison/FertiniFragranceDetail.tsx"), /addGuestCartProducts/);
assert.match(read("lib/fertini-guest-cart.ts"), /addGuestCartProducts/);
assert.match(read("app/account/page.tsx"), /AccountGuest/);
assert.match(read("components/HomeProductsComponnents/ProductsFilterBar.tsx"), /fertini-filter-panel/);
assert.doesNotMatch(home, /میلیون تومان/);
assert.match(shop, /ProductsFilterBar/);
assert.match(shop, /ProductsSection/);
assert.match(shop, /demoMode&&categories\.length===0/);
assert.match(read("app/products/page.tsx"), /demoMode=\{demoMode\}/);
assert.match(product, /<CinematicFooter/);
assert.match(card, /تومان/);
assert.match(nav, /maison-menu-entry/);
assert.match(nav, /useProductSearch/);
assert.match(nav, /aria-modal="true"/);
assert.match(app, /prefers-reduced-motion/);
assert.match(app, /@media\(max-width:600px\)/);
assert.ok(existsSync("app/robots.ts") && existsSync("app/sitemap.ts"));
assert.match(read("app/sitemap.ts"), /productService\.getAll/);
assert.match(read("app/products/[id]/page.tsx"), /generateMetadata/);
for (const path of ["journal","about","contact","shipping","privacy","terms"]) {
 assert.ok(existsSync("app/" + path + "/page.tsx"), "missing destination: "+path);
}
assert.ok(existsSync("app/journal/how-to-choose-a-fragrance/page.tsx"));
// Cinematic refinement: a single, warm, reversed highlight over the exact
// wordmark, responsive side-by-side product captions, and later footer entry.
const productMotion=read("components/maison/FertiniEditorialMotion.tsx");
const footerMotion=read("components/home-sections/CinematicStorefront.tsx");
const productStyle=read("app/fertini-home-v5.css");
assert.ok(intro.includes('gsap.set(sheen,{autoAlpha:0,backgroundPosition:"180% 50%"})'));
assert.ok(intro.includes('.to(sheen,{backgroundPosition:"-180% 50%"'));
assert.ok(intro.includes('.to(sheen,{autoAlpha:.78'));
assert.ok(!intro.includes('textShadow:"0 0 11px rgba(232,194,143,.65)"'));
assert.ok(!intro.includes('.to(letters,{\n          color:'));
assert.doesNotMatch(footerMotion,/letterSpacing:/);
assert.ok(intro.includes('className="maison-intro__shine" aria-hidden="true"/'));
assert.ok(!intro.includes('aria-hidden="true">FERTINI</div>'));
assert.doesNotMatch(introCss,/-webkit-background-clip:text/);
assert.ok(introCss.includes("rgba(255,246,207,.54)"));
assert.ok(introCss.includes("z-index:5;pointer-events:none;opacity:0"));
assert.ok(introCss.includes("The sweep uses the position of the stationary wordmark"));
assert.match(home,/function FragranceCardInfo/);
assert.match(home,/fertini-v5-card__details/);
assert.match(home,/fertini-v5-card__identity/);
assert.match(home,/fertini-v5-card__price-column/);
assert.match(home,/data-fertini-caption-line/);
assert.match(productStyle,/\.fertini-v5-card__details\{/);
assert.match(productStyle,/direction:ltr;/);
assert.ok(productStyle.includes("display:grid;grid-template-columns:minmax(0,1fr) minmax(0,44%)"));
assert.ok(productStyle.includes("grid-column:1;grid-row:1"));
assert.ok(productStyle.includes("grid-column:2;grid-row:1"));
assert.ok(home.includes('className="fertini-v5-card__details" dir="ltr"')); 
assert.ok(!home.includes('className="fertini-v5-card__details" dir="ltr" style='));
assert.ok(!home.includes('className="fertini-v5-card__identity" dir="rtl" style='));
assert.ok(!home.includes('className="fertini-v5-card__price-column" dir="rtl" style='));
assert.ok(!home.includes('flex:"1 1 56%"'));
assert.ok(!home.includes('flex:"0 0 40%"'));
assert.match(productStyle,/\.fertini-v5-card__text-mask\{/);
assert.match(productStyle,/overflow:hidden/);
assert.ok(productMotion.includes('querySelectorAll<HTMLElement>("[data-fertini-caption-line]")'));
assert.ok(productMotion.includes('gsap.set(captions,{autoAlpha:0,yPercent:112})'));
assert.ok(productMotion.includes('tl.to(captions,{autoAlpha:1,yPercent:0'));
assert.ok(productMotion.includes('},1.74)'));
assert.ok(footerMotion.includes('start:"top 66%"'));
assert.ok(!footerMotion.includes('start:"top 87%"'));

// Consent, search exit and editorial linking must function without a real
// database. No anonymous demo item is misrepresented as stocked inventory.
const invite=read("components/maison/MaisonMusicInvitation.tsx");
const ambient=read("components/maison/MaisonAmbientSound.tsx");
const navbar=read("components/home-sections/navbar.tsx");
const pagesCss=read("app/fertini-editorial-pages.css");
const interactionCss=read("app/fertini-quiet-interactions.css");
const detail=read("app/fragrance/edition/[slug]/page.tsx");
const familyPage=read("app/fragrance/collection/[family]/page.tsx");
const editorialCatalog=read("lib/fertini-editorial-collection.ts");
const layoutStyles=read("app/layout.tsx");
assert.match(invite,/fertini:intro:complete/);
assert.match(invite,/fertini:ambient-invitation:answered:v1/);
assert.match(invite,/برای تجربه بهتر تمایل به پخش آوای پس زمینه دارید/);
assert.ok(invite.includes("onClick={()=>close(true)}"));
assert.ok(invite.includes("onClick={()=>close(false)}"));
assert.match(ambient,/const play=useCallback/);
assert.match(navbar,/className="fertini-sound-toggle__play"/);
assert.match(navbar,/className="fertini-sound-toggle__bars"/);
assert.match(navbar,/searchMounted/);
assert.match(navbar,/is-closing/);
assert.match(interactionCss,/maison-overlay--search.is-closing/);
assert.match(interactionCss,/fertini-music-consent.is-open/);
assert.ok(interactionCss.includes(".support-root .support-header"));
assert.match(layoutStyles,/fertini-quiet-interactions.css/);
assert.match(layoutStyles,/fertini-editorial-pages.css/);
assert.ok(home.includes("href={editorialFragranceHref(slug)}"));
assert.ok(home.includes("editorialFamilyHref(f.id as EditorialFamily)"));
assert.match(editorialCatalog,/FERTINI_EDITORIAL_FRAGRANCES/);
assert.match(editorialCatalog,/FERTINI_EDITORIAL_FAMILIES/);
assert.match(editorialCatalog,/slug:"roselia"/);
assert.match(editorialCatalog,/slug:"azure"/);
assert.match(detail,/generateStaticParams/);
assert.match(detail,/قیمت نمونه/);
assert.match(familyPage,/editorialFragranceHref/);
assert.match(pagesCss,/fertini-editorial-collection__card/);
assert.doesNotMatch(detail,/addToCart|productService.create|checkout/);

// Inventory management: one shared importer for 1000 CSV rows with preview
// and real admin protection. Runtime boot sync is create-only and idempotent.
const importer=read("app/api/v1/admin/editorial-import/route.ts");
const bulk=read("app/api/v1/admin/product-bulk-import/route.ts");
const panelProducts=read("components/PanelProductManagementComponents/products-management.tsx");
const sync=read("server/curated-catalog-sync.ts");
const boot=read("instrumentation.ts");
const git=read("server/git-catalog-sync.ts");
assert.ok(importer.includes("await requireAuth(request)"));
assert.ok(sync.includes("getByIdOrSlug(slug)"));
assert.ok(sync.includes("stock_qty:0"));
assert.ok(sync.includes("createProductSchema.parse"));
assert.ok(boot.includes("/home/fertinip/fertini-runtime"));
assert.ok(boot.includes("syncGitCatalog"));
assert.ok(git.includes('catalog/products.csv'));
assert.ok(bulk.includes("await requireAuth(request)"));
assert.ok(bulk.includes('action==="preview"'));
assert.ok(bulk.includes('existing==="skip"'));
assert.ok(panelProducts.includes("ProductBulkImport"));
assert.ok(!panelProducts.includes("ثبت عطرهای گالری"));
assert.ok(read("app/admin/(panel)/customers/page.tsx").includes("CustomerClub"));
assert.ok(read("components/admin/CustomerClub.tsx").includes("purchaseCount"));
assert.ok(!read("components/admin/CustomerClub.tsx").includes("points"));
assert.ok(read("server/validations/product.validation.ts").includes("validatePhotoChoices"));

// A successful admin login must validate the cookie before a fresh document
// navigation; never race an App Router replace and refresh into stale RSC.
const adminLogin=read("app/admin/login/page.tsx");
assert.ok(adminLogin.includes('fetch("/api/v1/auth/me"'));
assert.ok(adminLogin.includes('window.location.replace(destination)'));
assert.ok(!adminLogin.includes('router.replace(destination);router.refresh()'));

console.log("FERTINI v4 showroom, filters, motion and editorial SEO assertions passed.");
