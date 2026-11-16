"use client";
import {Tag} from "antd";
type Props={type:"active"|"inactive"|"draft"|"featured"|"not-featured"|"low-stock"|"in-stock";label:string};
const tones:Record<Props["type"],{background:string;color:string;border:string}>={
 active:{background:"#eaf3e9",color:"#40664b",border:"#d9e7d9"},
 inactive:{background:"#f4f5f2",color:"#778079",border:"#e7eae5"},
 draft:{background:"#f9f1e2",color:"#926c35",border:"#eee2c9"},
 featured:{background:"#eaf3e9",color:"#456651",border:"#dce8dc"},
 "not-featured":{background:"#f4f5f2",color:"#7b877c",border:"#e9ece6"},
 "low-stock":{background:"#fff0e8",color:"#a36b52",border:"#f1ded3"},
 "in-stock":{background:"#eaf3e9",color:"#40664b",border:"#d9e7d9"}
};
export default function AdminStatusBadge({type,label}:Props){
 const tone=tones[type];
 return <Tag style={{background:tone.background,color:tone.color,borderColor:tone.border,
   borderRadius:4,padding:"2px 9px",fontSize:11,lineHeight:"1.8"}}>{label}</Tag>;
}
