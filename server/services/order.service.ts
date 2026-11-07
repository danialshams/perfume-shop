import { orderRepository } from "@/server/repositories/order.repository";
import { addressRepository } from "@/server/repositories/address.repository";

import {
  findActiveCartByCustomerId,
  findCartItems,
  clearCartItems,
} from "@/server/repositories/cart.repository";

import { findManyProductsByIds } from "@/server/repositories/product.repository";

import { productVariantRepository } from "@/server/repositories/product-variant.repository";
import { paymentRepository } from "@/server/repositories/payment.repository";
import { paymentService } from "@/server/services/payment.service";
import type { CreateOrderInput } from "@/server/validations/order.validation";
import { db } from "@/lib/db";
import { adminNotificationRepository } from "@/server/repositories/admin-notification.repository";

export type CreateOrderPayload = CreateOrderInput & {
  customer_id: number;
};

export const orderService = {
  async getCustomerOrders(params: {
    customerId: number;
    page: number;
    limit: number;
  }) {
    const page = Math.max(1, params.page);
    const limit = Math.max(1, params.limit);
    const offset = (page - 1) * limit;

    const [ordersResult, countResult] = await Promise.all([
      db.query(
        `
      SELECT 
        id,
        order_number,
        status,
        payment_status,
        total_amount,
        created_at
      FROM orders
      WHERE customer_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
      `,
        [params.customerId, limit, offset],
      ),
      db.query(
        `
      SELECT COUNT(*) AS count
      FROM orders
      WHERE customer_id = ?
      `,
        [params.customerId],
      ),
    ]);

    const [ordersRows] = ordersResult as any[];
    const [countRows] = countResult as any[];
    const orders = Array.isArray(ordersRows) ? ordersRows : [];

    // واکشی اقلام هر سفارش و پیوست کردن آن به سفارش مربوطه
    const ordersWithItems = await Promise.all(
      orders.map(async (order: any) => {
        const items = await orderRepository.findItemsByOrderId(order.id);

        return {
          ...order,
          items,
        };
      }),
    );

    return {
      orders: ordersWithItems,
      total: Number(countRows?.[0]?.count ?? 0),
    };
  },
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    payment_status?: string;
  }) {
    return await orderRepository.findAdminList({
      page: params?.page ?? 1,
      limit: params?.limit ?? 10,
      search: params?.search,
      status: params?.status,
      payment_status: params?.payment_status,
    });
  },

  async getAdminById(id: number) {
    const order = await orderRepository.findAdminById(id);

    if (!order) {
      throw new Error("Order not found");
    }

    const items = await orderRepository.findAdminItemsByOrderId(id);

    return {
      ...order,
      items,
    };
  },

  async updateByAdmin(
    id: number,
    data: {
      status?: string;
      payment_status?: string;
      admin_notes?: string | null;
    },
  ) {
    const existing = await orderRepository.findById(id);

    if (!existing) {
      throw new Error("Order not found");
    }

    if(data.payment_status!==undefined)throw new Error("Payment status is gateway-controlled");
    if(data.status!==undefined){
      if(existing.payment_status!=="PAID")throw new Error("امکان ارسال سفارش پرداخت‌نشده وجود ندارد.");
      const transitions:Record<string,string[]>={
        PROCESSING:["PROCESSING","SHIPPED"],
        SHIPPED:["PROCESSING","SHIPPED"],
        DELIVERED:["SHIPPED","DELIVERED"]
      };
      if(!transitions[data.status]?.includes(existing.status))
        throw new Error("انتقال وضعیت سفارش مجاز نیست.");
    }
    await orderRepository.updateAdminOrder(id,{status:data.status,admin_notes:data.admin_notes});
    return await this.getAdminById(id);
  },

  async deleteByAdmin(id: number) {
    const existing = await orderRepository.findById(id);

    if (!existing) {
      throw new Error("Order not found");
    }

    // Preserve the paid transaction history and reserved inventory integrity.
    throw new Error("حذف دائمی سفارش غیرفعال است.");
  },

  async getById(id: number) {
    const order = await orderRepository.findById(id);

    if (!order) {
      throw new Error("Order not found");
    }

    const items = await orderRepository.findItemsByOrderId(id);

    return {
      ...order,
      items,
    };
  },

  async getByIdForUser(customerId: number, id: number) {
    const order = await orderRepository.findByIdForUser(id, customerId);

    if (!order) {
      throw new Error("Order not found or does not belong to user");
    }

    const items = await orderRepository.findItemsByOrderId(id);

    // غنی‌سازی آیتم‌ها با تصویر محصول جهت نمایش در فاکتور نهایی
    const enrichedItems = await Promise.all(
      (items || []).map(async (item: any) => {
        const [productRows] = (await db.query(
          `SELECT image FROM products WHERE id = ? LIMIT 1`,
          [item.product_id],
        )) as any[];

        return {
          ...item,
          product_image: productRows?.[0]?.image || null,
        };
      }),
    );

    return {
      ...order,
      items: enrichedItems,
    };
  },

  async create(data: CreateOrderPayload) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      if (data.address_id) {
        const shippingAddressDetails = await addressRepository.findByIdForUser(
          data.address_id,
          data.customer_id,
          connection,
        );

        if (!shippingAddressDetails) {
          throw new Error(
            "Shipping address not found or does not belong to user",
          );
        }
      }

      const cart = await findActiveCartByCustomerId(
        data.customer_id,
        connection,
      );

      if (!cart) {
        throw new Error("Active cart not found for customer.");
      }

      const cartItems = await findCartItems(cart.id, connection);

      if (!cartItems.length) {
        throw new Error("Cart is empty.");
      }

      const productVariantIds = cartItems.map((item) =>
        Number(item.variant_id),
      );

      const productVariants = await productVariantRepository.findManyByIds(
        productVariantIds,
        connection,
      );

      const productIds = [
        ...new Set(productVariants.map((v) => Number(v.product_id))),
      ];

      const products = await findManyProductsByIds(productIds, connection);

      const variantsMap = new Map(
        productVariants.map((variant) => [Number(variant.id), variant]),
      );

      const productsMap = new Map(
        products.map((product) => [Number(product.id), product]),
      );

      const orderItemsToCreate: Array<{
        product_id: number;
        product_variant_id: number;
        product_name: string;
        variant_label: string | null;
        unit_price: number;
        quantity: number;
        line_total: number;
      }> = [];

      let subtotal_amount = 0;

      for (const item of cartItems) {
        const variant = variantsMap.get(Number(item.variant_id));

        if (!variant) {
          throw new Error(
            `Product variant with ID ${item.variant_id} not found.`,
          );
        }

        const product = productsMap.get(Number(variant.product_id));

        if (!product) {
          throw new Error(`Product with ID ${variant.product_id} not found.`);
        }

        const currentPrice = Number(variant.price);
        const stockQty = Number(variant.stock_qty);
        const reservedStockQty = Number(variant.reserved_stock_qty || 0);
        const requestedQty = Number(item.quantity);
        const availableQty = stockQty - reservedStockQty;

        if (availableQty < requestedQty) {
          throw new Error(
            `Insufficient available stock for product ${product.name}. Available: ${availableQty}, Requested: ${requestedQty}`,
          );
        }

        const lineTotal = currentPrice * requestedQty;
        subtotal_amount += lineTotal;

        orderItemsToCreate.push({
          product_id: Number(product.id),
          product_variant_id: Number(variant.id),
          product_name: String(product.name),
          variant_label:
            variant.volume_ml != null ? `${variant.volume_ml}ml` : null,
          unit_price: currentPrice,
          quantity: requestedQty,
          line_total: lineTotal,
        });
      }

      for (const item of orderItemsToCreate) {
        const reserved = await productVariantRepository.reserveStock(
          item.product_variant_id,
          item.quantity,
          connection,
        );

        if (!reserved) {
          throw new Error(
            `Unable to reserve stock for variant ${item.product_variant_id}`,
          );
        }
      }

      const discount_amount = Number(data.discount_amount || 0);
      const shipping_amount = Number(data.shipping_amount || 0);
      const total_amount = subtotal_amount + shipping_amount - discount_amount;

      const orderId = await orderRepository.createOrder(
        {
          customer_id: data.customer_id,
          address_id: data.address_id ?? null,
          customer_name: data.customer_name,
          customer_phone: data.customer_phone,
          customer_landline: data.customer_landline ?? null,
          customer_email: data.customer_email,
          shipping_province: data.shipping_province,
          shipping_city: data.shipping_city,
          shipping_postal_code: data.shipping_postal_code,
          shipping_address: data.shipping_address,
          shipping_plaque: data.shipping_plaque,
          shipping_unit: data.shipping_unit,
          payment_method: data.payment_method,
          subtotal_amount,
          discount_amount,
          shipping_amount,
          total_amount,
          notes: data.notes,
          status: "PENDING_PAYMENT",
          payment_status: "UNPAID",
          payment_intent_id: null,
        },
        connection,
      );

      for (const item of orderItemsToCreate) {
        await orderRepository.createOrderItem(
          {
            order_id: orderId,
            product_id: item.product_id,
            variant_id: item.product_variant_id,
            product_name: item.product_name,
            variant_title: item.variant_label,
            unit_price: item.unit_price,
            quantity: item.quantity,
            total_price: item.line_total,
          },
          connection,
        );
      }

      const paymentIntent = await paymentService.createPaymentIntent({
        orderId,
        amount: total_amount,
        customerId: data.customer_id,
      });

      await orderRepository.updatePaymentFields(
        orderId,
        {
          payment_intent_id: paymentIntent.paymentIntentId,
          payment_status: "UNPAID",
          status: "PENDING_PAYMENT",
        },
        connection,
      );

      await paymentRepository.create(
        {
          order_id: orderId,
          provider: paymentIntent.provider,
          amount: total_amount,
          status: "PENDING",
          payment_intent_id: paymentIntent.paymentIntentId,
          payload: paymentIntent,
        },
        connection,
      );

      // Persist the order notification in the SAME transaction as the order.
      // SSE reads durable MySQL records across Vercel instances; no in-memory event is required.
      await adminNotificationRepository.create({
        type: "order_created",
        title: "سفارش جدید ثبت شد",
        message: `سفارش #${orderId} برای ${data.customer_name} ثبت شد`,
        entity_type: "order",
        entity_id: orderId,
      }, connection);

      await connection.commit();

      const createdOrder = await this.getByIdForUser(data.customer_id, orderId);

      return {
        ...createdOrder,
        payment: {
          provider: paymentIntent.provider,
          paymentIntentId: paymentIntent.paymentIntentId,
          paymentUrl: paymentIntent.paymentUrl,
          amount: paymentIntent.amount,
        },
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async handlePaymentCallback(params: {
    orderId: number;
    paymentIntentId: string;
    paymentStatus: "SUCCESS" | "FAILED";
    transactionId?: string | null;
    payload?: unknown;
  }) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const order = await orderRepository.findById(params.orderId, connection);

      if (!order) {
        throw new Error("Order not found");
      }

      if (order.payment_status === "PAID" || order.status === "PROCESSING") {
        await connection.rollback();
        return await this.getById(params.orderId);
      }

      if (order.payment_intent_id !== params.paymentIntentId) {
        throw new Error("Payment intent mismatch");
      }

      const orderItems = await orderRepository.findItemsByOrderId(
        params.orderId,
        connection,
      );

      const payment = await paymentRepository.findByOrderId(
        params.orderId,
        connection,
      );

      if (!payment) {
        throw new Error("Payment record not found");
      }

      if (params.paymentStatus === "SUCCESS") {
        for (const item of orderItems) {
          const committed = await productVariantRepository.commitReservedStock(
            Number(item.product_variant_id ?? item.variant_id),
            Number(item.quantity),
            connection,
          );

          if (!committed) {
            throw new Error(
              `Unable to commit reserved stock for variant ${item.product_variant_id ?? item.variant_id}`,
            );
          }
        }

        await orderRepository.updatePaymentFields(
          params.orderId,
          {
            status: "PROCESSING",
            payment_status: "PAID",
            payment_intent_id: params.paymentIntentId,
          },
          connection,
        );

        await paymentRepository.updateStatus(
          Number(payment.id),
          {
            status: "SUCCESS",
            transaction_id: params.transactionId ?? null,
            payload: params.payload,
            paid_at: new Date().toISOString().slice(0, 19).replace("T", " "),
          },
          connection,
        );

        if (order.customer_id) {
          const cart = await findActiveCartByCustomerId(
            Number(order.customer_id),
            connection,
          );

          if (cart) {
            await clearCartItems(cart.id, connection);
          }
        }
      } else {
        for (const item of orderItems) {
          const released = await productVariantRepository.releaseReservedStock(
            Number(item.product_variant_id ?? item.variant_id),
            Number(item.quantity),
            connection,
          );

          if (!released) {
            throw new Error(
              `Unable to release reserved stock for variant ${item.product_variant_id ?? item.variant_id}`,
            );
          }
        }

        await orderRepository.updatePaymentFields(
          params.orderId,
          {
            status: "PENDING_PAYMENT",
            payment_status: "FAILED",
            payment_intent_id: params.paymentIntentId,
          },
          connection,
        );

        await paymentRepository.updateStatus(
          Number(payment.id),
          {
            status: "FAILED",
            transaction_id: params.transactionId ?? null,
            payload: params.payload,
          },
          connection,
        );
      }

      await connection.commit();

      return await this.getById(params.orderId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },
};
