"use client";
import {useCallback,useEffect,useState,type FormEvent} from "react";
type Tab="threads"|"reviews"|"faq"|"settings";
type Entry={id:string;[key:string]:unknown};
type Message={id:string;role:string;body:string;createdAt:string};
type Settings={welcome:string;expectedResponse:string;workingHours:string;enabled:boolean};
const defaultSettings:Settings={welcome:"به فرتینی خوش آمدید؛ برای انتخاب رایحه همراهتان هستیم.",expectedResponse:"مشاور رایحه در اولین فرصت پاسخ می‌دهد.",workingHours:"",enabled:true};
export function EngagementAdmin({start="threads"}:{start?:Tab}){
 const [tab,setTab]=useState<Tab>(start),[items,setItems]=useState<Entry[]>([]),[active,setActive]=useState(""),[messages,setMessages]=useState<Message[]>([]);
 const [drafts,setDrafts]=useState<Record<string,string>>({}),[response,setResponse]=useState(""),[question,setQuestion]=useState(""),[answer,setAnswer]=useState("");
 const [settings,setSettings]=useState(defaultSettings),[loading,setLoading]=useState(false),[notice,setNotice]=useState("");
 const read=useCallback(async(view:string,query="")=>{
  const res=await fetch("/api/v1/admin/engagement?view="+view+query,{cache:"no-store"});
  const data=await res.json();
  if(!res.ok)throw Error(data.error||"دریافت اطلاعات ممکن نیست.");
  return data;
 },[]);
 const refresh=useCallback(async(current:Tab,quiet=false)=>{
  try{if(!quiet){setLoading(true);setNotice("")}
   if(current==="settings"){const result=await read("settings");setSettings(result.item||defaultSettings)}
   else setItems((await read(current)).items||[]);
  }catch(e){setNotice(e instanceof Error?e.message:"خطای دریافت اطلاعات")}finally{if(!quiet)setLoading(false)}
 },[read]);
 useEffect(()=>{void refresh(tab)},[tab,refresh]);
 useEffect(()=>{if(tab!=="threads")return;const timer=setInterval(()=>void refresh("threads",true),7000);return()=>clearInterval(timer)},[tab,refresh]);
 const openThread=useCallback(async (id:string)=>{
  try{const result=await read("thread","&id="+encodeURIComponent(id));setActive(id);setMessages(result.messages||[]);setNotice("")}
  catch(e){setNotice(e instanceof Error?e.message:"دریافت گفتگو ممکن نیست.")}
 },[read]);
 useEffect(()=>{if(tab!=="threads"||!active)return;const timer=setInterval(()=>void openThread(active),5000);return()=>clearInterval(timer)},[tab,active,openThread]);
 async function act(data:Record<string,unknown>){
  setLoading(true);setNotice("");
  try{const res=await fetch("/api/v1/admin/engagement",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
   const result=await res.json();if(!res.ok)throw Error(result.error||"ذخیره انجام نشد.");
   setNotice("تغییرات ذخیره شد.");await refresh(tab,true);
   if(tab==="threads"&&active)await openThread(active);
   return true;
  }catch(e){setNotice(e instanceof Error?e.message:"ذخیره انجام نشد.");return false}
  finally{setLoading(false)}
 }
 async function replyChat(e:FormEvent){e.preventDefault();if(!response.trim()||!active)return;if(await act({action:"chatReply",id:active,body:response}))setResponse("")}
 async function newFaq(e:FormEvent){e.preventDefault();if(await act({action:"faqCreate",question,answer})){setQuestion("");setAnswer("")}}
 const sectionTitles:Record<Exclude<Tab,"settings">,{title:string;help:string}>={
 threads:{title:"چت آنلاین",help:"پیام‌های مشتریان، پاسخ‌ها و تنظیمات گفتگو."},
 reviews:{title:"دیدگاه‌ها",help:"بررسی دیدگاه‌ها و پاسخ مدیر به مشتریان."},
 faq:{title:"سؤال‌های متداول",help:"سؤال و پاسخ‌های متنیِ نمایش‌داده‌شده در فروشگاه."},
};
 const page=sectionTitles[start==="settings"?"threads":start];
 return <section className="eng-admin" dir="rtl">
  <header className="eng-admin-heading"><div><span>FERTINI / مدیریت</span>
   <h1>{tab==="settings"?"تنظیمات چت":page.title}</h1><p>{page.help}</p></div>
   {start==="threads"&&<button type="button" className="fst-btn"
      onClick={()=>{setTab(tab==="settings"?"threads":"settings");setActive("")}}>
      {tab==="settings"?"بازگشت به گفتگوها":"تنظیمات چت"}
   </button>}
  </header>
  {notice&&<p role="status" className="eng-admin-notice">{notice}</p>}
  {tab==="threads"&&<div className="eng-chat-desk">
   <div className="eng-chat-list"><h2>گفتگوها</h2>{items.length?items.map(t=><button type="button" key={t.id} className={active===t.id?"selected":""} onClick={()=>void openThread(t.id)}>
    <b>{String(t.visitorName||"مهمان")}</b><small>{String(t.subject||"")}</small><em>{t.status==="CLOSED"?"بسته":"باز"}</em>
   </button>):<p>هنوز گفتگویی ثبت نشده است.</p>}</div>
   <div className="eng-chat-conversation"><h2>متن گفتگو</h2>{!active?<p>یک گفتگو را از فهرست انتخاب کنید.</p>:<>
    <div className="eng-chat-stream">{messages.map(m=><div key={m.id} className={m.role==="ADMIN"?"admin":""}><small>{m.role==="ADMIN"?"پشتیبان":"مشتری"}</small><p>{m.body}</p></div>)}</div>
    <form onSubmit={replyChat}><textarea required maxLength={1800} rows={3} value={response} onChange={e=>setResponse(e.target.value)} placeholder="پاسخ پشتیبان..."/><button disabled={loading||!response.trim()}>ارسال پاسخ</button>
     <button type="button" onClick={()=>void act({action:"chatStatus",id:active,status:"CLOSED"})}>بستن گفتگو</button></form>
   </>}</div></div>}
  {tab==="reviews"&&<div className="eng-entry-list">{items.length?items.map(item=>{
   const id=String(item.id);
   return <article key={id}>
    <small>{String((item.product as {name?:string}|undefined)?.name||"محصول")} — {item.status==="APPROVED"?"منتشرشده":item.status==="REJECTED"?"ردشده":"در انتظار"}</small>
    <p>{String(item.body||"")}</p>
    <label>پاسخ مدیر<textarea rows={3} maxLength={1500} value={drafts[id]??String(item.adminReply||"")} onChange={e=>setDrafts(v=>({...v,[id]:e.target.value}))}/></label>
    <div><button onClick={()=>void act({action:"reviewReply",id,answer:drafts[id]??String(item.adminReply||"")})} disabled={loading}>ذخیره پاسخ</button>
     <button onClick={()=>void act({action:"review",id,status:"APPROVED"})} disabled={loading}>تأیید و انتشار</button>
     <button onClick={()=>void act({action:"review",id,status:"REJECTED"})} disabled={loading}>رد دیدگاه</button></div>
   </article>;
  }):<p>هنوز دیدگاهی ثبت نشده است.</p>}</div>}
  {tab==="faq"&&<div className="eng-entry-list">
   <form className="eng-entry-add" onSubmit={newFaq}><h2>افزودن سؤال متداول</h2><label>سؤال<textarea required minLength={8} maxLength={600} rows={2} value={question} onChange={e=>setQuestion(e.target.value)}/></label><label>پاسخ<textarea rows={3} required minLength={2} maxLength={2000} value={answer} onChange={e=>setAnswer(e.target.value)}/></label><button disabled={loading}>ثبت سؤال و پاسخ</button></form>
   {items.map(item=>{const id=String(item.id);return <article key={id}><small>{item.published?"منتشرشده":"منتشرنشده"}</small><p>{String(item.question||"")}</p>
    <label>پاسخ متنی<textarea rows={3} maxLength={2000} value={drafts[id]??String(item.answer||"")} onChange={e=>setDrafts(v=>({...v,[id]:e.target.value}))}/></label>
    <div><button onClick={()=>void act({action:"faqReply",id,answer:drafts[id]??String(item.answer||""),published:true})} disabled={loading}>ذخیره و انتشار</button>
</div>
   </article>})}</div>}
  {tab==="settings"&&<form className="eng-settings" onSubmit={e=>{e.preventDefault();void act({action:"settings",...settings})}}>
   <label>پیام خوشامدگویی<input maxLength={250} value={settings.welcome} onChange={e=>setSettings(s=>({...s,welcome:e.target.value}))}/><small>متن اولین پیام پنجره چت.</small></label>
   <label>زمان پاسخ‌گویی قابل نمایش<input maxLength={200} value={settings.expectedResponse} onChange={e=>setSettings(s=>({...s,expectedResponse:e.target.value}))}/><small>زمان واقعی را مشخص کنید، نه وعده‌ای که امکان انجام آن نیست.</small></label>
   <label>ساعات کاری<input maxLength={250} value={settings.workingHours} onChange={e=>setSettings(s=>({...s,workingHours:e.target.value}))}/></label>
   <label className="eng-switch"><input type="checkbox" checked={settings.enabled} onChange={e=>setSettings(s=>({...s,enabled:e.target.checked}))}/> فعال‌بودن شروع گفتگوی جدید</label>
   <button disabled={loading}>ذخیره تنظیمات چت</button>
  </form>}
 </section>;
}
