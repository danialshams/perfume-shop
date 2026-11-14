"use client";
import {useEffect,useRef,useState} from "react";
import {Monitor,Smartphone,RefreshCw,ExternalLink} from "lucide-react";
/** An actual same-origin storefront in a scaled device-sized iframe, not an inaccurate mock. */
export default function LiveHomePreview({unsaved}:{unsaved:boolean}){
 const [viewport,setViewport]=useState<"mobile"|"desktop">("desktop");
 const [available,setAvailable]=useState(0);
 const [revision,setRevision]=useState(0);
 const root=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const node=root.current;if(!node)return;
  const observer=new ResizeObserver(entries=>setAvailable(entries[0]?.contentRect.width||0));
  observer.observe(node);return()=>observer.disconnect();
 },[]);
 const width=viewport==="desktop"?1440:390;
 const height=viewport==="desktop"?920:844;
 const scale=Math.min(1,Math.max(0,available-24)/width);
 return <section className="fst-card fst-live-preview" aria-label="پیش‌نمایش واقعی صفحه اصلی">
   <div className="fst-live-preview__toolbar">
    <div><h2>نمای واقعی صفحه اصلی</h2><p className="fst-helper">این همان سایت منتشرشده است، در اندازه واقعی دسکتاپ یا موبایل. برای دیدن تغییرات جدید ابتدا ذخیره کن.</p></div>
    <div className="fst-live-preview__actions">
     <button type="button" className={"fst-btn"+(viewport==="desktop"?" fst-btn-primary":"")} onClick={()=>setViewport("desktop")} aria-pressed={viewport==="desktop"}><Monitor size={15}/> دسکتاپ</button>
     <button type="button" className={"fst-btn"+(viewport==="mobile"?" fst-btn-primary":"")} onClick={()=>setViewport("mobile")} aria-pressed={viewport==="mobile"}><Smartphone size={15}/> موبایل</button>
     <button type="button" className="fst-btn" onClick={()=>setRevision(x=>x+1)} aria-label="بازخوانی پیش‌نمایش"><RefreshCw size={15}/></button>
     <a className="fst-btn" href="/" target="_blank" rel="noreferrer" aria-label="باز کردن صفحه اصلی"><ExternalLink size={15}/></a>
    </div>
   </div>
   {unsaved&&<p className="fst-notice">تغییرات هنوز ذخیره نشده‌اند؛ پیش‌نمایش نسخه فعلی سایت را نمایش می‌دهد.</p>}
   <div className="fst-live-preview__stage" ref={root} dir="ltr">
    <div className="fst-live-preview__frame" style={{width:width*scale,height:height*scale}}>
     {scale>0&&<iframe key={viewport+"-"+revision} title={"صفحه اصلی واقعی در حالت "+viewport} src="/"
       loading="lazy" style={{width,height,transform:"scale("+scale+")",transformOrigin:"top left",border:0,background:"#fff"}}/>}
    </div>
   </div>
  </section>;
}
