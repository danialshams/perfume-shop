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
assert.ok(intro.indexOf('.to(line,{scaleX:1')<intro.indexOf('.to(sheen,{autoAlpha:.82'));
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
assert.match(editorialRoute,/localMediaDirectory/);
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
assert.match(home,/newestEditorialPreviews = \[/);
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
console.log("FERTINI v4 showroom, filters, motion and editorial SEO assertions passed.");
