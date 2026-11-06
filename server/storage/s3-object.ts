import {createHash,createHmac} from "node:crypto";
const sha=(x:string|Uint8Array)=>createHash("sha256").update(x).digest("hex");
const mac=(k:Buffer|string,x:string)=>createHmac("sha256",k).update(x).digest();
export class StorageNotConfiguredError extends Error{}
export const storageReady=()=>["S3_ENDPOINT","S3_BUCKET","S3_ACCESS_KEY_ID","S3_SECRET_ACCESS_KEY","S3_PUBLIC_BASE_URL"].every(x=>!!process.env[x]);
export async function putObject(key:string,buffer:Uint8Array,mime:string){
 if(!storageReady())throw new StorageNotConfiguredError("فضای ذخیره‌سازی دائمی متصل نشده است.");
 if(!/^[a-z0-9/_-]+\.[a-z0-9]+$/i.test(key))throw Error("Invalid storage key");
 const endpoint=new URL(process.env.S3_ENDPOINT!);
 if(endpoint.protocol!=="https:"&&process.env.NODE_ENV==="production")throw Error("HTTPS is required");
 const uri=endpoint.pathname.replace(/\/$/,"")+"/"+encodeURIComponent(process.env.S3_BUCKET!)+"/"+key.split("/").map(encodeURIComponent).join("/");
 const url=new URL(uri,endpoint.origin);
 const date=new Date().toISOString().replace(/[:-]|\.\d{3}/g,""),short=date.slice(0,8),region=process.env.S3_REGION||"us-east-1";
 const hash=sha(buffer),signed="content-type;host;x-amz-content-sha256;x-amz-date";
 const headers=`content-type:${mime}\nhost:${endpoint.host}\nx-amz-content-sha256:${hash}\nx-amz-date:${date}\n`;
 const scope=`${short}/${region}/s3/aws4_request`,request=["PUT",uri,"",headers,signed,hash].join("\n");
 const toSign=["AWS4-HMAC-SHA256",date,scope,sha(request)].join("\n");
 const keyBytes=mac(mac(mac(mac("AWS4"+process.env.S3_SECRET_ACCESS_KEY!,short),region),"s3"),"aws4_request");
 const signature=createHmac("sha256",keyBytes).update(toSign).digest("hex");
 const auth=`AWS4-HMAC-SHA256 Credential=${process.env.S3_ACCESS_KEY_ID}/${scope}, SignedHeaders=${signed}, Signature=${signature}`;
 const response=await fetch(url,{method:"PUT",body:Uint8Array.from(buffer).buffer as ArrayBuffer,headers:{"content-type":mime,"x-amz-date":date,"x-amz-content-sha256":hash,"authorization":auth}});
 if(!response.ok)throw Error("Storage returned "+response.status);
 const publicUrl=new URL(process.env.S3_PUBLIC_BASE_URL!.replace(/\/$/,"")+"/"+key.split("/").map(encodeURIComponent).join("/"));
 if(publicUrl.protocol!=="https:")throw Error("Public storage must use HTTPS");
 return publicUrl.toString();
}
