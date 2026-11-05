"use client";

import Link from "next/link";
export default function BrandLogo() {
  return <Link href="/" aria-label="MAISON — صفحه اصلی" className="group flex shrink-0 items-center justify-center gap-2 text-[#302d29]">
    <span className="font-serif text-[27px] font-normal leading-none tracking-[-.11em] min-[920px]:text-[30px]" lang="en" dir="ltr">M</span>
    <span className="hidden h-6 w-px bg-[#ac9d88]/65 sm:block" aria-hidden="true"/>
    <span className="hidden flex-col leading-tight sm:flex" lang="en" dir="ltr">
      <strong className="font-serif text-[14px] font-normal leading-none tracking-[.22em] text-[#302d29]">MAISON</strong>
      <small className="mt-1.5 font-serif text-[8px] tracking-[.16em] text-[#9b8263]">THE FRAGRANCE EDIT</small>
    </span>
  </Link>;
}
