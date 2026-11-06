import fs from "node:fs/promises";
import path from "node:path";
import {randomUUID} from "node:crypto";
import {validateMediaMeta,validateMediaBytes,type Kind} from "@/lib/admin-media-validation";
import {putObject,storageReady,StorageNotConfiguredError} from "./s3-object";
export async function saveMedia(file:File,kind:Kind){
 const metadata=validateMediaMeta(file,kind);if(!metadata.ok)return{ok:false as const,error:metadata.error,status:400};
 const bytes=new Uint8Array(await file.arrayBuffer());
 const check=validateMediaBytes(file,kind,bytes);if(!check.ok)return{ok:false as const,error:check.error,status:400};
 const objectName="products/"+(kind==="voice"?"voices/":"")+randomUUID()+"."+check.ext;
 let url:string;
 if(storageReady())url=await putObject(objectName,bytes,check.mime);
 else if(process.env.NODE_ENV==="production"||process.env.VERCEL==="1")throw new StorageNotConfiguredError("ابتدا S3-compatible storage را در Vercel متصل کنید.");
 else{
  const filePath=path.join(process.cwd(),"public","uploads",objectName);
  await fs.mkdir(path.dirname(filePath),{recursive:true});await fs.writeFile(filePath,bytes);
  url="/uploads/"+objectName;
 }
 return{ok:true as const,url,file_name:objectName,size:file.size,mime_type:check.mime};
}
