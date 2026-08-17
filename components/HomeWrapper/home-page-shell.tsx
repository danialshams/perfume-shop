"use client";

import { useCallback, useEffect, useState } from "react";
import LuxuryNavbar from "@/components/home-sections/navbar";
import LuxuryHero from "../home-sections/LuxuryHero";
import LuxuryPerfumeSlider from "../home-sections/LuxuryPerfumeSlider";
import BestSellerProducts from "../home-sections/BestSellerProducts";
import LuxuryFooter from "../home-sections/LuxuryFooter";
import InitialLoader from "../panel-sections/initial-loader";
import CategoryBlurSlider from "../home-sections/CategoryBlurSlider";

export default function HomePageShell() {
  // مقدار اولیه باید در SSR و CSR یکسان باشد؛ فلگ session را داخل effect بخوان.
  const [loaderDone, setLoaderDone] = useState(false);

  useEffect(() => {
    if (document.documentElement.classList.contains("fx-intro-seen")) {
      setLoaderDone(true);
    }
  }, []);

  const handleLoaderFinish = useCallback(() => {
    setLoaderDone(true);
  }, []);

  return (
    <>
      {/*
        محتوا همیشه رندر می‌شود؛ لودر فقط پرده‌ی رویی است.
        اینطور اگر لودر خطا بدهد یا onFinish صدا نشود، صفحه سفید نمی‌ماند.
      */}
      <div className="relative min-h-screen w-full bg-[#F8F8F8] select-none">
        <LuxuryNavbar />

        <main
          // انیمیشن ظهور فقط بعد از رفتن پرده اجرا می‌شود، ولی محتوا از ابتدا در DOM و visible است
          className={[
            "flex flex-col gap-y-16 sm:gap-y-24 md:gap-y-32 lg:gap-y-40",
            loaderDone
              ? "animate-[luxuryReveal_1600ms_cubic-bezier(0.16,1,0.3,1)_both]"
              : "",
          ].join(" ")}
        >
          <LuxuryPerfumeSlider />
          <LuxuryHero />
          <BestSellerProducts />
          <CategoryBlurSlider />
        </main>

        <LuxuryFooter />
      </div>

      <InitialLoader onFinish={handleLoaderFinish} />
    </>
  );
}
