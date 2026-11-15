/**
 * Exact names of the private, user-uploaded editorial images on the Fertini host.
 * Never put these photos into the replaceable cPanel runtime directory.
 * One canonical origin also makes Vercel previews use the same uploaded photos.
 */
export const EDITORIAL_IMAGE_NAMES = [
  "hero-01-golden-citrus-blossom.png",
  "hero-02-luxury-oud-amber.png",
  "product-01-rose-crystal.png",
  "product-02-vanilla-tonka.png",
  "product-03-smoked-vetiver-cedar.png",
  "product-04-neroli-green-tea.png",
  "product-05-ruby-amber-saffron.png",
  "family-01-woody.png",
  "family-02-oud-smoky.png",
  "family-03-vanilla.png",
] as const;

export const OPTIMIZED_EDITORIAL_IMAGE_NAMES = [
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
] as const;

export type EditorialImageName = (typeof EDITORIAL_IMAGE_NAMES)[number] |
  (typeof OPTIMIZED_EDITORIAL_IMAGE_NAMES)[number];

// The host serves WebP with image/png fallback for legacy uploaded filenames
// until the new ZIP has been extracted into the same durable folder.
export const editorialImage = (name: EditorialImageName): string =>
  "https://fertiniperfume.com/api/v1/editorial/" + name;

export const FERTINI_HERO_IMAGES = [
  editorialImage("hero-01-golden-citrus-blossom.webp"),
  editorialImage("hero-02-luxury-oud-amber.webp"),
] as const;

export const FERTINI_PRODUCT_IMAGES = [
  editorialImage("product-01-rose-crystal.webp"),
  editorialImage("product-03-smoked-vetiver-cedar.webp"),
  editorialImage("product-05-ruby-amber-saffron.webp"),
  editorialImage("product-02-vanilla-tonka.webp"),
  editorialImage("product-04-neroli-green-tea.webp"),
  editorialImage("product-06-iris-marine.webp"),
] as const;

export const FERTINI_FAMILY_IMAGES = {
  woody: editorialImage("family-01-woody.webp"),
  oud: editorialImage("family-02-oud-smoky.webp"),
  vanilla: editorialImage("family-03-vanilla.webp"),
} as const;
