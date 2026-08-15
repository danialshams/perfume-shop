import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/response";
import { db } from "@/lib/db";
import { paymentRepository } from "@/server/repositories/payment.repository";
import { paymentService } from "@/server/services/payment.service";
import type { RowDataPacket } from "mysql2/promise";

type OrderRow = RowDataPacket & {
  id: number;
  customer_id: number | null;
  total_amount: number | string;
  payment_status: string | null;
  status: string | null;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const orderId = Number(body?.order_id);

    if (!orderId) {
      return errorResponse("order_id is required", 400);
    }

    const [orders] = await db.execute<OrderRow[]>(
      `
      SELECT id, customer_id, total_amount, payment_status, status
      FROM orders
      WHERE id = ?
      LIMIT 1
      `,
      [orderId],
    );

    const order = orders[0];

    if (!order) {
      return errorResponse("سفارش پیدا نشد", 404);
    }

    if (order.payment_status === "PAID") {
      return errorResponse("این سفارش قبلاً پرداخت شده است", 400);
    }

    const existingPayment = await paymentRepository.findByOrderId(orderId);

    if (existingPayment && existingPayment.status === "SUCCESS") {
      return errorResponse("این سفارش قبلاً پرداخت موفق داشته است", 400);
    }

    const intent = await paymentService.createPaymentIntent({
      orderId,
      amount: Number(order.total_amount),
      customerId: order.customer_id ?? null,
    });

    if (existingPayment && existingPayment.status === "PENDING") {
      await paymentRepository.updateStatus(existingPayment.id, {
        status: "PENDING",
        authority: intent.authority,
        transaction_id: null,
        ref_id: null,
        payload: {
          order_id: orderId,
          payment_intent_id: intent.paymentIntentId,
        },
        raw_response: {
          order_id: orderId,
          payment_intent_id: intent.paymentIntentId,
          authority: intent.authority,
        },
      });

      await db.execute(
        `
        UPDATE orders
        SET payment_intent_id = ?, updated_at = NOW()
        WHERE id = ?
        `,
        [intent.paymentIntentId, orderId],
      );

      return successResponse(
        {
          order_id: orderId,
          authority: intent.authority,
          payment_intent_id: intent.paymentIntentId,
          payment_url: intent.paymentUrl,
        },
        "Payment request created",
        200,
      );
    }

    await paymentRepository.create({
      order_id: orderId,
      provider: intent.provider,
      authority: intent.authority,
      amount: Number(order.total_amount),
      status: "PENDING",
      payment_intent_id: intent.paymentIntentId,
      payload: {
        order_id: orderId,
        payment_intent_id: intent.paymentIntentId,
      },
      raw_response: {
        order_id: orderId,
        payment_intent_id: intent.paymentIntentId,
        authority: intent.authority,
      },
    });

    await db.execute(
      `
      UPDATE orders
      SET payment_intent_id = ?, updated_at = NOW()
      WHERE id = ?
      `,
      [intent.paymentIntentId, orderId],
    );

    return successResponse(
      {
        order_id: orderId,
        authority: intent.authority,
        payment_intent_id: intent.paymentIntentId,
        payment_url: intent.paymentUrl,
      },
      "Payment request created",
      201,
    );
  } catch (error) {
    return errorResponse(
      error instanceof Error
        ? error.message
        : "Failed to create payment request",
      400,
    );
  }
}
