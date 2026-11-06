import MaisonIntro from "@/components/maison/MaisonIntro";
import LuxuryNavbar from "@/components/home-sections/navbar";
import CinematicStorefront, { CinematicFooter } from "@/components/home-sections/CinematicStorefront";
import type {FertiniSiteContent} from "@/lib/fertini-site-content";

export default function HomePageShell({content}:{content?:FertiniSiteContent}) {
  return <div className="ql-home min-h-screen">
    <MaisonIntro />
    <LuxuryNavbar />
    <CinematicStorefront content={content} />
    <CinematicFooter />
  </div>;
}
