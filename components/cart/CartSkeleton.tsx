import LuxuryNavbar from "@/components/home-sections/navbar";
import { CinematicFooter } from "@/components/home-sections/CinematicStorefront";

export default function CartSkeleton() {
  return (
    <>
      <LuxuryNavbar />
      <section className="ql-container min-h-[72svh] py-16 sm:py-24" aria-label="در حال آماده‌سازی سبد خرید" aria-busy="true" role="status">
        <div className="mb-12 flex justify-between border-b border-[#ded6cb] pb-6">
          <div className="h-8 w-40 animate-pulse bg-[#e7ded1] motion-reduce:animate-none" />
          <div className="h-3 w-20 animate-pulse bg-[#e7ded1] motion-reduce:animate-none" />
        </div>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-5">
            {[0, 1, 2].map((item) => (
              <div key={item} className="flex gap-6 border-b border-[#ded6cb] pb-6">
                <div className="h-32 w-24 shrink-0 animate-pulse bg-[#e7ded1] motion-reduce:animate-none" />
                <div className="flex-1 space-y-5 py-4">
                  <div className="h-4 w-2/3 animate-pulse bg-[#e7ded1] motion-reduce:animate-none" />
                  <div className="h-3 w-1/3 animate-pulse bg-[#e7ded1] motion-reduce:animate-none" />
                </div>
              </div>
            ))}
          </div>
          <div className="hidden h-72 animate-pulse border border-[#ded6cb] bg-[#f8f5ef] motion-reduce:animate-none lg:block" />
        </div>
      </section>
      <CinematicFooter />
    </>
  );
}
