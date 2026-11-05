import { Suspense } from "react";
import MaisonIntro from "@/components/maison/MaisonIntro";
import LuxuryNavbar from "@/components/home-sections/navbar";
import CinematicStorefront, { CinematicFooter } from "@/components/home-sections/CinematicStorefront";

export default function HomePageShell() {
  return <div className="ql-home min-h-screen">
    <MaisonIntro />
    <Suspense fallback={<div className="h-[88px]" aria-hidden="true" />}><LuxuryNavbar /></Suspense>
    <CinematicStorefront />
    <CinematicFooter />
  </div>;
}
