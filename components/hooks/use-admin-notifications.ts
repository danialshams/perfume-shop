"use client";
import {useCallback,useEffect,useMemo,useRef,useState} from "react";
export type AdminNotification={id:number;type:string;title:string;message:string|null;
 entity_type:string|null;entity_id:number|null;is_read:0|1;created_at:string};
type ResponseData={items:AdminNotification[];unread_count:number};
export function useAdminNotifications(){
 const [items,setItems]=useState<AdminNotification[]>([]);
 const [unreadTotal,setUnreadTotal]=useState(0);
 const [connection,setConnection]=useState<"connecting"|"live"|"polling"|"offline">("connecting");
 const [hasNewEffect,setHasNewEffect]=useState(false);
 const seen=useRef(new Set<number>()),initial=useRef(false),effectTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const merge=(next:AdminNotification[])=>{
  setItems(prev=>{
   const known=new Map(prev.map(n=>[n.id,n]));
   next.forEach(n=>known.set(n.id,n));
   return [...known.values()].sort((a,b)=>b.id-a.id).slice(0,20);
  });
  const newUnread=initial.current?next.filter(n=>!seen.current.has(n.id)&&n.is_read===0).length:0;
  if(newUnread>0){
   setUnreadTotal(count=>count+newUnread);
   setHasNewEffect(true);
   if(effectTimer.current)clearTimeout(effectTimer.current);
   effectTimer.current=setTimeout(()=>setHasNewEffect(false),1300);
  }
  next.forEach(n=>seen.current.add(n.id));
  initial.current=true;
 };
 const loadInitial=useCallback(async()=>{
  try{const r=await fetch("/api/v1/notifications",{cache:"no-store",credentials:"same-origin"});
   if(!r.ok)throw Error("Unavailable");
   const d=await r.json() as ResponseData;
   if(!Array.isArray(d.items))throw Error("Invalid response");
   setUnreadTotal(Number(d.unread_count||0));
   setItems(prev=>{
    const incoming=new Map(d.items.map(n=>[n.id,n]));
    // The database is the source of truth for reads, deletes and events.
    if(initial.current&&d.items.some(n=>!seen.current.has(n.id)&&n.is_read===0)){
     setHasNewEffect(true);
     if(effectTimer.current)clearTimeout(effectTimer.current);
     effectTimer.current=setTimeout(()=>setHasNewEffect(false),1300);
    }
    d.items.forEach(n=>seen.current.add(n.id));initial.current=true;
    return [...incoming.values()].slice(0,20);
   });
   setConnection(old=>old==="live"?"live":"polling");
  }catch{setConnection("offline")}
 },[]);
 useEffect(()=>{
  let active=true,source:EventSource|null=null,reconnect:ReturnType<typeof setTimeout>|null=null;
  let wait=2000;
  const connect=()=>{
   if(!active||document.visibilityState==="hidden")return;
   source?.close();
   source=new EventSource("/api/v1/notifications/stream");
   source.onopen=()=>{if(active){setConnection("connecting");wait=2000}};
   source.onmessage=e=>{
    try{const data=JSON.parse(e.data);
     if(data.type==="notification"&&data.payload){merge([data.payload as AdminNotification]);setConnection("live")}
     if(data.type==="snapshot"&&Array.isArray(data.payload)){merge(data.payload as AdminNotification[]);setConnection("live")}
     if(data.type==="connection_error")setConnection("offline");
    }catch{}
   };
   source.onerror=()=>{
    source?.close();source=null;
    if(active){setConnection("polling");reconnect=setTimeout(()=>{reconnect=null;connect()},wait);wait=Math.min(wait*2,30000)}
   };
  };
  void loadInitial();connect();
  const polling=setInterval(()=>{if(active&&document.visibilityState==="visible")void loadInitial()},10000);
  const onVisibility=()=>{if(document.visibilityState==="visible"){void loadInitial();if(!source&&!reconnect)connect()}
    else{source?.close();source=null;if(reconnect){clearTimeout(reconnect);reconnect=null}}};
  document.addEventListener("visibilitychange",onVisibility);
  return()=>{active=false;clearInterval(polling);source?.close();if(reconnect)clearTimeout(reconnect);
   if(effectTimer.current)clearTimeout(effectTimer.current);
   document.removeEventListener("visibilitychange",onVisibility)};
 },[loadInitial]);
 const request=async(url:string,method:"POST"|"DELETE")=>{
  const r=await fetch(url,{method,credentials:"same-origin",cache:"no-store"});
  if(!r.ok)throw Error("عملیات اعلان‌ها ناموفق بود");
  await loadInitial();
 };
 const markAllAsRead=()=>request("/api/v1/notifications/read-all","POST");
 const markOneAsRead=(id:number)=>request(`/api/v1/notifications/${id}/read`,"POST");
 const deleteOne=(id:number)=>request(`/api/v1/notifications/${id}`,"DELETE");
 const deleteAll=()=>request("/api/v1/notifications","DELETE");
 const unreadItems=useMemo(()=>items.filter(n=>n.is_read===0),[items]);
 return{items,unreadItems,unreadCount:unreadTotal,hasNewEffect,connection,
  loadInitial,markAllAsRead,markOneAsRead,deleteOne,deleteAll};
}
