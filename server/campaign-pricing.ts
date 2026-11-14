import {visiblePublicVariants} from "@/server/utils/product-visibility";
import {campaignDiscountPercent,type FertiniSiteContent} from "@/lib/fertini-site-content";
/** Display an identical campaign price to the server-calculated checkout price. */
export function campaignPublicVariants<T extends {is_active?:boolean|number|null;price?:number|string|null;discount_price?:number|string|null}>(
 variants:T[]|undefined,content:FertiniSiteContent,productId:number
):T[]{
 const percent=campaignDiscountPercent(content,productId);
 const active=visiblePublicVariants(variants);
 if(percent<=0)return active;
 return active.map(variant=>{
  const regular=Number(variant.discount_price??variant.price??0);
  if(!Number.isFinite(regular)||regular<=0)return variant;
  return {...variant,discount_price:Math.round(regular*(100-percent)/100)} as T;
 });
}
