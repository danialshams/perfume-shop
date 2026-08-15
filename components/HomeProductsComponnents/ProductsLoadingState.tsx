"use client";

function MobileProductSkeleton() {
  return (
    <div className="min-w-0 animate-pulse">
      <div className="overflow-hidden rounded-none">
        <div className="aspect-[0.76/1] w-full bg-[#f2f2f2]" />
      </div>

      <div className="mt-[16px] flex items-start justify-between gap-3 px-[4px]" dir="rtl">
        <div className="h-[11px] w-3/5 rounded-full bg-[#f2f2f2]" />
        <div className="h-[11px] w-1/4 rounded-full bg-[#f6f6f6]" />
      </div>
    </div>
  );
}

function DesktopProductSkeleton() {
  return (
    <div className="min-w-0 animate-pulse">
      <div className="overflow-hidden rounded-none">
        <div className="aspect-[0.76/1] w-full bg-[#f2f2f2]" />
      </div>

      <div className="mt-[20px] flex items-start justify-between gap-3 px-[4px]" dir="rtl">
        <div className="h-[12px] w-3/5 rounded-full bg-[#f2f2f2]" />
        <div className="h-[12px] w-1/4 rounded-full bg-[#f6f6f6]" />
      </div>
    </div>
  );
}

export default function ProductsLoadingState() {
  return (
    <>
      <div className="grid grid-cols-2 items-start gap-x-4 gap-y-10 sm:gap-x-5 sm:gap-y-11 md:grid-cols-3 md:gap-x-5 md:gap-y-11 lg:hidden">
        {Array.from({ length: 6 }).map((_, index) => (
          <MobileProductSkeleton key={index} />
        ))}
      </div>

      <div className="hidden lg:grid lg:grid-cols-4 lg:gap-x-6 lg:gap-y-12 xl:gap-x-7 xl:gap-y-14">
        {Array.from({ length: 8 }).map((_, index) => (
          <DesktopProductSkeleton key={index} />
        ))}
      </div>
    </>
  );
}
