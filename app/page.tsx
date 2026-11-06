import HomePageShell from "@/components/HomeWrapper/home-page-shell";
import {readSiteContent} from "@/server/site-content";
import {DEFAULT_SITE_CONTENT} from "@/lib/fertini-site-content";
export const dynamic="force-dynamic";
export default async function Page(){
 let content=DEFAULT_SITE_CONTENT;
 if(process.env.DB_HOST&&process.env.DB_NAME&&process.env.DB_USER){
  try{content=await readSiteContent()}catch{/* The public homepage can fall back if staging DB is offline. */}
 }
 return <HomePageShell content={content}/>;
}
