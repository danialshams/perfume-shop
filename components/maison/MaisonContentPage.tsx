import type { ReactNode } from "react";
import LuxuryNavbar from "@/components/home-sections/navbar";
import { CinematicFooter } from "@/components/home-sections/CinematicStorefront";

export function MaisonPage({ kicker, title, lead, children }: {
  kicker: string; title: string; lead?: string; children: ReactNode;
}) {
  return <div className="maison-page min-h-screen">
    <LuxuryNavbar />
    <main id="main-content">
      <header className="maison-page__hero maison-wide">
        <span className="maison-kicker" dir="ltr" lang="en">{kicker}</span>
        <h1>{title}</h1>
        {lead && <p>{lead}</p>}
      </header>
      <div className="maison-page__body maison-wide">{children}</div>
    </main>
    <CinematicFooter />
  </div>;
}
export function MaisonSection({ number, title, children }: {
  number: string; title: string; children: ReactNode;
}) {
  return <section className="maison-page__section">
    <span lang="en" dir="ltr">{number}</span>
    <div><h2>{title}</h2><div className="maison-page__prose">{children}</div></div>
  </section>;
}
