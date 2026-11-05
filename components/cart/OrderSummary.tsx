// OrderSummary.tsx
import CheckoutActions from "./CheckoutActions";
import SummaryRow from "./SummaryRow";
import { SummaryProps } from "./cart.types";
import { formatPrice } from "./cart.utils";

export default function OrderSummary({
    totalQuantity,
    subtotal,
}: SummaryProps) {
    return (
        <aside className="cart-summary rounded-[0px] border border-[#ded6cb] bg-[#fbfaf7] px-8 py-9">
            <h2 className="text-center text-[14px] font-normal tracking-[0.08em] text-[#302d29]">
                خلاصه سفارش
            </h2>

            <div className="mt-8 space-y-5">
                <SummaryRow label="تعداد کالا" value={formatPrice(totalQuantity)} />
                
                <div className="my-6 h-[0.5px] bg-[#ded6cb]" />

                <div className="flex items-end justify-between gap-4">
                    <span className="text-[13px] font-light tracking-[0.04em] text-[#81766b]">
                        مبلغ قابل پرداخت
                    </span>

                    <div className="text-left" dir="ltr">
                        <span className="text-[20px] font-light tracking-[-0.01em] text-[#1A1A1A]">
                            {formatPrice(subtotal)}
                        </span>
                        <span className="mr-2 text-[10px] font-light text-[#82766a]">تومان</span>
                    </div>
                </div>

                <CheckoutActions />
            </div>
        </aside>
    );
}
