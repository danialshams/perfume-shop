import MaisonIntro from "@/components/maison/MaisonIntro";
// Temporarily paused — keep the component available for future reactivation.
// import MaisonMusicInvitation from "@/components/maison/MaisonMusicInvitation";
import LuxuryNavbar from "@/components/home-sections/navbar";
import CinematicStorefront, { CinematicFooter } from "@/components/home-sections/CinematicStorefront";
import type { FertiniSiteContent } from "@/lib/fertini-site-content";
import type { HomeProduct } from "@/lib/fertini-home-products";

export default function HomePageShell({ content, products, catalogState, scentFamilies=[] }: {
  content: FertiniSiteContent;
  products: HomeProduct[];
  catalogState: "demo" | "database" | "unavailable";
  scentFamilies?: Array<{ id:number; name:string; image_url:string|null }>;
}) {
  return <div className="ql-home min-h-screen">
    <MaisonIntro />
    {/* Temporarily hidden; restore <MaisonMusicInvitation /> when requested. */}
    <LuxuryNavbar />
    <CinematicStorefront content={content} products={products} catalogState={catalogState} scentFamilies={scentFamilies}/>
    <CinematicFooter content={content} />
  </div>;
}
