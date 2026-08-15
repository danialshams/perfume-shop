import type { NavItem } from "./navbar.types";

export const navItems: NavItem[] = [
  { label: "خانه", href: "/" },
  {
    label: "دسته‌بندی",
    href: "/categories",
    children: [
      { label: "عطر زنانه", href: "/products/women" },
      { label: "عطر مردانه", href: "/products/men" },
      { label: "یونیسکس", href: "/products/unisex" },
      { label: "نیش", href: "/products/niche" },
    ],
  },
  { label: "محصولات", href: "/products" },
  { label: "درباره ما", href: "/about" },
  { label: "تماس با ما", href: "/contact" },
];
