import {validateMediaMeta,type Kind} from "./admin-media-validation";
export type AdminUpload={url:string;file_name?:string;size?:number;mime_type?:string};
const json=async(res:Response)=>{const data=await res.json().catch(()=>({}));if(!res.ok)throw Error(data.error||data.message||"آپلود ناموفق بود");return data};
export async function uploadAdminFile(file:File,kind:Kind,progress?:(n:number)=>void):Promise<AdminUpload>{
 const verdict=validateMediaMeta(file,kind);
 if(!verdict.ok)throw Error(verdict.error);
 progress?.(0);
 const preflight=await fetch("/api/v1/admin/media-upload/start",{method:"POST",credentials:"same-origin",
  headers:{"Content-Type":"application/json"},
  body:JSON.stringify({kind,name:file.name,type:file.type,size:file.size})});
 const ready=await json(preflight) as {mode?:string};
 if(ready.mode!=="local")throw Error("روش آپلود پشتیبانی نمی‌شود.");
 const data=new FormData();data.append("file",file);
 const response=await fetch(kind==="image"?"/api/v1/uploads/products":"/api/v1/uploads/products/voice",
  {method:"POST",body:data,credentials:"same-origin"});
 const payload=await json(response);
 progress?.(100);
 return payload.data as AdminUpload;
}
