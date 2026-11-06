"use client";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, X } from "lucide-react";
import LuxuryNavbar from "@/components/home-sections/navbar";
import { CinematicFooter } from "@/components/home-sections/CinematicStorefront";
import { changeGuestCartQuantity, clearGuestCart, removeGuestCartProduct, useGuestCart } from "@/lib/fertini-guest-cart";
export default function FertiniGuestCart(){
 const cart=useGuestCart();
 return <div className="fertini-guest-cart ql-shop maison-cart">
  <LuxuryNavbar/>
  <main className="maison-wide fertini-guest-cart__main" dir="rtl" id="main-content">
    <header className="fertini-guest-cart__header">
      <span className="maison-kicker" dir="ltr" lang="en">FERTINI / YOUR SELECTION</span>
      <h1>سبد خرید شما</h1><p>{cart.count.toLocaleString("fa-IR")} محصول در سبد</p>
    </header>
    <div className="fertini-guest-cart__layout">
      <section className="fertini-guest-cart__items" aria-label="محصولات انتخاب‌شده">
        {cart.items.map(item=><article key={item.productId+":"+item.volume} className="fertini-guest-cart__item">
          <Link href={"/fragrance/"+item.productId} className="fertini-guest-cart__photo">
            <Image fill sizes="160px" src={item.product.image} alt={item.product.name}/>
          </Link>
          <div className="fertini-guest-cart__detail">
            <span dir="ltr" lang="en">{item.product.subtitle}</span>
            <Link href={"/fragrance/"+item.productId}><h2>{item.product.name}</h2></Link>
            <p>{item.volume.toLocaleString("fa-IR")} میل</p>
            <strong>{(item.quantity*item.variant.price).toLocaleString("fa-IR")} تومان</strong>
            <div className="fertini-guest-cart__controls">
              <div className="fertini-guest-cart__quantity" aria-label="تعداد محصول">
                <button aria-label="کاهش تعداد" type="button" onClick={()=>changeGuestCartQuantity(item.productId,item.volume,item.quantity-1)}><Minus size={17}/></button>
                <span>{item.quantity.toLocaleString("fa-IR")}</span>
                <button aria-label="افزایش تعداد" type="button" disabled={item.quantity>=item.variant.stock}
                  onClick={()=>changeGuestCartQuantity(item.productId,item.volume,item.quantity+1)}><Plus size={17}/></button>
              </div>
              <button className="fertini-guest-cart__remove" onClick={()=>removeGuestCartProduct(item.productId,item.volume)} type="button">
                حذف <X size={14} strokeWidth={1.3}/>
              </button>
            </div>
          </div>
        </article>)}
        <button type="button" className="fertini-guest-cart__clear" onClick={clearGuestCart}>خالی‌کردن سبد</button>
      </section>
      <aside className="fertini-guest-cart__summary" aria-label="خلاصه سفارش">
        <h2>خلاصهٔ انتخاب‌ها</h2>
        <div><span>تعداد</span><span>{cart.count.toLocaleString("fa-IR")}</span></div>
        <div><span>جمع مبلغ</span><strong>{cart.total.toLocaleString("fa-IR")} تومان</strong></div>
        <button type="button" disabled>ادامه به پرداخت</button>
        <p>ثبت نهایی سفارش و پرداخت پس از اتصال و تأیید سرویس فروشگاه فعال می‌شود. محصولات این بخش فعلاً در سبد همین مرورگر نگهداری می‌شوند.</p>
        <Link href="/products">بازگشت به گالری عطرها</Link>
      </aside>
    </div>
  </main>
  <CinematicFooter/>
 </div>;
}
