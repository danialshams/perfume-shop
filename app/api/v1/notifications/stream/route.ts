import {NextRequest} from "next/server";
import {rejectNonAdminNotificationRequest} from "@/server/middlewares/admin-notification-guard";
import {adminNotificationService} from "@/server/services/admin-notification.service";
export const runtime="nodejs";export const dynamic="force-dynamic";
export const maxDuration=60;
export async function GET(request:NextRequest){
 const denied=await rejectNonAdminNotificationRequest(request);
 if(denied)return denied;
 const encoder=new TextEncoder();
 let stopped=false,ticker:ReturnType<typeof setInterval>|null=null;
 let running=false,latest=0;
 const stream=new ReadableStream<Uint8Array>({
  start(controller){
   const send=(data:unknown)=>{if(stopped)return;try{controller.enqueue(encoder.encode("data: "+JSON.stringify(data)+"\n\n"))}catch{stop()}};
   const stop=()=>{if(stopped)return;stopped=true;if(ticker)clearInterval(ticker);try{controller.close()}catch{}};
   request.signal.addEventListener("abort",stop,{once:true});
   const sync=async()=>{
    if(stopped||running)return;running=true;
    try{
     const data=await adminNotificationService.getInitialState();
     if(latest===0){send({type:"snapshot",payload:data.items});latest=Math.max(0,...data.items.map(x=>x.id))}
     else{
      const fresh=data.items.filter(n=>n.id>latest).sort((a,b)=>a.id-b.id);
      for(const row of fresh)send({type:"notification",payload:row});
      latest=Math.max(latest,...fresh.map(x=>x.id));
     }
    }catch{send({type:"connection_error"})}
    finally{running=false}
   };
   send({type:"connected"});
   void sync();
   // Check durable MySQL records: works across independent Vercel instances.
   ticker=setInterval(()=>{void sync();send({type:"heartbeat"})},2000);
  },cancel(){stopped=true;if(ticker)clearInterval(ticker)}
 });
 return new Response(stream,{headers:{"Content-Type":"text/event-stream; charset=utf-8","Cache-Control":"no-cache, no-store",
  "Connection":"keep-alive","X-Accel-Buffering":"no"}});
}
