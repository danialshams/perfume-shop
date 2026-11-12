"use client";
import {useEffect,useState,type FormEvent} from "react";
type Item={id:string;question:string;answer:string|null};
export default function FaqPage(){
 const [items,setItems]=useState<Item[]>([]),[question,setQuestion]=useState(""),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false);
 useEffect(()=>{fetch("/api/v1/engagement?type=faq",{cache:"no-store"}).then(r=>r.json()).then(v=>setItems(v.items||[])).catch(()=>{})},[]);
 async function send(e:FormEvent){e.preventDefault();setBusy(true);setNotice("");
  try{const r=await fetch("/api/v1/engagement",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"faq",question})});const j=await r.json();if(!r.ok)throw Error(j.error||"ثبت نشد.");setQuestion("");setNotice(j.message)}
  catch(e){setNotice(e instanceof Error?e.message:"مشکلی پیش آمد.")}finally{setBusy(false)}
 }
 return <div className="faq-page" dir="rtl"><header><span>راهنمای فروشگاه</span><h1>سؤال‌های متداول</h1><p>پاسخ سؤال‌های پرتکرار را اینجا بخوانید.</p></header>
 <div className="faq-entries">{items.length?items.map(i=><details key={i.id}><summary>{i.question}</summary><p>{i.answer}</p></details>):<p>هنوز سؤال پرتکراری منتشر نشده است.</p>}</div>
 <form onSubmit={send}><h2>سؤال شما چیست؟</h2><p>فقط متن سؤال را وارد کنید؛ بعد از بررسی و پاسخ، ممکن است اینجا منتشر شود.</p><textarea value={question} onChange={e=>setQuestion(e.target.value)} minLength={8} maxLength={600} required rows={3} placeholder="سؤالتان را بنویسید..."/><button disabled={busy||question.trim().length<8}>{busy?"در حال ثبت...":"ارسال سؤال"}</button>{notice&&<p role="status">{notice}</p>}</form>
 </div>
}
