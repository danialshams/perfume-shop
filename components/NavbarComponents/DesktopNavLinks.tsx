"use client";

import Link from "next/link";
import { MUTED_2 } from "./navbar.constants";
import type { NavItem } from "./navbar.types";

type DesktopNavLinksProps = {
  navItems: NavItem[];
  hoveredHref: string | null;
  setHoveredHref: React.Dispatch<React.SetStateAction<string | null>>;
  isActive: (href: string) => boolean;
};

export default function DesktopNavLinks({
  navItems,
  hoveredHref,
  setHoveredHref,
  isActive,
}: DesktopNavLinksProps) {
  return (
    <div className="hidden min-w-0 items-center gap-0.5 min-[920px]:flex min-[1080px]:gap-1.5 min-[1280px]:gap-2">
      {navItems.map((item) => {
        const active = isActive(item.href);
        const showDot = active || hoveredHref === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            onMouseEnter={() => setHoveredHref(item.href)}
            onMouseLeave={() => setHoveredHref(null)}
            onFocus={() => setHoveredHref(item.href)}
            onBlur={() => setHoveredHref(null)}
            className={[
              "relative inline-flex shrink-0 rounded-full px-2 py-2 text-[12.5px] text-[#33383C] transition-all duration-300",
              "min-[1080px]:px-3 min-[1080px]:text-[13.5px]",
              "min-[1280px]:px-3.5 min-[1280px]:text-[14px]",
              active
                ? "font-medium text-[#33383C]"
                : "font-normal text-[#33383C] hover:text-[#33383C]",
            ].join(" ")}
          >
            <span className="relative whitespace-nowrap leading-none">
              {item.label}

              <span
                className={[
                  "pointer-events-none absolute -bottom-[10px] right-1/2 h-[5px] w-[5px] translate-x-1/2 rounded-full transition-all duration-300",
                  showDot
                    ? active
                      ? "scale-100 opacity-100"
                      : "scale-100 opacity-45"
                    : "scale-50 opacity-0",
                ].join(" ")}
                style={{ backgroundColor: MUTED_2 }}
              />
            </span>
          </Link>
        );
      })}
    </div>
  );
}
