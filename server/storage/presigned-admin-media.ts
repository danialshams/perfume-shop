import {createHmac,createHash,randomUUID,timingSafeEqual} from "node:crypto";
import {storageReady} from "./s3-object";
import {validateMediaBytes,type Kind,VOICE_MAX_BYTES,IMAGE_MAX_BYTES} from "@/lib/admin-media-validation";

type Session={key:string;kind:Kind;name:string;size:number;mime:string;userId:number;exp:number};
const esc=(x:string)=>encodeURIComponent(x).replace(/[!'()*]/g,c=>"%"+c.charCodeAt(0).toString(16).toUpperCase());

const sha=(bytes:string)=>createHash("sha256").update(bytes).digest("hex");
function storageEndpoint(){
 if(!storageReady())throw Error("S3 storage missing");
 const url=new URL(process.env.S3_ENDPOINT!);
 if(url.protocol!=="https:")throw Error("S3 endpoint must be HTTPS");
 return url;
}
export function signedStorageUrl(method:"GET"|"PUT",key:string,expires=300){
 if(!/^products\/(?:voices\/)?[0-9a-f-]{36}\.(?:jpg|png|webp|mp3|wav|ogg|m4a|aac|flac|webm)$/.test(key))
  throw Error("Unsafe media storage key");
 const base=storageEndpoint(),bucket=process.env.S3_BUCKET!;
 const uri=base.pathname.replace(/\/$/,"")+"/"+esc(bucket)+"/"+key.split("/").map(esc).join("/");
 const date=new Date().toISOString().replace(/[:-]|\.\d{3}/g,""),stamp=date.slice(0,8),region=process.env.S3_REGION||"us-east-1";
 const scope=stamp+"/"+region+"/s3/aws4_request";
 const params=new Map([
  ["X-Amz-Algorithm","AWS4-HMAC-SHA256"],
  ["X-Amz-Credential",process.env.S3_ACCESS_KEY_ID!+"/"+scope],
  ["X-Amz-Date",date],["X-Amz-Expires",String(expires)],["X-Amz-SignedHeaders","host"]
 ]);
 const query=[...params].sort((a,b)=>a[0].localeCompare(b[0])).map(([k,v])=>esc(k)+"="+esc(v)).join("&");
 const canonical=[method,uri,query,"host:"+base.host+"\n","host","UNSIGNED-PAYLOAD"].join("\n");
 const toSign=["AWS4-HMAC-SHA256",date,scope,sha(canonical)].join("\n");
 const h=(k:Buffer|string,v:string)=>createHmac("sha256",k).update(v).digest();
 const keyBytes=h(h(h(h("AWS4"+process.env.S3_SECRET_ACCESS_KEY!,stamp),region),"s3"),"aws4_request");
 const signature=createHmac("sha256",keyBytes).update(toSign).digest("hex");
 return base.origin+uri+"?"+query+"&X-Amz-Signature="+signature;
}
const secret=()=>{const v=process.env.JWT_ACCESS_SECRET;if(!v)throw Error("JWT secret required");return v};
export function issueSession(kind:Kind,name:string,size:number,mime:string,userId:number){
 const ext=name.toLowerCase().split(".").pop()==="jpeg"?"jpg":name.toLowerCase().split(".").pop();
 const key="products/"+(kind==="voice"?"voices/":"")+randomUUID()+"."+ext;
 const session:Session={key,kind,name,size,mime,userId,exp:Date.now()+10*60*1000};
 const payload=Buffer.from(JSON.stringify(session)).toString("base64url");
 const signature=createHmac("sha256",secret()).update(payload).digest("base64url");
 return{uploadUrl:signedStorageUrl("PUT",key),session:payload+"."+signature};
}
export function verifySession(token:string,userId:number):Session{
 const [payload,sig,...rest]=token.split(".");
 if(!payload||!sig||rest.length)throw Error("Invalid upload session");
 const expected=createHmac("sha256",secret()).update(payload).digest("base64url");
 if(sig.length!==expected.length||!timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))throw Error("Invalid upload signature");
 const obj=JSON.parse(Buffer.from(payload,"base64url").toString("utf8")) as Session;
 if(obj.userId!==userId||obj.exp<Date.now()||!["voice","image"].includes(obj.kind))throw Error("Upload session expired");
 if(!/^products\/(?:voices\/)?[0-9a-f-]{36}\.[a-z0-9]+$/.test(obj.key))throw Error("Invalid object key");
 return obj;
}
export async function validateStoredObject(info:Session){
 const result=await fetch(signedStorageUrl("GET",info.key,90),{cache:"no-store"});
 if(!result.ok)throw Error("Storage object cannot be fetched");
 const max=info.kind==="voice"?VOICE_MAX_BYTES:IMAGE_MAX_BYTES;
 const reader=result.body?.getReader();if(!reader)throw Error("No media bytes");
 const parts:Uint8Array[]= [];let length=0;
 for(;;){
  const {value,done}=await reader.read();if(done)break;
  length+=value.byteLength;
  if(length>max){await reader.cancel();throw Error("Media exceeds server limit")}
  parts.push(value);
 }
 if(length!==info.size)throw Error("Uploaded size does not match preflight");
 const bytes=new Uint8Array(length);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length}
 const verdict=validateMediaBytes({name:info.name,size:length,type:info.mime},info.kind,bytes);
 if(!verdict.ok)throw Error(verdict.error);
 const url=new URL(process.env.S3_PUBLIC_BASE_URL!.replace(/\/$/,"")+"/"+info.key.split("/").map(esc).join("/"));
 if(url.protocol!=="https:")throw Error("Public media URL must use HTTPS");
 return url.toString();
}
