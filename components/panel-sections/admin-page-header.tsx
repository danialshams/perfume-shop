"use client";
import {ReactNode} from "react";

export default function AdminPageHeader({title,subtitle,actions}:{
 title:string;subtitle?:string;actions?:ReactNode;
}){
 return <header className="fst-page-heading fst-common-heading">
  <div className="fst-page-copy">
   <small>FERTINI / MANAGEMENT</small>
   <h1>{title}</h1>
   {subtitle&&<p>{subtitle}</p>}
  </div>
  {actions&&<div className="fst-page-actions">{actions}</div>}
 </header>;
}
