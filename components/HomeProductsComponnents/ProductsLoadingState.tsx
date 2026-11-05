"use client";
function Tile(){
 return <article className="fertini-skeleton-product" aria-hidden="true">
   <div className="fertini-skeleton fertini-skeleton-product__image"/>
   <div className="fertini-skeleton" style={{width:"65%",height:13,marginTop:20}}/>
   <div className="fertini-skeleton" style={{width:"35%",height:10,marginTop:13}}/>
 </article>;
}
export default function ProductsLoadingState(){
 return <div className="fertini-skeleton-grid" aria-label="در حال بارگذاری مجموعه عطرها" aria-busy="true" role="status">
   {Array.from({length:8},(_,i)=><Tile key={i}/>)}
 </div>;
}
