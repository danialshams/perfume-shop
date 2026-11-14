import type { Metadata } from "next";
import {currentSeo,seoMetadata} from "@/server/seo-metadata";
import type { ReactNode } from "react";
import { CartCountProvider } from "@/context/CartCountContext";
import MaisonAmbientSound from "@/components/maison/MaisonAmbientSound";
import FertiniEditorialMotion from "@/components/maison/FertiniEditorialMotion";
import {SupportChat} from "@/components/maison/SupportChat";
import "./globals.css";
import "./quiet-luxury.css";
import "./maison-experience.css";
import "./maison-v3.css";
import "./maison-home-v3.css";
import "./maison-pages-v3.css";
import "./maison-fonts.css";
import "./maison-commerce-v3.css";
import "./fertini-refinement.css";
import "./fertini-commerce.css";
import "./fertini-skeleton.css";
import "./fertini-nav-v5.css";
import "./fertini-home-v5.css";
import "./fertini-cart-v5.css";
import "./fertini-product-v5.css";
import "./fertini-account-v5.css";
import "./fertini-inner-heroes-v5.css";
import "./fertini-polish-v6.css";
import "./fertini-engagement.css";

export async function generateMetadata():Promise<Metadata>{
  const settings=await currentSeo();
  const result=seoMetadata(settings,"/",{title:"FERTINI | گالری عطر و رایحه",
    description:"گالری عطر و رایحه فرتینی"});
  // Never stamp the homepage canonical onto every subpage inheriting the root layout.
  return {...result,alternates:undefined};
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="fa" dir="rtl" className="h-full antialiased">
    <head><meta name="enamad" content="487910412" /><script dangerouslySetInnerHTML={{__html:"try{if(sessionStorage.getItem('fertini:intro:seen:v3')==='1')document.documentElement.classList.add('fertini-intro-seen')}catch(e){}"}} /></head>
    <body id="top" className="flex min-h-full flex-col font-sans">
      <MaisonAmbientSound><CartCountProvider>{children}<FertiniEditorialMotion/><SupportChat/></CartCountProvider></MaisonAmbientSound>
    </body>
  </html>;
}
