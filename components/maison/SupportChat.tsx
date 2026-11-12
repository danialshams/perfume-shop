"use client";
import {useCallback,useEffect,useState,type FormEvent} from "react";
import Link from "next/link";
import {MessageCircle,Send,X,ChevronLeft,LoaderCircle} from "lucide-react";
type Credentials={threadId:string;token:string};
type ChatMessage={id:string;role:string;body:string;createdAt:string};
type Config={enabled:boolean;welcome:string;expectedResponse:string;workingHours:string};
const storageKey="fertini:support:session:v1";
const subjects=[["مشاوره محصول","مشاوره محصول"],["پیگیری سفارش","پیگیری سفارش"],["سؤال دیگر","سؤال دیگر"]] as const;
export function SupportChat(){
 const [open,setOpen]=useState(false),[name,setName]=useState(""),[subject,setSubject]=useState("مشاوره محصول");
 const [session,setSession]=useState<Credentials|null>(null),[messages,setMessages]=useState<ChatMessage[]>([]);
 const [message,setMessage]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(false);
 const [settings,setSettings]=useState<Config>({enabled:true,welcome:"به فرتینی خوش آمدید؛ برای انتخاب رایحه همراهتان هستیم.",expectedResponse:"مشاور رایحه در اولین فرصت پاسخ می‌دهد.",workingHours:""});
 useEffect(()=>{
  try{const stored=localStorage.getItem(storageKey);if(stored){const data=JSON.parse(stored) as Credentials;if(data.threadId&&data.token)setSession(data)}}catch{}
  fetch("/api/v1/engagement?type=settings",{cache:"no-store"}).then(r=>r.json()).then(c=>{if(typeof c.enabled==="boolean")setSettings(c as Config)}).catch(()=>{});
 },[]);
 const load=useCallback(async(current:Credentials)=>{
  const res=await fetch("/api/v1/engagement?type=messages&threadId="+encodeURIComponent(current.threadId),{
   headers:{"x-support-token":current.token},cache:"no-store"
  });
  if(res.status===403){localStorage.removeItem(storageKey);setSession(null);return}
  if(!res.ok)return;
  const data=await res.json();setMessages(data.messages||[]);
 },[]);
 useEffect(()=>{if(!open||!session)return;void load(session);const timer=setInterval(()=>void load(session),4500);return()=>clearInterval(timer)},[open,session,load]);
 async function start(e:FormEvent){
  e.preventDefault();if(!name.trim()||!subject)return;setBusy(true);setError("");
  try{
   const res=await fetch("/api/v1/engagement",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"start",name,subject})});
   const data=await res.json();if(!res.ok)throw Error(data.error||"شروع گفتگو ممکن نیست.");
   const current={threadId:String(data.threadId),token:String(data.token)};
   localStorage.setItem(storageKey,JSON.stringify(current));setSession(current);
  }catch(e){setError(e instanceof Error?e.message:"مشکلی پیش آمد.")}finally{setBusy(false)}
 }
 async function send(e:FormEvent){
  e.preventDefault();if(!session||!message.trim())return;const content=message.trim();setBusy(true);setError("");
  try{
   const res=await fetch("/api/v1/engagement",{method:"POST",headers:{"Content-Type":"application/json","x-support-token":session.token},body:JSON.stringify({action:"message",threadId:session.threadId,message:content})});
   const data=await res.json();if(!res.ok)throw Error(data.error||"ارسال پیام ممکن نیست.");
   setMessage("");await load(session);
  }catch(e){setError(e instanceof Error?e.message:"ارسال پیام ممکن نیست.")}finally{setBusy(false)}
 }
 return <div className="support-root" dir="rtl">
  {open&&<section className="support-window" role="dialog" aria-modal="false" aria-label="گفتگوی آنلاین با پشتیبان">
   <header className="support-header">
    <div><span className="support-header-overline">مشاور رایحه فرتینی</span><h2>گفتگو با فرتینی</h2><small>{settings.expectedResponse}</small></div>
    <button type="button" aria-label="بستن گفتگو" onClick={()=>setOpen(false)}><X size={21}/></button>
   </header>
   {!session?<div className="support-start">
    <p>{settings.welcome}</p>
    {settings.workingHours&&<small>{settings.workingHours}</small>}
    {settings.enabled?<form onSubmit={start}>
     <label>نام<input maxLength={60} required minLength={2} placeholder="نام شما" value={name} onChange={e=>setName(e.target.value)}/></label>
     <label>موضوع گفتگو<select value={subject} onChange={e=>setSubject(e.target.value)}>{subjects.map(s=><option key={s[0]} value={s[0]}>{s[1]}</option>)}</select></label>
     <button type="submit" disabled={busy}>{busy?<LoaderCircle size={18} className="support-spin"/>:"شروع گفتگو"} <ChevronLeft size={18}/></button>
    </form>:<p>پشتیبانی آنلاین موقتاً غیرفعال است.</p>}
    <Link href="/faq" onClick={()=>setOpen(false)}>سؤال‌های متداول <ChevronLeft size={16}/></Link>
   </div>:<>
    <div className="support-history" role="log" aria-live="polite">
     <p className="support-intro">{settings.welcome}</p>
     {messages.length===0&&<p className="support-note">پیام خود را بنویسید؛ پاسخ پشتیبان در همین گفتگو نمایش داده می‌شود.</p>}
     {messages.map(m=><article className={"support-message "+(m.role==="ADMIN"?"is-admin":"is-visitor")} key={m.id}>
      <span>{m.role==="ADMIN"?"پشتیبان":"شما"}</span><p>{m.body}</p></article>)}
    </div>
    <form className="support-composer" onSubmit={send}>
     <input maxLength={1800} aria-label="متن پیام" placeholder="پیام شما..." value={message} onChange={e=>setMessage(e.target.value)}/>
     <button type="submit" disabled={busy||!message.trim()} aria-label="ارسال پیام"><Send size={20}/></button>
    </form>
   </>}
   {error&&<p role="alert" className="support-error">{error}</p>}
   <footer className="support-footer">برای شروع گفتگو به شماره موبایل یا ایمیل نیازی نیست.</footer>
  </section>}
  <button type="button" className="support-launcher" aria-label={open?"بستن چت آنلاین":"باز کردن چت آنلاین"} aria-expanded={open} onClick={()=>setOpen(s=>!s)}>{open?<X size={25}/>:<MessageCircle size={27}/>}</button>
 </div>;
}
