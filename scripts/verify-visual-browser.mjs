import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { setTimeout as sleep } from "node:timers/promises";

const browserPath = process.env.CHROME || "google-chrome";
let chrome = null;
let endpoint = "";
const chromeStartupErrors = [];

async function availablePort() {
  const server = createServer();
  return await new Promise((resolve, reject) => {
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      server.close(error => error ? reject(error) : resolve(port));
    });
  });
}

async function bootChrome() {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const userDataDir = "/tmp/maison-cdp-" + process.pid + "-" + attempt;
    const port = await availablePort();
    const candidate = "http://127.0.0.1:" + port;
    let chromeExit = null;
    let stderr = "";
    chrome = spawn(browserPath, [
      "--headless=new", "--no-sandbox", "--disable-gpu",
      "--disable-dev-shm-usage", "--disable-extensions", "--no-first-run",
      "--disable-background-networking", "--disable-breakpad",
      "--remote-allow-origins=*",
      "--remote-debugging-port=" + port,
      "--user-data-dir=" + userDataDir, "about:blank",
    ], { stdio: ["ignore", "ignore", "pipe"] });

    chrome.stderr?.on("data", chunk => {
      stderr = (stderr + String(chunk)).slice(-5000);
    });
    chrome.on("exit", (code, signal) => { chromeExit = { code, signal }; });
    chrome.on("error", error => { stderr += "\n" + error.message; });

    try {
      await until(async () => {
        if (chromeExit) return false;
        const response = await fetch(candidate + "/json/version");
        if (response.ok) {
          endpoint = candidate;
          return true;
        }
        return false;
      }, 23000);
      process.stdout.write("Chrome DevTools ready on attempt " + attempt + ".\n");
      return;
    } catch {
      chromeStartupErrors.push({ attempt, chromeExit, stderr, port });
      chrome?.kill("SIGTERM");
      await sleep(700);
    }
  }
  throw new Error("Chrome CDP startup failed: " + JSON.stringify(chromeStartupErrors));
}

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
 const {ws,send}=await open("about:blank");
 try{
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile,screenWidth:width,screenHeight:height});
  await send("Emulation.setTouchEmulationEnabled",{enabled:mobile});
  await send("Page.navigate",{url});
  await until(async()=>{
    const v=await evaluate(send,'location.pathname === ' + JSON.stringify(new URL(url).pathname) + ' && document.readyState === "complete" && !!document.querySelector("main")');
    return v===true;
  },38000);
  if(assertHome) {
    await until(async()=> await evaluate(send, '!document.querySelector(".maison-intro")'), 8000);
    await sleep(900);
  }
  await evaluate(send,`(async()=>{await document.fonts.ready;await new Promise(r=>setTimeout(r,850));let h=document.documentElement.scrollHeight;for(let y=0;y<h;y+=650){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,150));}await new Promise(r=>setTimeout(r,2000));window.scrollTo(0,0);await new Promise(r=>setTimeout(r,900));return true;})()`);
  const state=await evaluate(send,`(()=>{
   const hero=document.querySelector(".fertini-hero");
   const img=document.querySelector(".fertini-hero__image.is-active img");
   const title=hero?.querySelector("h1");
   return{
    url:location.pathname,width:window.innerWidth,scrollWidth:document.documentElement.scrollWidth,
    height:document.documentElement.scrollHeight,
    heroFound:!!hero,
    heroImageLoaded:!!img?.complete&&Number(img?.naturalWidth)>50,
    heroTitleOpacity:title?Number(getComputedStyle(title).opacity):null,
    headerFound:!!document.querySelector("header"),
    imageCount:document.querySelectorAll(".fertini-v5 img").length,
    heroHasCopy:!!hero?.querySelector(".fertini-hero__text"),
    heroImagePosition:img?getComputedStyle(img).objectPosition:null,
    persianFont:getComputedStyle(document.body).fontFamily,
    clipPathAnimations:[...document.querySelectorAll(".fertini-v5 [data-fertini-photo]")].some(el=>getComputedStyle(el).clipPath!=="none"),
    documentScrollUnlocked: getComputedStyle(document.body).overflow!=="hidden" && getComputedStyle(document.documentElement).overflow!=="hidden",
    firstCardFinished:document.querySelector(".fertini-v5-best__grid [data-fertini-card]")?.getAttribute("data-fertini-motion-done")==="true",
    firstCardCoverGone:!document.querySelector(".fertini-v5-best__grid [data-fertini-card] .fertini-v7-curtain:not([style*='display: none'])"),
    waveformCount:document.querySelector(".fertini-header-sound--mobile .fertini-sound-equalizer")?.childElementCount ?? 0,
    heroProgressFound:!!document.querySelector(".fertini-hero__progress > span")
   };
  })()`);
  if(state.url!==new URL(url).pathname)throw Error(name+" unexpected route: "+JSON.stringify(state));
  if(!state.headerFound)throw Error(name+" has no header");
  if(state.scrollWidth>state.width+4)throw Error(name+" has horizontal overflow "+JSON.stringify(state));
  if(assertHome){
   if(!state.heroFound||!state.heroImageLoaded)throw Error(name+" cinematic hero did not load: "+JSON.stringify(state));
   if(state.heroTitleOpacity!==null&&state.heroTitleOpacity<.8)throw Error(name+" text not fully visible: "+JSON.stringify(state));
   if(state.imageCount<7)throw Error(name+" missing fragrance images: "+JSON.stringify(state));
   if(state.heroHasCopy)throw Error(name+" should have a pure full-image hero");
   if(state.width<600&&!state.heroImagePosition?.startsWith("12%"))throw Error(name+" bottle is cropped off on portrait hero: "+JSON.stringify(state));
   if(!state.persianFont.includes("Vazirmatn"))throw Error(name+" Persian font not applied");
   if(state.clipPathAnimations)throw Error(name+" deprecated clipped reveal is still active");
   if(!state.documentScrollUnlocked)throw Error(name+" document remains scroll locked after intro: "+JSON.stringify(state));
   if(!state.firstCardFinished||!state.firstCardCoverGone)throw Error(name+" photo reveal restarted or failed to finish: "+JSON.stringify(state));
   if(state.waveformCount!==5)throw Error(name+" music indicator must have five bars: "+JSON.stringify(state));
   if(!state.heroProgressFound)throw Error(name+" hero progress line missing: "+JSON.stringify(state));
  }
  const result=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:true,fromSurface:true});
  await writeFile("artifacts/"+name+".png",Buffer.from(result.data,"base64"));
   if(assertHome) {
     const menuState=await evaluate(send,`(async()=>{
       document.querySelector(".maison-menu-trigger")?.click();
       await new Promise(r=>setTimeout(r,160));
       const opened=!!document.querySelector("#maison-menu[role=dialog] .maison-menu-entry");
       document.querySelector("#maison-menu button[aria-label='بستن منو']")?.click();
       await new Promise(r=>setTimeout(r,65));
       const closing=!!document.querySelector("#maison-menu.is-closing");
       document.querySelector(".maison-header button[aria-label='جستجوی عطرها']")?.click();
       await new Promise(r=>setTimeout(r,120));
       const search=!!document.querySelector(".maison-search input[type=search]");
       document.querySelector(".maison-search button[aria-label='بستن جستجو']")?.click();
       return {opened,closing,search};
     })()`);
     if(!menuState.opened || !menuState.closing || !menuState.search)throw Error(name+" navigation interactions failed "+JSON.stringify(menuState));
     const unlocked=await evaluate(send,'getComputedStyle(document.body).overflow!=="hidden" && getComputedStyle(document.documentElement).overflow!=="hidden"');
     if(!unlocked)throw Error(name+" document scroll lock was not released after menus");
   }
  process.stdout.write(name+" "+JSON.stringify(state)+"\n");
 }finally{ws.close()}
}


async function validateStorefrontInteractions(){
 const {ws,send}=await open("about:blank");
 const navigate=async(path)=>{
   await send("Page.navigate",{url:"http://127.0.0.1:3100"+path});
   await until(()=>evaluate(send,'location.pathname==='+JSON.stringify(path)+' && document.readyState==="complete" && !!document.querySelector("main")'),38000);
   await sleep(1150);
 };
 try{
   await send("Page.enable");
   await send("Runtime.enable");
   await send("Emulation.setDeviceMetricsOverride",{width:390,height:844,deviceScaleFactor:1,mobile:true,screenWidth:390,screenHeight:844});
   await navigate("/fragrance/nocturne");
   const add=await evaluate(send,'(()=>{const b=document.querySelector(".fertini-fragrance__buy"); if(!b)return null;b.click();return JSON.parse(localStorage.getItem("fertini:guest-cart:v1")||"[]");})()');
   if(!add || add.length!==1 || add[0].productId!=="nocturne" || add[0].quantity!==1)throw Error("Add-to-cart interaction failed: "+JSON.stringify(add));
   await navigate("/cart");
   const updated=await evaluate(send,'(()=>{const plus=document.querySelector(".fertini-guest-cart__quantity button[aria-label=\\u0022افزایش تعداد\\u0022]");if(!plus)return null;plus.click();return JSON.parse(localStorage.getItem("fertini:guest-cart:v1")||"[]");})()');
   if(!updated || updated[0]?.quantity!==2)throw Error("Cart quantity change failed: "+JSON.stringify(updated));
   await send("Page.reload",{ignoreCache:false});
   await until(()=>evaluate(send,'location.pathname==="/cart" && document.readyState==="complete" && !!document.querySelector(".fertini-guest-cart__header")'),14000);
   const retained=await evaluate(send,'JSON.parse(localStorage.getItem("fertini:guest-cart:v1")||"[]")[0]?.quantity');
   if(retained!==2)throw Error("Cart not persisted after refresh: "+retained);
   const emptied=await evaluate(send,'(()=>{document.querySelector(".fertini-guest-cart__clear")?.click();return JSON.parse(localStorage.getItem("fertini:guest-cart:v1")||"[]").length;})()');
   if(emptied!==0)throw Error("Cart clear failed: "+emptied);
   await navigate("/fragrance/nocturne");
   const multi=await evaluate(send,`(async()=>{
      const buttons=[...document.querySelectorAll(".fertini-fragrance__quantity button[aria-label^='افزایش تعداد']")];
      if(buttons.length!==3)return null;
      buttons[0].click(); buttons[2].click();
      await new Promise(resolve=>setTimeout(resolve,180));
      document.querySelector(".fertini-fragrance__buy")?.click();
      return JSON.parse(localStorage.getItem("fertini:guest-cart:v1")||"[]");
    })()`);
   if(!multi||multi.length!==3||multi.some(x=>x.quantity!==1)||!new Set(multi.map(x=>x.volume)).has(100))throw Error("Multi-volume atomic add failed: "+JSON.stringify(multi));
   await navigate("/cart");
   const persistedMulti=await evaluate(send,'JSON.parse(localStorage.getItem("fertini:guest-cart:v1")||"[]").length');
   if(persistedMulti!==3)throw Error("Multi-volume cart not persisted: "+persistedMulti);
   await evaluate(send,'document.querySelector(".fertini-guest-cart__clear")?.click()');
   await navigate("/account");
   const tabs=await evaluate(send,'(()=>{const b=[...document.querySelectorAll("button")].find(x=>x.textContent?.trim()==="ایجاد حساب"); const login=[...document.querySelectorAll("button")].find(x=>x.textContent?.trim()==="ورود");b?.click();return{register:!!b,login:!!login};})()');
   if(!tabs?.register || !tabs?.login)throw Error("Account gateway tabs unavailable: "+JSON.stringify(tabs));
   await until(()=>evaluate(send,'!!document.querySelector("input[name=confirm_password]")'),5500);
   const inputGap=()=>evaluate(send,`(()=>{
     const labels=[...document.querySelectorAll(".fertini-account-gateway__field")];
     return Math.max(...labels.map(label=>{
       const span=label.querySelector("span"),input=label.querySelector("input");
       return span&&input?input.getBoundingClientRect().bottom-span.getBoundingClientRect().bottom:0;
     }));
   })()`);
   const mobileGap=await inputGap();
   if(mobileGap>35)throw Error("Register labels far from input on mobile: "+mobileGap);
   await send("Emulation.setDeviceMetricsOverride",{width:1440,height:900,deviceScaleFactor:1,mobile:false,screenWidth:1440,screenHeight:900});
   await navigate("/account");
   await evaluate(send,'[...document.querySelectorAll("button")].find(x=>x.textContent?.trim()==="ایجاد حساب")?.click()');
   await until(()=>evaluate(send,'!!document.querySelector("input[name=confirm_password]")'),5500);
   const desktopGap=await inputGap();
   if(desktopGap>35)throw Error("Register labels far from input on desktop: "+desktopGap);
   process.stdout.write("Guest cart, variant constraints, account field alignment (mobile/desktop) and navigation validated.\\n");
 }finally{ws.close()}
}

try{
 await mkdir("artifacts",{recursive:true});
 await bootChrome();
 await until(async()=>{const r=await fetch("http://127.0.0.1:3100/");return r.ok},15000);
 await pageScreenshot({name:"home-desktop-full",url:"http://127.0.0.1:3100/",width:1440,height:900,mobile:false,assertHome:true});
 await pageScreenshot({name:"home-mobile-full",url:"http://127.0.0.1:3100/",width:390,height:844,mobile:true,assertHome:true});
 await pageScreenshot({name:"products-desktop-full",url:"http://127.0.0.1:3100/products",width:1440,height:900,mobile:false,assertHome:false});
 await pageScreenshot({name:"products-mobile-full",url:"http://127.0.0.1:3100/products",width:390,height:844,mobile:true,assertHome:false});
 await pageScreenshot({name:"account-mobile-full",url:"http://127.0.0.1:3100/account",width:390,height:844,mobile:true,assertHome:false});
 await pageScreenshot({name:"account-desktop-full",url:"http://127.0.0.1:3100/account",width:1440,height:900,mobile:false,assertHome:false});
 await pageScreenshot({name:"fragrance-mobile-full",url:"http://127.0.0.1:3100/fragrance/nocturne",width:390,height:844,mobile:true,assertHome:false});
 await pageScreenshot({name:"fragrance-desktop-full",url:"http://127.0.0.1:3100/fragrance/nocturne",width:1440,height:900,mobile:false,assertHome:false});
 await pageScreenshot({name:"cart-mobile-full",url:"http://127.0.0.1:3100/cart",width:390,height:844,mobile:true,assertHome:false});
 await pageScreenshot({name:"login-mobile-full",url:"http://127.0.0.1:3100/login",width:390,height:844,mobile:true,assertHome:false});
 await pageScreenshot({name:"checkout-mobile-full",url:"http://127.0.0.1:3100/checkout",width:390,height:844,mobile:true,assertHome:false});
 await pageScreenshot({name:"journal-desktop-full",url:"http://127.0.0.1:3100/journal",width:1440,height:900,mobile:false,assertHome:false});
 await pageScreenshot({name:"journal-mobile-full",url:"http://127.0.0.1:3100/journal",width:390,height:844,mobile:true,assertHome:false});
 await pageScreenshot({name:"journal-article-mobile-full",url:"http://127.0.0.1:3100/journal/how-to-choose-a-fragrance",width:390,height:844,mobile:true,assertHome:false});
 await pageScreenshot({name:"about-mobile-full",url:"http://127.0.0.1:3100/about",width:390,height:844,mobile:true,assertHome:false});
 await pageScreenshot({name:"contact-mobile-full",url:"http://127.0.0.1:3100/contact",width:390,height:844,mobile:true,assertHome:false});
 await pageScreenshot({name:"shipping-mobile-full",url:"http://127.0.0.1:3100/shipping",width:390,height:844,mobile:true,assertHome:false});
 await pageScreenshot({name:"privacy-mobile-full",url:"http://127.0.0.1:3100/privacy",width:390,height:844,mobile:true,assertHome:false});
 await pageScreenshot({name:"terms-mobile-full",url:"http://127.0.0.1:3100/terms",width:390,height:844,mobile:true,assertHome:false});
 await pageScreenshot({name:"payment-result-mobile-full",url:"http://127.0.0.1:3100/payment/result?status=failed",width:390,height:844,mobile:true,assertHome:false});
 await validateStorefrontInteractions();
 process.stdout.write("Visual QA browser checks passed.\n");
}finally{
 chrome?.kill("SIGTERM");
 await sleep(250);
 if(chrome && !chrome.killed)chrome.kill("SIGKILL");
}
