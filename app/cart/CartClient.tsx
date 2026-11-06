"use client";

import CartItemCard from "@/components/cart/CartItemCard";
import CartSkeleton from "@/components/cart/CartSkeleton";
import EmptyCart from "@/components/cart/EmptyCart";
import ErrorBanner from "@/components/cart/ErrorBanner";
import MobileCheckoutBar from "@/components/cart/MobileCheckoutBar";
import OrderSummary from "@/components/cart/OrderSummary";
import { ContentContainer, PageShell } from "@/components/cart/PageShell";
import ViewportSection from "@/components/cart/ViewportSection";
import { useViewportListReveal } from "@/components/cart/cart.hooks";
import { getErrorText } from "@/components/cart/cart.utils";
import { CinematicFooter } from "@/components/home-sections/CinematicStorefront";
import LuxuryNavbar from "@/components/home-sections/navbar";
import { useCart } from "@/components/hooks/useCart";
import { useGuestCart } from "@/lib/fertini-guest-cart";
import FertiniGuestCart from "@/components/cart/FertiniGuestCart";
import { CartItem } from "@/server/types/cart";
import { useMemo, useState } from "react";

export default function CartClient() {
    const { count: guestCount } = useGuestCart();
    const {
        cart,
        loading,
        error,
        actionLoadingId,
        isEmpty,
        updateQuantity,
        removeItem,
        reload,
    } = useCart({enabled: guestCount===0});

    const [optimisticQuantities, setOptimisticQuantities] = useState<
        Record<string | number, number>
    >({});

    const [itemErrors, setItemErrors] = useState<
        Record<string | number, string | null>
    >({});

    const cartItems = useMemo(() => cart?.items ?? [], [cart?.items]);

    const totalQuantity = useMemo(
        () =>
            cartItems.reduce(
                (sum, item) =>
                    sum + (optimisticQuantities[item.id] ?? item.quantity),
                0
            ),
        [cartItems, optimisticQuantities]
    );

    const subtotal = useMemo(
        () =>
            cartItems.reduce((sum, item) => {
                const qty = optimisticQuantities[item.id] ?? item.quantity;
                return sum + Number(item.unit_price || 0) * qty;
            }, 0),
        [cartItems, optimisticQuantities]
    );

    const listRevealRef = useViewportListReveal<HTMLDivElement>({
        disabled: loading || isEmpty || !cartItems.length,
    });

    const handleQuantityUpdate = async (item: CartItem, nextQuantity: number) => {
        if (nextQuantity < 1 || nextQuantity > item.stock_qty || actionLoadingId) return;

        setItemErrors((prev) => ({ ...prev, [item.id]: null }));
        setOptimisticQuantities((prev) => ({ ...prev, [item.id]: nextQuantity }));

        try {
            await Promise.resolve(updateQuantity(item.id, nextQuantity));
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "مشکلی پیش آمد. لطفاً دوباره تلاش کنید.";
            setItemErrors((prev) => ({ ...prev, [item.id]: getErrorText(message) }));
        } finally {
            setOptimisticQuantities((prev) => {
                const next = { ...prev };
                delete next[item.id];
                return next;
            });
        }
    };

    const handleRemove = async (item: CartItem) => {
        if (actionLoadingId) return;
        setItemErrors((prev) => ({ ...prev, [item.id]: null }));
        setOptimisticQuantities((prev) => {
            const next = { ...prev };
            delete next[item.id];
            return next;
        });
        try {
            await Promise.resolve(removeItem(item.id));
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "مشکلی پیش آمد. لطفاً دوباره تلاش کنید.";
            setItemErrors((prev) => ({ ...prev, [item.id]: getErrorText(message) }));
        }
    };


    if (guestCount>0) return <FertiniGuestCart />;
    if (loading) return <CartSkeleton />;
    if (!cart) return (
        <>
            <LuxuryNavbar />
            <section className="ql-container flex min-h-[65svh] flex-col items-center justify-center gap-6 py-24 text-center">
                <h1 className="text-2xl font-light text-[#302d29]">سبد خرید شما</h1>
                <p className="max-w-md text-sm leading-8 text-[#82766a]">در این مرورگر هنوز محصولی به سبد اضافه نشده است. بررسی سبد آنلاینِ حساب کاربری در حال حاضر در دسترس نیست.</p>
                <button type="button" onClick={() => void reload()} className="border border-[#302d29] px-8 py-4 text-sm text-[#302d29] transition-colors hover:bg-[#302d29] hover:text-white">بررسی مجدد سبد آنلاین</button>
            </section>
            <CinematicFooter />
        </>
    );
    if (isEmpty) return <EmptyCart />;

    return (
        <>
            <LuxuryNavbar />

            <PageShell>
                <ContentContainer className="lg:max-w-[1080px]">
                    <ErrorBanner error={error ? "خطا در بروزرسانی سبد خرید؛ دوباره تلاش کنید." : null} />

                    {/* â”€â”€ Ú†ÛŒØ¯Ù…Ø§Ù† Ø¯Ùˆ Ø³ØªÙˆÙ†Ù‡ Ø¯Ø³Ú©ØªØ§Ù¾ â”€â”€ */}
                    <div className="lg:grid lg:grid-cols-[1fr_320px] lg:items-start lg:gap-12 bg-[#f5f2ed]">
                        {/* â”€â”€ Ø¢ÛŒØªÙ…â€ŒÙ‡Ø§ÛŒ Ø³Ø¨Ø¯ Ø®Ø±ÛŒØ¯ (Ø¯Ø³Ú©ØªØ§Ù¾: Ø³Ù…Øª Ø±Ø§Ø³Øª) â”€â”€ */}
                        <section
                            ref={listRevealRef}
                            className="lg:border-y lg:border-neutral-200"
                        >
                            {cartItems.map((item) => {
                                const itemLoading = actionLoadingId === item.id;
                                const optimisticQuantity = optimisticQuantities[item.id];

                                return (
                                    <CartItemCard
                                        key={item.id}
                                        item={item}
                                        loading={itemLoading}
                                        optimisticQuantity={optimisticQuantity}
                                        itemError={itemErrors[item.id]}
                                        onIncrease={() =>
                                            handleQuantityUpdate(
                                                item,
                                                (optimisticQuantity ?? item.quantity) + 1
                                            )
                                        }
                                        onDecrease={() =>
                                            handleQuantityUpdate(
                                                item,
                                                (optimisticQuantity ?? item.quantity) - 1
                                            )
                                        }
                                        onRemove={() => handleRemove(item)}
                                    />
                                );
                            })}
                        </section>

                        {/* â”€â”€ Ø®Ù„Ø§ØµÙ‡ Ø³ÙØ§Ø±Ø´ (Ø¯Ø³Ú©ØªØ§Ù¾: Ø³Ù…Øª Ú†Ù¾) â”€â”€ */}
                        <div className="mt-20 hidden lg:mt-0 lg:block lg:sticky lg:top-28">
                            <ViewportSection animation="summary">
                                <OrderSummary
                                    totalQuantity={totalQuantity}
                                    subtotal={subtotal}
                                />
                            </ViewportSection>
                        </div>
                    </div>
                </ContentContainer>
            </PageShell>

            {/* Ù†ÙˆØ§Ø± Ù¾Ø±Ø¯Ø§Ø®Øª ÙÙ‚Ø· Ø¯Ø± Ù…ÙˆØ¨Ø§ÛŒÙ„ */}
            <MobileCheckoutBar
                totalQuantity={totalQuantity}
                subtotal={subtotal}
            />

            <CinematicFooter />
        </>
    );
}
