"use client";
import type {ReactNode} from "react";
export default function AdminPageHeader({title,subtitle,actions}:{
 title:string;subtitle?:string;actions?:ReactNode;
}){
 return <header className="fst-page-heading fst-admin-page-header">
  <div><h1>{title}</h1>{subtitle&&<p>{subtitle}</p>}</div>
  {actions&&<div className="fst-admin-page-header-actions">{actions}</div>}
 </header>;
}
