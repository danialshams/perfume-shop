import HomePageShell from "@/components/HomeWrapper/home-page-shell";
import {readSiteContent} from "@/server/site-content";
import {DEFAULT_SITE_CONTENT} from "@/lib/fertini-site-content";
export const dynamic="force-dynamic";
export default async function Page(){
 let content=DEFAULT_SITE_CONTENT;
 try{content=await readSiteContent()}catch{/* Preview remains functional without a configured MySQL database. */}
 return <HomePageShell content={content}/>;
}
