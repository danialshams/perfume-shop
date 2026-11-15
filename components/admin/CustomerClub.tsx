"use client";
import {useCallback,useEffect,useState} from "react";
import {ArrowLeft,Search,RefreshCw,ShoppingBag,Users} from "lucide-react";
type Member={mobile:string;name:string;purchaseCount:number;totalSpent:number;lastPurchaseAt:string|null;registered:boolean;rank:number};
type ClubData={items:Member[];total:number;page:number;limit:number;summary:{customers:number;paidCustomers:number;paidOrders:number;totalPaid:number}};
const money=(n:number)=>Number(n).toLocaleString("fa-IR")+" تومان";
const number=(n:number)=>Number(n).toLocaleString("fa-IR");
function compactDate(raw:string|null){
 if(!raw)return"—";
 try{return new Intl.DateTimeFormat("fa-IR",{year:"numeric",month:"short",day:"numeric"}).format(new Date(raw));}
 catch{return"—"}
}
export default function CustomerClub(){
 const [search,setSearch]=useState(""),[query,setQuery]=useState(""),[page,setPage]=useState(1);
 const [data,setData]=useState<ClubData|null>(null),[error,setError]=useState("");
 const [loading,setLoading]=useState(true);
 const load=useCallback(async()=>{
  setLoading(true);setError("");
  try{
   const params=new URLSearchParams({page:String(page),limit:"20",q:query});
   const response=await fetch("/api/v1/admin/customer-club?"+params,{credentials:"same-origin",cache:"no-store"});
   const body=await response.json().catch(()=>null);
   if(!response.ok||!body?.items)throw Error(body?.error||"دریافت اطلاعات مشتریان ممکن نشد.");
   setData(body);
  }catch(e){setError(e instanceof Error?e.message:"خطای ارتباط با سرور");setData(null);}
  finally{setLoading(false)}
 },[page,query]);
 useEffect(()=>{void load()},[load]);
 return <div className="fst-customer-club" dir="rtl">
  <header className="fst-page-heading"><div><small>FERTINI / CUSTOMER CLUB</small>
   <h1>باشگاه مشتریان</h1>
   <p>رتبه‌بندی بر اساس مبلغ خریدهای پرداخت‌شده؛ بدون امتیاز یا سقف خرید. سفارش لغوشده یا برگشتی محاسبه نمی‌شود.</p>
  </div></header>
  {data&&<div className="fst-club-summary" role="group" aria-label="آمار باشگاه مشتریان">
    <div><Users size={19}/><span>کل مشتریان</span><strong>{number(data.summary.customers)}</strong></div>
    <div><ShoppingBag size={19}/><span>خریدهای موفق</span><strong>{number(data.summary.paidOrders)}</strong></div>
    <div><span>مجموع خریدهای موفق</span><strong>{money(data.summary.totalPaid)}</strong></div>
  </div>}
  <div className="fst-club-tools">
   <form onSubmit={e=>{e.preventDefault();setPage(1);setQuery(search.trim())}} role="search">
    <Search size={18} aria-hidden="true"/><input value={search} onChange={e=>setSearch(e.target.value)}
     placeholder="جستجو با نام یا شماره موبایل" aria-label="جستجوی مشتری"/>
    <button className="fst-btn" type="submit">جستجو</button>
   </form>
   <button className="fst-btn" type="button" disabled={loading} onClick={()=>void load()}>
    <RefreshCw size={16} className={loading?"animate-spin":""}/> بازخوانی
   </button>
  </div>
  {error?<div className="fst-error" role="alert">{error}<button className="fst-btn mt-3" onClick={()=>void load()}>تلاش مجدد</button></div>:null}
  {loading?<div className="fst-card fst-club-empty" role="status">در حال دریافت فهرست مشتریان…</div>
   :data?.items.length?<>
    <div className="fst-club-desktop fst-card">
     <table><thead><tr><th>رتبه</th><th>مشتری</th><th>شماره موبایل</th><th>تعداد خرید</th><th>مجموع خرید</th><th>آخرین خرید</th></tr></thead>
      <tbody>{data.items.map(m=><tr key={m.mobile}>
       <td>{number(m.rank)}</td><td><strong>{m.name}</strong></td><td dir="ltr">{m.mobile}</td>
       <td>{number(m.purchaseCount)}</td><td><b>{money(m.totalSpent)}</b></td><td>{compactDate(m.lastPurchaseAt)}</td>
      </tr>)}</tbody>
     </table>
    </div>
    <div className="fst-club-mobile">{data.items.map(m=><article key={m.mobile} className="fst-card">
     <div className="fst-club-person"><span className="fst-club-rank">{number(m.rank)}</span>
      <div><strong>{m.name}</strong><small dir="ltr">{m.mobile}</small></div>
     </div>
     <div className="fst-club-stats"><span>مجموع خرید <b>{money(m.totalSpent)}</b></span>
      <span>تعداد سفارش <b>{number(m.purchaseCount)}</b></span></div>
     <small>آخرین خرید: {compactDate(m.lastPurchaseAt)}</small>
    </article>)}</div>
    <div className="fst-club-pagination"><span>{number(data.total)} مشتری</span>
     <div><button className="fst-btn" disabled={page<=1} onClick={()=>setPage(n=>Math.max(1,n-1))}>قبلی</button>
      <span>{number(page)}</span><button className="fst-btn" disabled={page*20>=data.total}
       onClick={()=>setPage(n=>n+1)}>بعدی <ArrowLeft size={14}/></button></div>
    </div>
   </>:<div className="fst-card fst-club-empty">مشتری‌ای با این مشخصات پیدا نشد.</div>}
 </div>;
}
