"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

type CartCountContextValue = {
    cartCount: number;
    refreshCartCount: () => Promise<void>;
    setCartCount: React.Dispatch<React.SetStateAction<number>>;
};

const CartCountContext = createContext<CartCountContextValue | null>(null);

function getCountFromCartResponse(data: any): number {
    const cart = data?.data ?? data?.cart ?? data;

    return Number(
        cart?.summary?.total_quantity ??
        cart?.total_quantity ??
        cart?.items?.reduce(
            (sum: number, item: any) => sum + Number(item.quantity ?? 0),
            0
        ) ??
        0
    );
}

export function CartCountProvider({ children }: { children: React.ReactNode }) {
    const [cartCount, setCartCount] = useState(0);

    const refreshCartCount = useCallback(async () => {
        try {
            const res = await fetch("/api/v1/cart", {
                method: "GET",
                credentials: "include",
                cache: "no-store",
            });

            if (!res.ok) {
                setCartCount(0);
                return;
            }

            const data = await res.json();
            setCartCount(getCountFromCartResponse(data));
        } catch {
            setCartCount(0);
        }
    }, []);

    useEffect(() => {
        refreshCartCount();
    }, [refreshCartCount]);

    useEffect(() => {
        const handleCartChanged = () => {
            refreshCartCount();
        };

        window.addEventListener("cart:changed", handleCartChanged);
        window.addEventListener("focus", handleCartChanged);

        return () => {
            window.removeEventListener("cart:changed", handleCartChanged);
            window.removeEventListener("focus", handleCartChanged);
        };
    }, [refreshCartCount]);

    const value = useMemo(
        () => ({
            cartCount,
            refreshCartCount,
            setCartCount,
        }),
        [cartCount, refreshCartCount]
    );

    return (
        <CartCountContext.Provider value={value}>
            {children}
        </CartCountContext.Provider>
    );
}

export function useCartCount() {
    const context = useContext(CartCountContext);

    if (!context) {
        throw new Error("useCartCount باید داخل CartCountProvider استفاده شود.");
    }

    return context;
}
