"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import { lockDocumentScroll } from "@/lib/document-scroll-lock";
import type { SortOption } from "./MobileSortSheet";

type Category = {
  id: number; name: string; slug: string;
  parent_ids: number[]; parent_names: string[];
  has_children: boolean;
  is_active?: boolean | number;
};
type Props = {
  categories: Category[];
  activeParentId: number | null;
  activeChildId: number | null;
  setActiveParentId: (id: number | null) => void;
  setActiveChildId: (id: number | null) => void;
  loadingCategories: boolean;
  activeFilterLabel?: string | null;
  selectedSort: SortOption;
  onSortChange: (next: SortOption) => void;
};
const sorts: { value: SortOption; label: string; helper: string }[] = [
  { value: "newest", label: "جدیدترین", helper: "تازه‌ترین انتخاب‌ها" },
  { value: "bestselling", label: "پرفروش‌ترین", helper: "بیشترین انتخاب" },
  { value: "lowest", label: "قیمت از کم به زیاد", helper: "انتخاب بر اساس بودجه" },
  { value: "highest", label: "قیمت از زیاد به کم", helper: "انتخاب‌های خاص‌تر" },
];

export default function ProductsFilterBar({
  categories, activeParentId, activeChildId, setActiveParentId, setActiveChildId,
  loadingCategories, activeFilterLabel, selectedSort, onSortChange,
}: Props) {
  const [panel, setPanel] = useState<"categories" | "sort" | null>(null);
  const [search, setSearch] = useState("");
  const firstFocusRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const activeCategory = categories.find(category => category.id === (activeChildId ?? activeParentId));
  const categoryText = activeFilterLabel || activeCategory?.name || "همهٔ رایحه‌ها";
  const sortText = sorts.find(sort => sort.value === selectedSort)?.label || "جدیدترین";
  const visibleCategories = useMemo(() => {
    const normalized=search.trim();
    return categories.filter(category =>
      (category.is_active === undefined || category.is_active === true || Number(category.is_active)===1) &&
      (!normalized || category.name.includes(normalized) || category.parent_names?.some(name => name.includes(normalized)))
    ).sort((a,b)=>(a.parent_ids?.length||0)-(b.parent_ids?.length||0));
  },[categories,search]);

  const close=()=>{setPanel(null);setSearch("");};
  useEffect(()=>{
    if (!panel) return;
    const releaseScroll = lockDocumentScroll();
    const onKey=(event:KeyboardEvent)=>{
      if(event.key==="Escape") { close(); triggerRef.current?.focus(); }
      if(event.key==="Tab"){
        const overlay=document.querySelector<HTMLElement>(".fertini-filter-overlay");
        const items=Array.from(overlay?.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled])')||[]);
        const first=items[0],last=items[items.length-1];
        if(event.shiftKey && document.activeElement===first){event.preventDefault();last?.focus();}
        else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first?.focus();}
      }
    };
    document.addEventListener("keydown",onKey);
    const id=window.requestAnimationFrame(()=>firstFocusRef.current?.focus());
    return ()=>{releaseScroll();document.removeEventListener("keydown",onKey);window.cancelAnimationFrame(id);};
  },[panel]);
  function open(event:React.MouseEvent<HTMLButtonElement>,next:"categories"|"sort") {
    triggerRef.current=event.currentTarget;
    setPanel(next);
  }
  function selectCategory(category:Category|null) {
    if(!category){setActiveParentId(null);setActiveChildId(null);}
    else {
      const root=category.parent_ids?.[0] ?? category.id;
      setActiveParentId(root);
      setActiveChildId(root===category.id?null:category.id);
    }
    close();
  }
  const canClear=Boolean(activeChildId||activeParentId||selectedSort!=="newest");
  return <>
    <div className="fertini-filter-bar" dir="rtl">
      <div className="fertini-filter-bar__label">
        <span dir="ltr" lang="en">THE FRAGRANCE INDEX</span>
        <strong>{categoryText}</strong>
      </div>
      <div className="fertini-filter-bar__actions">
        <button type="button" aria-expanded={panel==="categories"} onClick={event=>open(event,"categories")}>
          <SlidersHorizontal size={17} strokeWidth={1.35}/>
          <span>دسته‌بندی</span><ChevronDown size={15} strokeWidth={1.3}/>
        </button>
        <button type="button" aria-expanded={panel==="sort"} onClick={event=>open(event,"sort")}>
          <span>{sortText}</span><ChevronDown size={15} strokeWidth={1.3}/>
        </button>
        {canClear&&<button type="button" className="fertini-filter-bar__reset" onClick={()=>{setActiveParentId(null);setActiveChildId(null);onSortChange("newest");}}>
          پاک‌کردن فیلترها <X size={13} strokeWidth={1.4}/>
        </button>}
      </div>
    </div>
    {loadingCategories&&<div className="fertini-filter-bar__loading" role="status">در حال آماده‌سازی دسته‌بندی‌ها…</div>}
    {panel && <div className="fertini-filter-overlay" role="dialog" aria-modal="true" aria-label={panel==="sort"?"مرتب‌سازی عطرها":"دسته‌بندی عطرها"}>
      <button type="button" className="fertini-filter-overlay__backdrop" aria-label="بستن پنجره فیلتر" onClick={close} tabIndex={-1}/>
      <section className="fertini-filter-panel" dir="rtl">
        <header className="fertini-filter-panel__head">
          <div><span lang="en" dir="ltr">FERTINI / CURATION</span><h2>{panel==="sort"?"مرتب‌سازی":"خانواده‌های رایحه"}</h2></div>
          <button className="fertini-filter-panel__close" type="button" onClick={close} aria-label="بستن"><X size={21} strokeWidth={1.2}/></button>
        </header>
        {panel==="categories" && <>
          <label className="fertini-filter-panel__search"><Search size={19} strokeWidth={1.2}/>
            <input ref={firstFocusRef} type="search" placeholder="جستجو در دسته‌بندی‌ها" value={search}
              onChange={event=>setSearch(event.target.value)} aria-label="جستجوی دسته‌بندی" /></label>
          <div className="fertini-filter-panel__options">
            <button type="button" className={!activeParentId?"is-active":""} onClick={()=>selectCategory(null)}>
              <span>همهٔ عطرها</span>{!activeParentId&&<Check size={17} strokeWidth={1.4}/>}
            </button>
            {visibleCategories.length ? visibleCategories.map(category=>
              <button type="button" key={category.id}
                className={"fertini-filter-panel__category "+((activeChildId??activeParentId)===category.id?"is-active":"")}
                onClick={()=>selectCategory(category)}>
                <span className={category.parent_ids?.length?"is-child":""}>
                  {category.parent_ids?.length>0&&<small>{category.parent_names?.join(" / ")} / </small>}
                  {category.name}
                </span>
                {(activeChildId??activeParentId)===category.id&&<Check size={17} strokeWidth={1.4}/>}
              </button>) : <p>دسته‌ای با این نام پیدا نشد.</p>}
          </div>
        </>}
        {panel==="sort" && <div className="fertini-filter-panel__options">
          {sorts.map((sort,index)=><button type="button" key={sort.value} autoFocus={index===0}
            className={selectedSort===sort.value?"is-active":""}
            onClick={()=>{onSortChange(sort.value);close();}}>
            <span>{sort.label}<small>{sort.helper}</small></span>
            {selectedSort===sort.value&&<Check size={17} strokeWidth={1.4}/>}
          </button>)}
        </div>}
        <p className="fertini-filter-panel__foot">انتخاب شما مستقیماً در مجموعهٔ محصولات اعمال می‌شود.</p>
      </section>
    </div>}
  </>;
}
