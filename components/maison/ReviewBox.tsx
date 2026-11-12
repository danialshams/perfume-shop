"use client";
import {useEffect,useState,type FormEvent} from "react";
type Feedback={id?:string;author:string;body:string;adminReply?:string|null;createdAt?:string};
export function ReviewBox({productId,initial}:{productId:string;initial:Feedback[]}){
 const [items,setItems]=useState(initial),[body,setBody]=useState(""),[busy,setBusy]=useState(false),[notice,setNotice]=useState("");
 useEffect(()=>{
  let alive=true;
  fetch("/api/v1/engagement?type=reviews&productId="+encodeURIComponent(productId),{cache:"no-store"})
   .then(r=>r.ok?r.json():Promise.reject()).then(d=>{if(alive)setItems(d.items||[])}).catch(()=>{});
  return()=>{alive=false};
 },[productId]);
 async function submit(e:FormEvent){e.preventDefault();setBusy(true);setNotice("");
  try{
   const r=await fetch("/api/v1/engagement",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"review",productId,text:body})});
   const j=await r.json();if(!r.ok)throw Error(j.error||"ثبت دیدگاه ناموفق بود.");setBody("");setNotice(j.message);
  }catch(e){setNotice(e instanceof Error?e.message:"مشکلی پیش آمد.")}finally{setBusy(false)}
 }
 return <div className="text-reviews">
  <div className="text-reviews-list">{items.length?items.map((r,i)=><article key={r.id||i}>
   <strong>{r.author||"مهمان"}</strong><p>{r.body}</p>{r.adminReply&&<div className="text-reviews-reply"><b>پاسخ فروشگاه</b><p>{r.adminReply}</p></div>}
  </article>):<p>هنوز دیدگاهی ثبت نشده است. اولین نفر باشید.</p>}</div>
  <form onSubmit={submit} className="text-reviews-form">
   <h3>دیدگاه خود را بنویسید</h3><p>فقط متن دیدگاه دریافت می‌شود؛ نیازی به ثبت نام، امتیاز، ایمیل یا تلفن نیست.</p>
   <textarea aria-label="متن دیدگاه" required minLength={5} maxLength={1200} rows={4} placeholder="تجربه‌تان از این محصول..." value={body} onChange={e=>setBody(e.target.value)}/>
   <button type="submit" disabled={busy||body.trim().length<5}>{busy?"در حال ثبت...":"ارسال دیدگاه"}</button>
   {notice&&<p className="text-reviews-feedback" role="status">{notice}</p>}
  </form>
 </div>
}
