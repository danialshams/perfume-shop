"use client";
import type {ProductQueryParams} from "@/lib/product";
import {Button,Input} from "antd";
import {Search,RotateCcw} from "lucide-react";
type Props={filters:ProductQueryParams;onChange:(value:ProductQueryParams)=>void;onSearch:()=>void;onReset:()=>void};
export default function ProductsFilters({filters,onChange,onSearch,onReset}:Props){
 const hasSearch=Boolean(filters.search?.trim());
 return <div className="fst-products-search">
  <Input size="large" aria-label="جستجوی عطرها" placeholder="جستجوی نام عطر…"
    value={filters.search||""} onChange={e=>onChange({...filters,search:e.target.value,page:1})}
    onPressEnter={onSearch} allowClear/>
  <Button type="primary" size="large" icon={<Search size={16}/>} onClick={onSearch}>جستجو</Button>
  {hasSearch&&<Button type="text" size="large" icon={<RotateCcw size={15}/>}
    onClick={onReset} aria-label="پاک‌کردن جستجو">پاک‌کردن</Button>}
 </div>;
}
