import LuxuryNavbar from "@/components/home-sections/navbar";
import CinematicStorefront, { CinematicFooter } from "@/components/home-sections/CinematicStorefront";

export default function HomePageShell() {
  return <div className="ql-home min-h-screen">
    <LuxuryNavbar />
    <CinematicStorefront />
    <CinematicFooter />
  </div>;
}
