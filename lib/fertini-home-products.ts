import { FERTINI_DEMOS } from "@/lib/fertini-demo";
export type HomeProduct = {
  id: string;
  numericId: number;
  name: string;
  subtitle: string;
  image: string;
  price: number | null;
  href: string;
  featured: boolean;
  isDemo: boolean;
};
export const DEMO_HOME_PRODUCTS: HomeProduct[] = FERTINI_DEMOS.map(x => ({
  id: x.id, numericId: 0, name: x.name,
  subtitle: x.subtitle.split(" — ")[0],
  image: x.image, price: x.variants[1]?.price ?? null,
  href: "/fragrance/" + x.id, featured: x.collection === "bestseller", isDemo: true,
}));
