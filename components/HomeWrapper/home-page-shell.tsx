import MaisonIntro from "@/components/maison/MaisonIntro";
import LuxuryNavbar from "@/components/home-sections/navbar";
import CinematicStorefront, { CinematicFooter } from "@/components/home-sections/CinematicStorefront";
import type { FertiniSiteContent } from "@/lib/fertini-site-content";
import type { HomeProduct } from "@/lib/fertini-home-products";

export default function HomePageShell({ content, products, catalogState }: {
  content: FertiniSiteContent;
  products: HomeProduct[];
  catalogState: "demo" | "database" | "unavailable";
}) {
  return <div className="ql-home min-h-screen">
    <MaisonIntro />
    <LuxuryNavbar />
    <CinematicStorefront content={content} products={products} catalogState={catalogState} />
    <CinematicFooter content={content} />
  </div>;
}
