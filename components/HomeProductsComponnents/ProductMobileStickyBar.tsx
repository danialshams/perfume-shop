"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Minus, Plus } from "lucide-react";
import { getProductDisplayPrice, formatPrice, type Product, type ProductVariant } from "@/lib/product";

type Props = {
  product: Product;
  selectedVariant: ProductVariant | null;
  quantity: number;
  onIncreaseQty: () => void;
  onDecreaseQty: () => void;
  onAddToCart: () => void | Promise<unknown>;
  isAddingToCart?: boolean;
  cartError?: string | null;
};

export default function ProductMobileStickyBar({
  product, selectedVariant, quantity,
  onIncreaseQty, onDecreaseQty, onAddToCart,
  isAddingToCart = false, cartError,
}: Props) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const target = document.getElementById("product-mobile-purchase-panel");
    if (!target || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(!entry.isIntersecting);
    }, { threshold: 0.08 });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const stock = Number(selectedVariant?.stock_qty ?? product.total_stock ?? 0);
  const normalPrice = Number(selectedVariant?.price || 0);
  const discountPrice = Number(selectedVariant?.discount_price || 0);
  const unitPrice = discountPrice > 0 ? discountPrice : normalPrice > 0 ? normalPrice : getProductDisplayPrice(product);
  const price = Number(unitPrice || 0);
  const unavailable = !selectedVariant || stock <= 0 || price <= 0;
  if (!visible) return null;

  return (
    <aside className="maison-mobile-purchase lg:hidden" aria-label="دسترسی سریع به خرید عطر">
      <div className="maison-mobile-purchase__price">
        <span>قیمت انتخاب شما</span>
        <strong>{formatPrice(price * quantity)}</strong>
      </div>
      <div className="maison-mobile-purchase__qty" aria-label="تعداد">
        <button type="button" onClick={onDecreaseQty} disabled={quantity <= 1 || isAddingToCart} aria-label="کاهش تعداد"><Minus size={14} strokeWidth={1.2}/></button>
        <span aria-live="polite">{quantity.toLocaleString("fa-IR")}</span>
        <button type="button" onClick={onIncreaseQty} disabled={unavailable || quantity >= stock || isAddingToCart} aria-label="افزایش تعداد"><Plus size={14} strokeWidth={1.2}/></button>
      </div>
      <button type="button" className="maison-mobile-purchase__add" disabled={unavailable || isAddingToCart}
        onClick={() => { try { void Promise.resolve(onAddToCart()).catch(() => {}); } catch {} }}
        aria-label={unavailable ? "این محصول قابل سفارش نیست" : "افزودن به سبد خرید"}>
        {isAddingToCart ? "در حال افزودن" : unavailable ? "ناموجود" : "افزودن"}
        <ArrowLeft size={16} strokeWidth={1.2} aria-hidden="true"/>
      </button>
      {cartError && <div className="maison-mobile-purchase__error" role="alert">{cartError}</div>}
    </aside>
  );
}
