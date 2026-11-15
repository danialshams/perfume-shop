/**
 * Run only once when the live cPanel PM2 runtime starts. Does not run during
 * GitHub CI, Vercel previews, builds or ordinary public GET requests.
 * A DB failure cannot break website startup; next PM2 restart retries.
 */
export async function register(){
 if(process.env.NEXT_RUNTIME!=="nodejs" || process.env.NODE_ENV!=="production")return;
 if(process.cwd()!=="/home/fertinip/fertini-runtime")return;
 if(!process.env.DATABASE_URL)return;
 try{
  const {syncCuratedCatalog}=await import("./server/curated-catalog-sync");
  const result=await syncCuratedCatalog();
  console.info("FERTINI curated catalog synced",{
   created:result.created.length,existing:result.skipped.length,
   stock:result.stock,
  });
 }catch(error){
  console.error("FERTINI catalog initialization failed (site remains available)",error);
 }
 // Products committed as catalog/products.csv are create-only on each release.
 // An admin's edits to existing inventory are never overwritten by a Git push.
 try{
  const {syncGitCatalog}=await import("./server/git-catalog-sync");
  const result=await syncGitCatalog();
  console.info("FERTINI GitHub catalog synced",result);
 }catch(error){console.error("FERTINI GitHub catalog import failed",error)}
}
