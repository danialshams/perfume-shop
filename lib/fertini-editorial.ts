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

export type EditorialImageName = (typeof EDITORIAL_IMAGE_NAMES)[number];

export const editorialImage = (name: EditorialImageName): string =>
  "https://fertiniperfume.com/api/v1/editorial/" + name;

export const FERTINI_HERO_IMAGES = [
  editorialImage("hero-01-golden-citrus-blossom.png"),
  editorialImage("hero-02-luxury-oud-amber.png"),
] as const;

export const FERTINI_PRODUCT_IMAGES = [
  editorialImage("product-01-rose-crystal.png"),
  editorialImage("product-03-smoked-vetiver-cedar.png"),
  editorialImage("product-05-ruby-amber-saffron.png"),
  editorialImage("product-02-vanilla-tonka.png"),
  editorialImage("product-04-neroli-green-tea.png"),
] as const;

export const FERTINI_FAMILY_IMAGES = {
  woody: editorialImage("family-01-woody.png"),
  oud: editorialImage("family-02-oud-smoky.png"),
  vanilla: editorialImage("family-03-vanilla.png"),
} as const;
