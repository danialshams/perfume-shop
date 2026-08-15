export type CartItem = {
  id: number;
  cart_id: number;
  product_id: number;
  variant_id: number;
  quantity: number;
  unit_price: number;
  original_price: number | null;
  product_name: string;
  variant_label: string | null;
  product_image: string | null;
  line_total: number;
  stock_qty: number;
  product_slug: string;
};

export type CartSummary = {
  subtotal: number;
  total_quantity: number;
  items_count: number;
};

export type Cart = {
  id: number;
  token: string;
  status: "ACTIVE" | "ORDERED" | "ABANDONED";
  items: CartItem[];
  summary: CartSummary;
};

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};
