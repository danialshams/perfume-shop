import "server-only";
import {productService} from "@/server/services/product.service";
import {scentFamilyService} from "@/server/services/scent-family.service";
import {createProductSchema} from "@/server/validations/product.validation";
import {
 FERTINI_EDITORIAL_FRAGRANCES,FERTINI_EDITORIAL_FAMILIES,
 type EditorialFamily,
} from "@/lib/fertini-editorial-collection";

const families:EditorialFamily[]=["woody","oud","vanilla"];
const slugPrefix="fertini-editorial-";
function hostedImage(url:string):string{
 const p=new URL(url,"https://fertiniperfume.com");
 if(p.origin!=="https://fertiniperfume.com"||
  !/^\/api\/v1\/editorial\/[a-z0-9-]+\.webp$/.test(p.pathname))
  throw Error("Unexpected editorial photo location");
 return p.pathname;
}
/**
 * Idempotent catalog bootstrap. Only records with the reserved editorial slug
 * prefix are created. Existing merchandise, prices, inventory and admin edits
 * are deliberately never overwritten. The six items start with zero stock.
 */
export async function syncCuratedCatalog(){
 const created:{slug:string;id:number}[]=[],skipped:string[]=[];
 const known=await scentFamilyService.getList();
 const familyIds=new Map<EditorialFamily,number>();
 for(const [index,key] of families.entries()){
  const family=FERTINI_EDITORIAL_FAMILIES[key];
  const existing=known.find(x=>x.name.trim()===family.name.trim());
  let record=existing??await scentFamilyService.create({
   name:family.name,image_url:hostedImage(family.photo),is_active:true,sort_order:index
  });
  if(existing&&(!existing.image_url||!existing.image_url.includes("/api/v1/editorial/family-"))){
   record=await scentFamilyService.update(existing.id,{image_url:hostedImage(family.photo)});
  }
  if(!record?.id)throw Error("Failed to ensure editorial scent family: "+key);
  familyIds.set(key,Number(record.id));
 }
 for(const [index,item] of FERTINI_EDITORIAL_FRAGRANCES.entries()){
  const slug=slugPrefix+item.slug;
  const prev=await productService.getByIdOrSlug(slug);
  if(prev){skipped.push(item.slug);continue;}
  const id=familyIds.get(item.family);
  if(!id)throw Error("Missing scent family: "+item.family);
  const validated=createProductSchema.parse({
   type:"SINGLE",name:item.name,slug,description:item.description,
   category_id:null,parent_category_id:null,category_links:[],
   scent_family_id:id,is_active:true,is_best_seller:index<3,is_featured:false,status:"ACTIVE",
   images:[{image_url:hostedImage(item.image),is_main:true}],
   variants:[{volume_ml:50,price:item.price,discount_price:null,
     stock_qty:0,is_active:true,images:[]}]
  });
  try{
   const saved=await productService.create(validated);
   if(!saved?.id)throw Error("Product not created");
   created.push({slug:item.slug,id:Number(saved.id)});
  }catch(error){
   // Multiple cold-start workers may race. An existing slug is not a failure.
   if(await productService.getByIdOrSlug(slug)){skipped.push(item.slug);continue;}
   throw error;
  }
 }
 return {created,skipped,stock:"zero" as const,total:6};
}
