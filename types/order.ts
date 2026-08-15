export interface OrderItemInput {
  productId: number;
  quantity: number;
  price: number;
}

export interface CreateOrderInput {
  customerName: string;
  customerPhone: string;
  address: string;
  items: OrderItemInput[];
}