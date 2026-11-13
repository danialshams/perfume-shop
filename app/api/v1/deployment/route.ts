import {NextResponse} from "next/server";
export const runtime="nodejs";
export const dynamic="force-dynamic";
/** Build SHA for SSH deployment health checks; never includes secrets. */
export async function GET(){
 return NextResponse.json({sha:process.env.NEXT_PUBLIC_DEPLOY_SHA||"unknown"},
  {headers:{"Cache-Control":"no-store"}});
}
