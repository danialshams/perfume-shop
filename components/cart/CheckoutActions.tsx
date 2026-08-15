// CheckoutActions.tsx
import { ArrowLeft } from "lucide-react";
import { PrimaryButton } from "./Buttons";

export default function CheckoutActions() {
    return (
        <div className="grid grid-cols-1 gap-3 pt-3">
            <PrimaryButton href="/checkout">
                ثبت سفارش
                <ArrowLeft size={16} strokeWidth={1.5} />
            </PrimaryButton>
        </div>
    );
}
