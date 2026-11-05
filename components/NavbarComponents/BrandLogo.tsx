"use client";

import Link from "next/link";

export default function BrandLogo() {
  return (
    <Link href="/" aria-label="MAISON — صفحه اصلی" className="flex min-w-0 flex-col items-center justify-center text-[#302d29]">
      <span lang="en" dir="ltr" className="font-serif text-[20px] leading-none tracking-[.20em] sm:text-[23px]">
        MAISON
      </span>
      <span lang="en" dir="ltr" className="mt-1.5 hidden font-serif text-[8px] tracking-[.17em] text-[#9b8263] sm:block">
        THE FRAGRANCE EDIT
      </span>
    </Link>
  );
}
