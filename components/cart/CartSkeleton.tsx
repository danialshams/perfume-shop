import LuxuryNavbar from "@/components/home-sections/navbar";
import { CinematicFooter } from "@/components/home-sections/CinematicStorefront";
export default function CartSkeleton(){
 return <div className="ql-shop maison-cart fertini-cart-placeholder">
  <LuxuryNavbar/>
  <main className="maison-wide fertini-cart-placeholder__main" role="status" aria-busy="true" aria-label="در حال آماده‌سازی سبد خرید">
   <div className="fertini-skeleton" style={{width:210,height:36,marginBottom:62}}/>
   <div className="fertini-cart-placeholder__grid">
     <div>{[0,1,2].map(i=><div className="fertini-cart-placeholder__item" key={i}>
       <div className="fertini-skeleton fertini-cart-placeholder__image"/>
       <div className="fertini-cart-placeholder__copy"><div className="fertini-skeleton" style={{width:"70%",height:15}}/><div className="fertini-skeleton" style={{width:"43%",height:12}}/></div>
     </div>)}</div>
     <div className="fertini-skeleton fertini-cart-placeholder__summary"/>
   </div>
  </main>
  <CinematicFooter/>
 </div>;
}
