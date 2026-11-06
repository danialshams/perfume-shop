export const IMAGE_MAX_BYTES=5*1024*1024,VOICE_MAX_BYTES=20*1024*1024;
export type Kind="image"|"voice";
type Meta={name:string;size:number;type?:string};
export type Verdict={ok:true;ext:string;mime:string}|{ok:false;error:string};
const mime:Record<string,string>={jpg:"image/jpeg",jpeg:"image/jpeg",png:"image/png",webp:"image/webp",
 mp3:"audio/mpeg",wav:"audio/wav",ogg:"audio/ogg",m4a:"audio/mp4",aac:"audio/aac",flac:"audio/flac",webm:"audio/webm"};
const allowed:Record<string,string[]>={jpg:["image/jpeg"],jpeg:["image/jpeg"],png:["image/png"],webp:["image/webp"],
 mp3:["audio/mpeg","audio/mp3"],wav:["audio/wav","audio/x-wav","audio/wave"],ogg:["audio/ogg","application/ogg"],
 m4a:["audio/mp4","audio/x-m4a"],aac:["audio/aac","audio/aacp"],flac:["audio/flac","audio/x-flac"],webm:["audio/webm","video/webm"]};
const matches=(b:Uint8Array,at:number,part:string)=>[...part].every((v,i)=>b[at+i]===v.charCodeAt(0));
export function validateMediaMeta(file:Meta,kind:Kind):Verdict{
 const ext=file.name.toLowerCase().split(".").pop()||"";
 if(!Number.isFinite(file.size)||file.size<1)return{ok:false,error:"فایل خالی یا نامعتبر است."};
 if(file.size>(kind==="image"?IMAGE_MAX_BYTES:VOICE_MAX_BYTES))
  return{ok:false,error:kind==="image"?"حداکثر حجم تصویر ۵ مگابایت است.":"حداکثر حجم وویس ۲۰ مگابایت است."};
 if(!mime[ext]||(kind==="image"?!["jpg","jpeg","png","webp"].includes(ext):!["mp3","wav","ogg","m4a","aac","flac","webm"].includes(ext)))
  return{ok:false,error:"فرمت فایل مجاز نیست."};
 const declared=file.type?.toLowerCase()||"";
 if(declared&&declared!=="application/octet-stream"&&!allowed[ext].includes(declared))
  return{ok:false,error:"نوع فایل با پسوند آن مطابقت ندارد."};
 return{ok:true,ext:ext==="jpeg"?"jpg":ext,mime:mime[ext]};
}
export function validateMediaBytes(file:Meta,kind:Kind,b:Uint8Array):Verdict{
 const meta=validateMediaMeta(file,kind);if(!meta.ok)return meta;
 if(b.length<12)return{ok:false,error:"فایل ناقص است."};
 const e=file.name.toLowerCase().split(".").pop();
 const ok=e==="jpg"||e==="jpeg"?b[0]===255&&b[1]===216&&b[2]===255:
 e==="png"?b[0]===137&&matches(b,1,"PNG")&&b[4]===13:
 e==="webp"?matches(b,0,"RIFF")&&matches(b,8,"WEBP"):
 e==="mp3"?matches(b,0,"ID3")||(b[0]===255&&(b[1]&0xe0)===0xe0):
 e==="wav"?matches(b,0,"RIFF")&&matches(b,8,"WAVE"):
 e==="ogg"?matches(b,0,"OggS"):
 e==="m4a"?matches(b,4,"ftyp"):
 e==="aac"?b[0]===255&&(b[1]&0xf6)===0xf0:
 e==="flac"?matches(b,0,"fLaC"):
 e==="webm"?b[0]===26&&b[1]===69&&b[2]===223&&b[3]===163:false;
 return ok?meta:{ok:false,error:"امضای واقعی فایل با فرمت اعلام‌شده مطابقت ندارد."};
}
