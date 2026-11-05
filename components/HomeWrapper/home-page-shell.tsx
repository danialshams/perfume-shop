import { Suspense } from "react";
import LuxuryNavbar from "@/components/home-sections/navbar";
import CinematicStorefront, { CinematicFooter } from "@/components/home-sections/CinematicStorefront";

export default function HomePageShell() {
  return <div className="ql-home min-h-screen">
    <Suspense fallback={<div className="h-[88px]" aria-hidden="true" />}><LuxuryNavbar /></Suspense>
    <CinematicStorefront />
    <CinematicFooter />
  </div>;
}
