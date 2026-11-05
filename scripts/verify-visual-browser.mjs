import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { randomInt } from "node:crypto";
import { setTimeout as sleep } from "node:timers/promises";

const browserPath=process.env.CHROME||"google-chrome";
const port=9000+randomInt(1000);
let chromeErrors="";
let chromeExit=null;
const chrome=spawn(browserPath,[
 "--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage",
 "--hide-scrollbars","--remote-allow-origins=*",
 "--remote-debugging-port="+port,
 "--user-data-dir=/tmp/maison-cdp-"+process.pid,
 "about:blank"
],{stdio:["ignore","ignore","pipe"]});
chrome.stderr?.on("data",chunk=>{ chromeErrors=(chromeErrors+chunk.toString()).slice(-4500); });
chrome.on("exit",(code,signal)=>{chromeExit={code,signal};});
chrome.on("error",error=>{chromeErrors+="\\n"+error.message;});
const endpoint="http://127.0.0.1:"+port;
const state={seq:0,pending:new Map(),exceptions:[]};

async function until(check,ms=16000){
 const deadline=Date.now()+ms;
 while(Date.now()<deadline){try{const x=await check();if(x)return x;}catch{}await sleep(220)}
 throw new Error("Chrome or local server did not become ready");
}
async function open(url){
 const response=await fetch(endpoint+"/json/new?"+encodeURIComponent(url),{method:"PUT"});
 if(!response.ok)throw new Error("Cannot open CDP tab: "+response.status);
 const data=await response.json();
 const ws=new WebSocket(data.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{ws.addEventListener("open",resolve,{once:true});ws.addEventListener("error",reject,{once:true})});
 ws.addEventListener("message",event=>{
  let msg;try{msg=JSON.parse(event.data)}catch{return}
  if(msg.id){const p=state.pending.get(msg.id);if(p){state.pending.delete(msg.id);if(msg.error)p.reject(new Error(JSON.stringify(msg.error)));else p.resolve(msg.result)}}
  if(msg.method==="Runtime.exceptionThrown")state.exceptions.push(msg.params?.exceptionDetails?.text||"Unknown page error");
 });
 const send=(method,params={})=>new Promise((resolve,reject)=>{
  const id=++state.seq;state.pending.set(id,{resolve,reject});
  ws.send(JSON.stringify({id,method,params}));
 });
 return{ws,send};
}
async function evaluate(send,expression){
 const result=await send("Runtime.evaluate",{expression,awaitPromise:true,returnByValue:true});
 if(result.exceptionDetails)throw Error(result.exceptionDetails.text||"Page JavaScript exception");
 return result.result?.value;
}
async function pageScreenshot({name,url,width,height,mobile,assertHome}){
 const {ws,send}=await open(url);
 try{
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile,screenWidth:width,screenHeight:height});
  await send("Emulation.setTouchEmulationEnabled",{enabled:mobile});
  await send("Page.navigate",{url});
  await until(async()=>{
    const v=await evaluate(send,"document.readyState");
    return v==="complete";
  },14000);
  await evaluate(send,`(async()=>{await document.fonts.ready;await new Promise(r=>setTimeout(r,1100));let h=document.documentElement.scrollHeight;for(let y=0;y<h;y+=650){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,65));}window.scrollTo(0,0);await new Promise(r=>setTimeout(r,650));return true;})()`);
  const state=await evaluate(send,`(()=>{
   const hero=document.querySelector(".ql-hero");
   const img=document.querySelector(".ql-hero-image");
   const title=hero?.querySelector("h1");
   return{
    url:location.pathname,width:window.innerWidth,scrollWidth:document.documentElement.scrollWidth,
    height:document.documentElement.scrollHeight,
    heroFound:!!hero,
    heroImageLoaded:!!img?.complete&&Number(img?.naturalWidth)>50,
    heroTitleOpacity:title?Number(getComputedStyle(title).opacity):null,
    headerFound:!!document.querySelector("header"),
    imageCount:document.querySelectorAll(".ql-main img").length
   };
  })()`);
  if(!state.headerFound)throw Error(name+" has no header");
  if(state.scrollWidth>state.width+4)throw Error(name+" has horizontal overflow "+JSON.stringify(state));
  if(assertHome){
   if(!state.heroFound||!state.heroImageLoaded)throw Error(name+" cinematic hero did not load: "+JSON.stringify(state));
   if(state.heroTitleOpacity!==null&&state.heroTitleOpacity<.8)throw Error(name+" text not fully visible: "+JSON.stringify(state));
   if(state.imageCount<5)throw Error(name+" missing fragrance images: "+JSON.stringify(state));
  }
  const result=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:true,fromSurface:true});
  await writeFile("artifacts/"+name+".png",Buffer.from(result.data,"base64"));
  process.stdout.write(name+" "+JSON.stringify(state)+"\n");
 }finally{ws.close()}
}

try{
 await mkdir("artifacts",{recursive:true});
 await until(async()=>{const r=await fetch(endpoint+"/json/version");return r.ok},15000);
 await until(async()=>{const r=await fetch("http://127.0.0.1:3100/");return r.ok},15000);
 await pageScreenshot({name:"home-desktop-full",url:"http://127.0.0.1:3100/",width:1440,height:900,mobile:false,assertHome:true});
 await pageScreenshot({name:"home-mobile-full",url:"http://127.0.0.1:3100/",width:390,height:844,mobile:true,assertHome:true});
 await pageScreenshot({name:"products-desktop-full",url:"http://127.0.0.1:3100/products",width:1440,height:900,mobile:false,assertHome:false});
 await pageScreenshot({name:"products-mobile-full",url:"http://127.0.0.1:3100/products",width:390,height:844,mobile:true,assertHome:false});
 await pageScreenshot({name:"cart-mobile-full",url:"http://127.0.0.1:3100/cart",width:390,height:844,mobile:true,assertHome:false});
 await pageScreenshot({name:"login-mobile-full",url:"http://127.0.0.1:3100/login",width:390,height:844,mobile:true,assertHome:false});
 await pageScreenshot({name:"checkout-mobile-full",url:"http://127.0.0.1:3100/checkout",width:390,height:844,mobile:true,assertHome:false});
 process.stdout.write("Visual QA browser checks passed.\n");
}finally{
 chrome.kill("SIGTERM");
 await sleep(250);
 if(!chrome.killed)chrome.kill("SIGKILL");
}
