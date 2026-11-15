import "server-only";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {createProductSchema} from "@/server/validations/product.validation";
import {productService} from "@/server/services/product.service";
import {scentFamilyService} from "@/server/services/scent-family.service";

/** Optional catalog/products.csv in the released runtime: safe create-only GitHub import.
 * It never overwrites an existing record or any changes made by the store manager.
 */
function csvRows(text:string):string[][]{
 const out:string[][]=[];let row:string[]=[],cell="",quoted=false;
 const src=text.replace(/^\uFEFF/,"");
 for(let i=0;i<src.length;i++){
  const c=src[i];
  if(c==='"'){
   if(quoted&&src[i+1]==='"'){cell+='"';i++;continue}
   if(quoted||cell===""){quoted=!quoted;continue}
  }
  if(c===","&&!quoted){row.push(cell);cell="";continue}
  if((c==="\n"||c==="\r")&&!quoted){
   if(c==="\r"&&src[i+1]==="\n")i++;
   row.push(cell);out.push(row);row=[];cell="";continue;
  }
  cell+=c;
 }
 if(quoted)throw Error("Unterminated quoted CSV cell");
 row.push(cell);if(row.some(x=>x.trim()))out.push(row);
 return out.filter(x=>x.some(v=>v.trim()));
}
const REQUIRED=["sku","name","group","type","volume_ml","price","discount_price","stock_qty","image_urls","main_image","description","is_best_seller"];
const numbers=(s:string)=>Number(s.replace(/[۰-۹]/g,c=>String("۰۱۲۳۴۵۶۷۸۹".indexOf(c))).replace(/[,٬\s]/g,""));
const validImage=(url:string)=>/^\/(?!\/)(?!.*\.\.)[^\s\\]+$/.test(url)||/^https:\/\/[^\s\\]+$/i.test(url);
export async function syncGitCatalog(){
 const filename=path.join(process.cwd(),"catalog/products.csv");
 let source:string;
 try{source=await readFile(filename,"utf8")}catch(e){
  if((e as NodeJS.ErrnoException).code==="ENOENT")return{created:0,skipped:0};
  throw e;
 }
 const [header,...lines]=csvRows(source);
 if(!header||!lines.length)return{created:0,skipped:0};
 if(lines.length>1000)throw Error("Git catalog must have no more than 1000 rows");
 const headers=header.map(x=>x.trim().toLowerCase());
 if(REQUIRED.some(x=>!headers.includes(x)))throw Error("Git catalog CSV headers are incomplete");
 const grouped=new Map<string,{sku:string;name:string;group:string;type:"SINGLE"|"GROUPED";description:string;
  best:boolean;images:{image_url:string;is_main:boolean}[];
  variants:{volume_ml:number;price:number;discount_price:number|null;stock_qty:number;is_active:boolean;
   images:{image_url:string;is_main:boolean}[]}[]}>();
 for(const [index,parts] of lines.entries()){
  const row=Object.fromEntries(headers.map((header,i)=>[header,(parts[i]||"").trim()]));
  const sku=row.sku.toLowerCase(),type=row.type.toUpperCase();
  const urls=row.image_urls.split("|").map(v=>v.trim()).filter(Boolean);
  const main=row.main_image||urls[0],volume=numbers(row.volume_ml),price=numbers(row.price);
  const stock=numbers(row.stock_qty),discount=row.discount_price?numbers(row.discount_price):null;
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(sku)||!row.name||!row.group||
   !["SINGLE","GROUPED"].includes(type)||!urls.length||urls.some(x=>!validImage(x))||
   !urls.includes(main)||!Number.isInteger(volume)||volume<=0||!Number.isFinite(price)||price<=0||
   !Number.isInteger(stock)||stock<0||(discount!==null&&!(discount>0&&discount<price)))
   throw Error("Invalid Git catalog row "+(index+2));
  let item=grouped.get(sku);
  if(!item){item={sku,name:row.name,group:row.group,type:type as "SINGLE"|"GROUPED",
   description:row.description||"",best:["1","true","yes"].includes(row.is_best_seller.toLowerCase()),
   images:urls.map(u=>({image_url:u,is_main:u===main})),variants:[]};grouped.set(sku,item);}
  if(item.name!==row.name||item.type!==type||item.group!==row.group||
   item.variants.some(v=>v.volume_ml===volume)||item.type==="SINGLE"&&item.variants.length)
   throw Error("Inconsistent or duplicate Git catalog row "+(index+2));
  item.variants.push({volume_ml:volume,price,discount_price:discount,stock_qty:stock,
   is_active:true,images:type==="GROUPED"?urls.map(u=>({image_url:u,is_main:u===main})):[]});
 }
 let families:Array<{id:number;name:string}>=await scentFamilyService.getList(),created=0,skipped=0;
 for(const item of grouped.values()){
  if(await productService.getByIdOrSlug(item.sku)){skipped++;continue;}
  let family=families.find(f=>f.name.trim()===item.group);
  if(!family){
   family=await scentFamilyService.create({name:item.group,image_url:"",is_active:true,sort_order:families.length});
   if(!family)throw Error("Failed to create scent family "+item.group);
   families=[...families,family];
  }
  const payload=createProductSchema.parse({
   slug:item.sku,type:item.type,name:item.name,description:item.description,
   scent_family_id:Number(family.id),category_id:null,parent_category_id:null,category_links:[],
   is_active:true,is_featured:false,is_best_seller:item.best,status:"ACTIVE",
   images:item.images,variants:item.variants
  });
  // Unique slug constraint makes an unexpected concurrent import safe to retry.
  try{await productService.create(payload);created++}
  catch(e){if(await productService.getByIdOrSlug(item.sku))skipped++;else throw e;}
 }
 return {created,skipped};
}
