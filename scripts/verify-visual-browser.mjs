import { spawn } from "node:child_process";
import jwt from "jsonwebtoken";
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
// Isolate unrelated visual tests from the post-intro permission overlay.
let bypassMusicInvitationForTests=true;
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
 if(bypassMusicInvitationForTests){
   await send("Page.addScriptToEvaluateOnNewDocument",{
    source:'try{sessionStorage.setItem("fertini:ambient-invitation:answered:v1","1")}catch{}'
   });
 }
 const close=async()=>{
  try{ws.close()}catch{}
  try{await fetch(endpoint+"/json/close/"+encodeURIComponent(data.id))}catch{}
 };
 return{ws,send,close};
}
async function evaluate(send,expression){
 const result=await send("Runtime.evaluate",{expression,awaitPromise:true,returnByValue:true});
 if(result.exceptionDetails)throw Error(result.exceptionDetails.text||"Page JavaScript exception");
 return result.result?.value;
}
async function pageScreenshot({name,url,width,height,mobile,assertHome}){
 const {ws,send,close}=await open("about:blank");
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
   const card=document.querySelector(".fertini-v5-best__grid .fertini-v5-card");
   const name=card?.querySelector(".fertini-v5-card__identity h3");
   const price=card?.querySelector(".fertini-v5-card__price");
   const subtitle=card?.querySelector(".fertini-v5-card__subtitle");
   return{
    url:location.pathname,width:window.innerWidth,scrollWidth:document.documentElement.scrollWidth,
    height:document.documentElement.scrollHeight,
    heroFound:!!hero,
    heroImageLoaded:!!img?.complete&&Number(img?.naturalWidth)>50,
    heroMediaUnavailable:!!document.querySelector(".fertini-hero__image.is-active .fertini-v5-photo-unavailable"),
    heroTitleOpacity:title?Number(getComputedStyle(title).opacity):null,
    cardNameLeftOfPrice:!!name&&!!price&&name.getBoundingClientRect().right<=price.getBoundingClientRect().left+3,
    cardSubtitleBelowName:!!name&&!!subtitle&&subtitle.getBoundingClientRect().top>=name.getBoundingClientRect().bottom-4,
    cardMaskedLines:card?.querySelectorAll("[data-fertini-caption-line]").length||0,
    headerFound:!!document.querySelector("header"),
    imageCount:document.querySelectorAll(".fertini-v5 img").length,
    explicitUnavailableCount:document.querySelectorAll(".fertini-v5 .fertini-v5-photo-unavailable").length,
    familyFailedFallbacks:document.querySelectorAll(".fertini-v5-family__photo img[src*='family-woody.avif']").length,
    failedImageCount:[...document.querySelectorAll(".fertini-v5 img")].filter(img=>img.complete&&img.naturalWidth===0).length,
    optimizedImageCount:[...document.querySelectorAll(".fertini-v5 img")].filter(img=>(img.currentSrc||img.src).includes("/_next/image?")).length,
    familyCaptionCount:[...document.querySelectorAll(".fertini-v5-family__photo .fertini-v5-family__info h3")].filter(x=>x.textContent?.trim().length>1).length,
    heroHasCopy:!!hero?.querySelector(".fertini-hero__text"),
    heroImagePosition:img?getComputedStyle(img).objectPosition:null,
    heroPhotoUrl:img?(img.currentSrc||img.src):"",
    persianFont:getComputedStyle(document.body).fontFamily,
    unfinishedPhotoClip:[...document.querySelectorAll(".fertini-v5 [data-fertini-photo][data-photo-reveal-state='complete']")].some(el=>getComputedStyle(el).clipPath!=="none"),
    documentScrollUnlocked: getComputedStyle(document.body).overflow!=="hidden" && getComputedStyle(document.documentElement).overflow!=="hidden",
    firstCardFinished:document.querySelector(".fertini-v5-best__grid [data-fertini-card]")?.getAttribute("data-fertini-motion-done")==="true",
    firstCardCoverGone:!document.querySelector(".fertini-v5-best__grid [data-fertini-card] .fertini-v7-curtain:not([style*='display: none'])"),
    waveformCount:document.querySelector(".fertini-header-sound--mobile .fertini-sound-meter")?.querySelectorAll("rect").length ?? 0,
    heroProgressFound:!!document.querySelector(".fertini-hero__progress > span")
   };
  })()`);
  if(state.url!==new URL(url).pathname)throw Error(name+" unexpected route: "+JSON.stringify(state));
  if(!state.headerFound)throw Error(name+" has no header");
  if(state.scrollWidth>state.width+4)throw Error(name+" has horizontal overflow "+JSON.stringify(state));
  if(assertHome){
   // Hosted photos are not present in this isolated CI runner. The production
   // endpoint is independently probed through /api/v1/editorial/status.
   if(!state.heroFound||(!state.heroImageLoaded&&!state.heroMediaUnavailable))
     throw Error(name+" lacks hero media or honest placeholder: "+JSON.stringify(state));
   if(state.heroTitleOpacity!==null&&state.heroTitleOpacity<.8)throw Error(name+" text not fully visible: "+JSON.stringify(state));
   if(state.imageCount+state.explicitUnavailableCount<7)
     throw Error(name+" has neither fragrance images nor placeholders: "+JSON.stringify(state));
   if(state.failedImageCount>0)throw Error(name+" has failed visible media: "+JSON.stringify(state));
   if(state.optimizedImageCount>0)throw Error(name+" is still dependent on cPanel /_next/image: "+JSON.stringify(state));
   if(state.familyCaptionCount<3)throw Error(name+" scent families must have captions inside photos: "+JSON.stringify(state));
   if(!state.cardNameLeftOfPrice||!state.cardSubtitleBelowName||state.cardMaskedLines<3)
     throw Error(name+" perfume name, right-hand price or subordinate scent label misaligned: "+JSON.stringify(state));
   if(state.familyFailedFallbacks>0)throw Error(name+" repeats the low-quality woody fallback: "+JSON.stringify(state));
   if(state.heroHasCopy)throw Error(name+" should have a pure full-image hero");
   if(state.width<600&&state.heroImageLoaded){
     const builtin=state.heroPhotoUrl.includes("/fertini/hero-0");
     const target=builtin?"12%":"50%";
     if(!state.heroImagePosition?.startsWith(target))
       throw Error(name+" portrait hero framing was incorrect: "+JSON.stringify(state));
   }
   if(!state.persianFont.includes("Vazirmatn"))throw Error(name+" Persian font not applied");
   if(state.unfinishedPhotoClip)throw Error(name+" completed photo was clipped again: "+JSON.stringify(state));
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
     // Exercise the live React chat on both desktop and mobile, including exit motion.
     const chat=await evaluate(send,`(async()=>{
       await new Promise(r=>setTimeout(r,460));
       window.scrollTo(0,300);
       await new Promise(r=>setTimeout(r,220));
       const y=window.scrollY,launcher=document.querySelector(".support-launcher");
       if(!launcher)return{error:"missing launcher"};
       launcher.click();
       await new Promise(r=>setTimeout(r,190));
       const panel=document.querySelector(".support-window");
       const shown=panel?.classList.contains("is-open")&&launcher.getAttribute("aria-expanded")==="true";
       const locked=document.body.style.position==="fixed"&&document.documentElement.style.overflow==="hidden";
       document.querySelector(".support-backdrop")?.click();
       await new Promise(r=>setTimeout(r,90));
       const exiting=!!panel&&!panel.classList.contains("is-open")&&getComputedStyle(panel).transitionDuration!=="0s";
       await new Promise(r=>setTimeout(r,470));
       const closed=getComputedStyle(panel).visibility==="hidden";
       const restored=document.body.style.position!=="fixed"&&document.documentElement.style.overflow!=="hidden";
       const keptPosition=Math.abs(window.scrollY-y)<5;
       return {shown,locked,exiting,closed,restored,keptPosition};
     })()`);
     if(Object.values(chat).some(v=>v!==true))throw Error(name+" chat overlay interactions failed "+JSON.stringify(chat));
   }
  process.stdout.write(name+" "+JSON.stringify(state)+"\n");
 }finally{await close()}
}


async function validateCinematicPhotoReveal(){
 const {ws,send,close}=await open("about:blank");
 const photoSelector=".fertini-v5-best__grid [data-fertini-photo]";
 try{
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride",{width:390,height:844,deviceScaleFactor:1,mobile:true,screenWidth:390,screenHeight:844});
  await send("Page.navigate",{url:"http://127.0.0.1:3100/"});
  await until(()=>evaluate(send,'document.readyState==="complete" && !!document.querySelector('+JSON.stringify(photoSelector)+')'),38000);
  await until(()=>evaluate(send,'!document.querySelector(".maison-intro")'),10000);
  await evaluate(send,'(()=>{const f=document.querySelector('+JSON.stringify(photoSelector)+');window.scrollTo({top:Math.max(0,scrollY+f.getBoundingClientRect().top-innerHeight*.42),behavior:"instant"});return true})()');
  await until(()=>evaluate(send,'document.querySelector('+JSON.stringify(photoSelector)+')?.dataset.photoRevealState==="playing"'),9500);
  const first=await evaluate(send,'Number(document.querySelector('+JSON.stringify(photoSelector)+')?.dataset.photoRevealProgress)');
  await sleep(330);
  const second=await evaluate(send,'Number(document.querySelector('+JSON.stringify(photoSelector)+')?.dataset.photoRevealProgress)');
  if(!(second>first && second<1.001))throw Error("Cinematic clip did not advance smoothly "+JSON.stringify({first,second}));
  // Photo begins its masked wipe before product names/prices are allowed to
  // rise out of their own clipping wrappers.
  const copyBefore=await evaluate(send,`(()=>{
    const card=document.querySelector(".fertini-v5-best__grid [data-fertini-card]");
    const name=card?.querySelector(".fertini-v5-card__identity h3");
    const price=card?.querySelector(".fertini-v5-card__price");
    return {nameOpacity:name?Number(getComputedStyle(name).opacity):null,
      priceOpacity:price?Number(getComputedStyle(price).opacity):null};
  })()`);
  if(copyBefore.nameOpacity===null||copyBefore.priceOpacity===null||
     copyBefore.nameOpacity>.10||copyBefore.priceOpacity>.10)
    throw Error("Perfume copy revealed before photo mask finished: "+JSON.stringify(copyBefore));

  await until(()=>evaluate(send,'document.querySelector('+JSON.stringify(photoSelector)+')?.dataset.photoRevealState==="complete"'),7600);
  const finished=await evaluate(send,`(()=>{
    const f=document.querySelector(".fertini-v5-best__grid [data-fertini-photo]");
    const img=f?.querySelector("img");
    return {complete:f?.dataset.photoRevealState==="complete",clip:getComputedStyle(f).clipPath,
      scale:img?new DOMMatrixReadOnly(getComputedStyle(img).transform).a:null};
  })()`);
  if(!finished.complete||finished.clip!=="none"||Math.abs(finished.scale-1)>.009)throw Error("Photo did not settle to its final still frame "+JSON.stringify(finished));
  const copyAfter=await evaluate(send,`(()=>{
    const card=document.querySelector(".fertini-v5-best__grid [data-fertini-card]");
    const name=card?.querySelector(".fertini-v5-card__identity h3");
    const price=card?.querySelector(".fertini-v5-card__price");
    return {nameOpacity:name?Number(getComputedStyle(name).opacity):null,
      priceOpacity:price?Number(getComputedStyle(price).opacity):null};
  })()`);
  if(copyAfter.nameOpacity===null||copyAfter.priceOpacity===null||
     copyAfter.nameOpacity<.95||copyAfter.priceOpacity<.95)
    throw Error("Perfume masked caption did not finish after photo: "+JSON.stringify(copyAfter));

  await evaluate(send,'window.scrollTo({top:0,behavior:"instant"})');
  await sleep(500);
  const returned=await evaluate(send,'(()=>{const f=document.querySelector(".fertini-v5-best__grid [data-fertini-photo]");return {state:f?.dataset.photoRevealState,clip:getComputedStyle(f).clipPath};})()');
  if(returned.state!=="complete"||returned.clip!=="none")throw Error("Photo restarted after scrolling back "+JSON.stringify(returned));
  const collections=await evaluate(send,`(()=>{
    const latest=[...document.querySelectorAll(".fertini-v5-new__scroll [data-fertini-photo]")];
    const best=[...document.querySelectorAll(".fertini-v5-best__grid [data-fertini-photo]")];
    return{latestCount:latest.length,bestCount:best.length,
      latestModes:latest.map(x=>x.dataset.cinematicMode),bestModes:best.map(x=>x.dataset.cinematicMode),
      gridDisplay:getComputedStyle(document.querySelector(".fertini-v5-new__scroll")).display};
  })()`);
  if(collections.latestCount!==6||collections.bestCount!==6||collections.gridDisplay!=="grid"||
     !collections.latestModes.includes("stretch")||!collections.bestModes.includes("up"))
    throw Error("Latest collection not fully mounted or motion modes not different "+JSON.stringify(collections));
  await evaluate(send,'document.querySelector(".fertini-v5-new")?.scrollIntoView({block:"start",behavior:"instant"})');
  await until(()=>evaluate(send,`(()=>{
    const nodes=[...document.querySelectorAll(".fertini-v5-new__scroll [data-fertini-photo]")].slice(0,2);
    return nodes.length===2&&nodes.every(x=>x.dataset.photoRevealState==="complete");
  })()`),10000);
  const latestImages=await evaluate(send,`(()=>{
    const images=[...document.querySelectorAll(".fertini-v5-new__scroll img")];
    return {count:images.length,loaded:images.filter(x=>x.complete&&x.naturalWidth>0).length};
  })()`);
  if(latestImages.count!==6||latestImages.loaded!==6)throw Error("Six latest images must all load "+JSON.stringify(latestImages));
  const bars=await evaluate(send,`(()=>{
    const root=document.querySelector(".fertini-header-sound--mobile .fertini-sound-meter");
    const items=[...(root?.querySelectorAll("rect")||[])];
    const center=items[2]?Number(items[2].getAttribute("x"))+Number(items[2].getAttribute("width"))/2:999;
    return {widths:items.map(i=>Number(i.getAttribute("width"))),
      center:Math.abs(center-15)};
  })()`);
  if(bars.widths.length!==5||bars.widths.some(w=>Math.abs(w-2)>.001)||bars.center>.001)
   throw Error("Header waveform bars are not uniform and centered "+JSON.stringify(bars));
  const progress=await evaluate(send,`(()=>{
    document.querySelector(".fertini-hero__controls button[aria-label^='نمایش اسلاید']")?.click();
    return Number(document.querySelector(".fertini-hero__progress > span")?.style.transform.match(/scaleX\\(([\\d.]+)\\)/)?.[1]||0);
  })()`);
  await sleep(400);
  const advanced=await evaluate(send,'Number(document.querySelector(".fertini-hero__progress > span")?.style.transform.match(/scaleX\\(([\\d.]+)\\)/)?.[1]||0)');
  if(!(advanced>progress && advanced<1))throw Error("Hero progress not synchronized with active slideshow "+JSON.stringify({progress,advanced}));
  process.stdout.write("Essential 2 reveal progression, settled image, return-scroll, five-bar center and hero timer verified.\\n");
 }finally{await close()}
}

async function validateStorefrontInteractions(){
 const {ws,send,close}=await open("about:blank");
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
     return labels.reduce((max,label)=>{
       const span=label.querySelector("span"),input=label.querySelector("input");
       if(!span||!input)return max;
       const a=span.getBoundingClientRect(),b=input.getBoundingClientRect();
       return Math.max(max,Math.abs(b.top-a.bottom),Math.abs(b.right-a.right));
     },0);
   })()`);
   const mobileGap=await inputGap();
   if(mobileGap>10)throw Error("Register labels misaligned with input top-right on mobile: "+mobileGap);
   await send("Emulation.setDeviceMetricsOverride",{width:1440,height:900,deviceScaleFactor:1,mobile:false,screenWidth:1440,screenHeight:900});
   await navigate("/account");
   await evaluate(send,'[...document.querySelectorAll("button")].find(x=>x.textContent?.trim()==="ایجاد حساب")?.click()');
   await until(()=>evaluate(send,'!!document.querySelector("input[name=confirm_password]")'),5500);
   const desktopGap=await inputGap();
   if(desktopGap>10)throw Error("Register labels misaligned with input top-right on desktop: "+desktopGap);
   // Force the real API offline; demo perfumes must still be searchable and correctly linked.
   await evaluate(send,`(()=>{
     const original=window.fetch;
     window.fetch=(input,init)=>String(input).includes("/api/v1/products/search")?
       Promise.resolve(new Response(JSON.stringify({message:"Unavailable"}),{status:503,headers:{"content-type":"application/json"}})):
       original(input,init);
     document.querySelector(".maison-header button[aria-label='جستجوی عطرها']")?.click();
     return true;
   })()`);
   await until(()=>evaluate(send,'!!document.querySelector(".maison-search input[type=search]")'),4000);
   await evaluate(send,'document.querySelector(".maison-search input[type=search]")?.focus()');
   await send("Input.insertText",{text:"Nocturne"});
   await sleep(2200);
   const searchDiagnostic=await evaluate(send,`(()=>{
      const input=document.querySelector(".maison-search input[type=search]");
      const list=document.querySelector(".maison-search__results");
      return {inputValue:input?.value,html:list?.innerHTML.slice(0,2200),overlay:!!input,
        demoAnchors:[...(list?.querySelectorAll("a")||[])].map(a=>a.getAttribute("href"))};
   })()`);
   process.stdout.write("SEARCH DEBUG "+JSON.stringify(searchDiagnostic)+"\\n");
   await until(()=>evaluate(send,'!!document.querySelector(".maison-search__result[href$=nocturne]")'),4500)
     .catch(()=>{throw Error("Search result not shown "+JSON.stringify(searchDiagnostic));});
   if(await evaluate(send,'!!document.querySelector(".maison-search__results [role=alert]")'))throw Error("Fallback search displayed error for sample scent");
   process.stdout.write("Guest cart, variant constraints, account field alignment (mobile/desktop) and navigation validated.\\n");
 }finally{await close()}
}

async function validateAdminScreens(){
  const base="http://127.0.0.1:3100";
  const unauthorized=await fetch(base+"/admin/dashboard",{redirect:"manual"});
  if(process.env.FERTINI_ADMIN_PREVIEW==="1"){
    if(!unauthorized.ok)throw Error("Guest preview dashboard must render without redirect: "+unauthorized.status);
    const login=await fetch(base+"/admin/login",{redirect:"manual"});
    if(![302,303,307,308].includes(login.status))throw Error("Preview login should redirect to dashboard: "+login.status);
  }else if(![302,303,307,308].includes(unauthorized.status))throw Error("Unauthorized admin must redirect: "+unauthorized.status);
  if(!process.env.JWT_ACCESS_SECRET)throw Error("CI JWT_ACCESS_SECRET missing");
  const token=jwt.sign({userId:1,role:"ADMIN",email:"ci-test@local.invalid"},process.env.JWT_ACCESS_SECRET,{expiresIn:"20m"});
  const {ws,send,close}=await open("about:blank");
  try{
    await send("Network.enable");
    const result=await send("Network.setCookie",{name:"admin_access_token",value:token,url:base,secure:false,httpOnly:true,sameSite:"Lax"});
    if(!result.success)throw Error("Admin cookie test setup failed");
  }finally{await close()}
  await pageScreenshot({name:"admin-dashboard-mobile",url:base+"/admin/dashboard",width:390,height:844,mobile:true,assertHome:false});
  await pageScreenshot({name:"admin-dashboard-desktop",url:base+"/admin/dashboard",width:1440,height:900,mobile:false,assertHome:false});
  await pageScreenshot({name:"admin-products-mobile",url:base+"/admin/products",width:390,height:844,mobile:true,assertHome:false});
  await pageScreenshot({name:"admin-orders-mobile",url:base+"/admin/orders",width:390,height:844,mobile:true,assertHome:false});
  await pageScreenshot({name:"admin-content-mobile",url:base+"/admin/content",width:390,height:844,mobile:true,assertHome:false});
  await pageScreenshot({name:"admin-seo-mobile",url:base+"/admin/seo",width:390,height:844,mobile:true,assertHome:false});
  await pageScreenshot({name:"admin-seo-desktop",url:base+"/admin/seo",width:1440,height:900,mobile:false,assertHome:false});
  // Product image and voice files are managed inside products; legacy media URL redirects.
  const mediaRedirect=await fetch(base+"/admin/media",{redirect:"manual"});
  // Next.js App Router may return HTTP 200 with a streamed RSC redirect instead of a 3xx.
  const serverRedirect=[301,302,303,307,308].includes(mediaRedirect.status)
    && mediaRedirect.headers.get("location")?.includes("/admin/products");
  const streamedRedirect=mediaRedirect.status===200
    && /NEXT_REDIRECT|\\\"redirect\\\"|\\\"\/admin\/products\\\"/.test(await mediaRedirect.text());
  if(!serverRedirect&&!streamedRedirect)
    throw Error("Legacy admin media redirect to products was not found: "+mediaRedirect.status);
  await pageScreenshot({name:"admin-coupons-mobile",url:base+"/admin/coupons",width:390,height:844,mobile:true,assertHome:false});
  const retiredHealth=await fetch(base+"/admin/database",{redirect:"manual"});
  const healthRedirect=[301,302,303,307,308].includes(retiredHealth.status) &&
    retiredHealth.headers.get("location")?.includes("/admin/dashboard");
  const healthStreamed=retiredHealth.status===200 &&
    /NEXT_REDIRECT/.test(await retiredHealth.text());
  if(!healthRedirect&&!healthStreamed)
    throw Error("Retired database diagnostics must redirect to the dashboard");
  const {send:check,close:closeCheck}=await open("about:blank");
  try{
    await check("Page.enable");
    await check("Emulation.setDeviceMetricsOverride",{width:390,height:844,deviceScaleFactor:1,mobile:true});
    await check("Page.navigate",{url:base+"/admin/dashboard"});
    await until(()=>evaluate(check,'!!document.querySelector(".fst-mobile-bottom")&&document.readyState==="complete"'),24000);
    const state=await evaluate(check,`(async()=>{
      const bottom=document.querySelector(".fst-mobile-bottom");
      const trigger=bottom?.querySelector('button[aria-label="سایر بخش‌های مدیریت"]');
      trigger?.click();await new Promise(r=>setTimeout(r,480));
      const open=document.querySelector(".fst-sidebar")?.classList.contains("is-open");
      const nav=document.querySelector('.fst-sidebar-nav a[href="/admin/content"]');
      const visible=!!nav;
      document.querySelector(".fst-sidebar-close")?.click();
      await new Promise(r=>setTimeout(r,400));
      return {bottom:!!bottom,open,visible,closed:!document.querySelector(".fst-sidebar")?.classList.contains("is-open")};
    })()`);
    if(!state.bottom||!state.open||!state.visible||!state.closed)throw Error("Admin mobile nav interaction failed "+JSON.stringify(state));
  }finally{await closeCheck()}
  process.stdout.write("Authenticated Essential-style admin mobile/desktop visual routes and navigation passed.\n");
}

// Regression: homepage intro is a single animation, remains hidden after reload,
// and cannot leave scroll locked after completion.
async function validateHomepageIntroOnce(){
 bypassMusicInvitationForTests=false;
 const {send,close}=await open("about:blank");
 try{
  await send("Page.enable");
  await send("Runtime.enable");
  // Observe from the very first document script, BEFORE React hydration.
  // The previous regression only checked the end state and missed a
  // first-paint logo flash followed by GSAP restarting it.
  await send("Page.addScriptToEvaluateOnNewDocument",{source:`(()=>{
    let previouslyVisible=false;
    const trace=window.__fertiniIntroTrace={
      starts:0,completions:0,samples:0,mounts:0,timestamps:[],
      lineDoneAt:null,firstShineAt:null,shinePasses:0
    };
    let previouslyMounted=false,wasShining=false;
    const inspect=()=>{
      const el=document.querySelector(".maison-intro__brand");
      const mounted=!!el;
      if(mounted&&!previouslyMounted)trace.mounts++;
      previouslyMounted=mounted;
      let visible=false;
      if(el){
        const style=getComputedStyle(el);
        visible=style.visibility!=="hidden"&&Number(style.opacity)>.12&&el.getClientRects().length>0;
      }
      if(visible&&!previouslyVisible){
        trace.starts++;
        trace.timestamps.push(Math.round(performance.now()));
      }
      previouslyVisible=visible;
      const line=document.querySelector(".maison-intro__rule");
      if(line&&!trace.lineDoneAt){
        const style=getComputedStyle(line);
        if(style.display!=="none"&&Number(style.opacity)>.8&&line.getBoundingClientRect().width>100)
          trace.lineDoneAt=performance.now();
      }
      const shine=document.querySelector(".maison-intro__shine");
      const shining=!!shine&&getComputedStyle(shine).display!=="none"&&Number(getComputedStyle(shine).opacity)>.20;
      if(shining&&!wasShining){
        trace.shinePasses++;
        if(!trace.firstShineAt)trace.firstShineAt=performance.now();
      }
      wasShining=shining;
      trace.samples++;
    };
    const observer=new MutationObserver(inspect);
    observer.observe(document,{subtree:true,childList:true});
    setInterval(inspect,25);
    window.addEventListener("fertini:intro:complete",()=>{trace.completions++;});
  })()`});
  await send("Page.navigate",{url:"http://127.0.0.1:3100/"});
  await until(()=>evaluate(send,'document.readyState==="complete" && !!document.querySelector(".fertini-hero")'),38000);
  await until(()=>evaluate(send,
   'sessionStorage.getItem("fertini:intro:seen:v3")==="1" && !document.querySelector(".maison-intro")'),9000);
  await sleep(900); // detect a late second animation after the first one ends
  const introTrace=await evaluate(send,`window.__fertiniIntroTrace && ({
    starts:window.__fertiniIntroTrace.starts,
    mounts:window.__fertiniIntroTrace.mounts,
    completions:window.__fertiniIntroTrace.completions,
    samples:window.__fertiniIntroTrace.samples,
    timestamps:window.__fertiniIntroTrace.timestamps,
    lineDoneAt:window.__fertiniIntroTrace.lineDoneAt,
    firstShineAt:window.__fertiniIntroTrace.firstShineAt,
    shinePasses:window.__fertiniIntroTrace.shinePasses,
    started:sessionStorage.getItem("fertini:intro:started:v4")
  })`);
  if(!introTrace || introTrace.starts!==1 || introTrace.completions!==1 ||
      introTrace.started!=="1" || !introTrace.lineDoneAt ||
      !(introTrace.firstShineAt>introTrace.lineDoneAt) || introTrace.shinePasses!==1)
   throw Error("Cold-load intro flashed or restarted more than once: "+JSON.stringify(introTrace));
  process.stdout.write("COLD START INTRO TRACE "+JSON.stringify(introTrace)+"\\n");
  // The decision dialog must come AFTER the first intro and must never
  // autoplay audio. Decline, then verify scroll is restored and the choice
  // persists only for the current browsing session.
  await until(()=>evaluate(send,'!!document.querySelector(".fertini-music-consent.is-open")'),3500);
  const invitation=await evaluate(send,`(()=>({
    heading:document.querySelector("#fertini-music-consent-title")?.textContent?.trim(),
    choices:[...document.querySelectorAll(".fertini-music-consent__action")].map(x=>x.textContent?.trim()),
    paused:document.querySelector("audio")?.paused,
    playIcon:!!document.querySelector(".fertini-header-sound .fertini-sound-toggle__play")
  }))()`);
  if(!invitation.heading?.includes("برای تجربه بهتر") ||
     !invitation.choices?.includes("پخش") ||
     !invitation.choices?.includes("تمایل ندارم") ||
     invitation.paused!==true || !invitation.playIcon)
    throw Error("Post-loader music consent or muted header icon was incorrect: "+JSON.stringify(invitation));
  await evaluate(send,'document.querySelector(".fertini-music-consent__action.is-decline")?.click()');
  await until(()=>evaluate(send,
    'sessionStorage.getItem("fertini:ambient-invitation:answered:v1")==="1" && !document.querySelector(".fertini-music-consent.is-open")'
  ),3500);
  await sleep(570);

  const first=await evaluate(send,`(()=>({
    seen:sessionStorage.getItem("fertini:intro:seen:v3"),
    done:document.documentElement.classList.contains("fertini-intro-seen"),
    unlocked:getComputedStyle(document.documentElement).overflow!=="hidden" &&
      getComputedStyle(document.body).overflow!=="hidden"
   }))()`);
  if(first.seen!=="1"||!first.done||!first.unlocked)
   throw Error("Initial prelude did not complete and release scroll: "+JSON.stringify(first));
  await send("Page.reload",{ignoreCache:false});
  await until(()=>evaluate(send,'document.readyState==="complete" && !!document.querySelector(".fertini-hero")'),38000);
  const reload=await evaluate(send,`(()=>({
    seen:sessionStorage.getItem("fertini:intro:seen:v3"),
    introVisible:!![...document.querySelectorAll(".maison-intro")].find(
      el=>getComputedStyle(el).display!=="none"&&getComputedStyle(el).visibility!=="hidden"),
    done:document.documentElement.classList.contains("fertini-intro-seen")
   }))()`);
  if(reload.seen!=="1"||reload.introVisible||!reload.done)
   throw Error("Intro replayed on page reload: "+JSON.stringify(reload));
  process.stdout.write("One-time cinematic intro and reload skip verified.\\n");
 }finally{bypassMusicInvitationForTests=true;await close()}
}

try{
 await mkdir("artifacts",{recursive:true});
 await bootChrome();
 await until(async()=>{const r=await fetch("http://127.0.0.1:3100/");return r.ok},15000);
 if(process.env.FERTINI_ADMIN_ONLY==="1"){
  await validateAdminScreens();
  process.stdout.write("Focused admin visual QA passed.\n");
 }else{
 await validateHomepageIntroOnce();
 await validateStorefrontInteractions();
 await validateCinematicPhotoReveal();
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
 await pageScreenshot({name:"editorial-perfume-desktop",url:"http://127.0.0.1:3100/fragrance/edition/roselia",width:1440,height:900,mobile:false,assertHome:false});
 await pageScreenshot({name:"editorial-perfume-mobile",url:"http://127.0.0.1:3100/fragrance/edition/azure",width:390,height:844,mobile:true,assertHome:false});
 await pageScreenshot({name:"editorial-family-mobile",url:"http://127.0.0.1:3100/fragrance/collection/woody",width:390,height:844,mobile:true,assertHome:false});
 await pageScreenshot({name:"journal-desktop-full",url:"http://127.0.0.1:3100/journal",width:1440,height:900,mobile:false,assertHome:false});
 await pageScreenshot({name:"journal-mobile-full",url:"http://127.0.0.1:3100/journal",width:390,height:844,mobile:true,assertHome:false});
 await pageScreenshot({name:"journal-article-mobile-full",url:"http://127.0.0.1:3100/journal/how-to-choose-a-fragrance",width:390,height:844,mobile:true,assertHome:false});
 await pageScreenshot({name:"about-mobile-full",url:"http://127.0.0.1:3100/about",width:390,height:844,mobile:true,assertHome:false});
 await pageScreenshot({name:"contact-mobile-full",url:"http://127.0.0.1:3100/contact",width:390,height:844,mobile:true,assertHome:false});
 await pageScreenshot({name:"shipping-mobile-full",url:"http://127.0.0.1:3100/shipping",width:390,height:844,mobile:true,assertHome:false});
 await pageScreenshot({name:"privacy-mobile-full",url:"http://127.0.0.1:3100/privacy",width:390,height:844,mobile:true,assertHome:false});
 await pageScreenshot({name:"terms-mobile-full",url:"http://127.0.0.1:3100/terms",width:390,height:844,mobile:true,assertHome:false});
 await pageScreenshot({name:"payment-result-mobile-full",url:"http://127.0.0.1:3100/payment/result?status=failed",width:390,height:844,mobile:true,assertHome:false});
 process.stdout.write("Visual QA browser checks passed.\n");
 }
}finally{
 chrome?.kill("SIGTERM");
 await sleep(250);
 if(chrome && !chrome.killed)chrome.kill("SIGKILL");
}
