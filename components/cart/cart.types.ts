import { CartItem } from "@/server/types/cart";

export type SummaryProps = {
  totalQuantity: number;
  subtotal: number;
};

export type CartItemCardProps = {
  item: CartItem;
  loading: boolean;
  optimisticQuantity?: number;
  itemError?: string | null;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
};
