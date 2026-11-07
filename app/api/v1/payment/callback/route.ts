import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { paymentRepository } from "@/server/repositories/payment.repository";
import { paymentService } from "@/server/services/payment.service";
import { adminNotificationRepository } from "@/server/repositories/admin-notification.repository";
import type { RowDataPacket } from "mysql2/promise";

type OrderCartRow = RowDataPacket & {
  id: number;
  cart_id: string | null;
  order_number: string;
  customer_name: string | null;
};

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production" || process.env.VERCEL === "1") {
    return NextResponse.redirect(new URL("/payment/result?status=failed&message=gateway_not_configured", request.url));
  }
  try {
    const { searchParams } = new URL(request.url);

    const authority = searchParams.get("authority");
    const status = searchParams.get("status");
    const paymentIntentId = searchParams.get("payment_intent_id");

    if (!authority) {
      return NextResponse.redirect(
        new URL(
          "/payment/result?status=failed&message=missing_authority",
          request.url,
        ),
      );
    }

    const payment = await paymentRepository.findByAuthority(authority);

    if (!payment) {
      return NextResponse.redirect(
        new URL(
          "/payment/result?status=failed&message=payment_not_found",
          request.url,
        ),
      );
    }

    if (payment.status === "SUCCESS") {
      return NextResponse.redirect(
        new URL(
          `/payment/result?status=success&order_id=${payment.order_id}`,
          request.url,
        ),
      );
    }

    const verification = await paymentService.verifyPayment({
      paymentIntentId: paymentIntentId || payment.payment_intent_id,
      authority,
      status,
    });

    // دریافت اطلاعات سفارش برای ارسال در نوتیفیکیشن
    const [orderRows] = await db.execute<OrderCartRow[]>(
      `
      SELECT id, cart_id, order_number, customer_name
      FROM orders
      WHERE id = ?
      LIMIT 1
      `,
      [payment.order_id],
    );
    const orderInfo = orderRows[0];

    if (verification.success) {
      const paidAt = new Date().toISOString().slice(0, 19).replace("T", " ");
      const rawResponse = JSON.stringify(verification.raw ?? {});
      const connection = await db.getConnection();

      try {
        await connection.beginTransaction();
        // Serialize success callbacks per order. A duplicate callback cannot create a second sale alert.
        const [locked] = await connection.execute<RowDataPacket[]>(
          "SELECT id, payment_status FROM orders WHERE id = ? FOR UPDATE",
          [payment.order_id],
        );
        if (!locked.length) throw new Error("Order not found");
        if (locked[0].payment_status === "PAID") {
          await connection.commit();
          return NextResponse.redirect(new URL("/payment/result?status=success&order_id=" + payment.order_id, request.url));
        }

        await connection.execute(
          `
          UPDATE payments
          SET status = 'SUCCESS',
              authority = ?,
              ref_id = ?,
              transaction_id = ?,
              payload = ?,
              raw_response = ?,
              paid_at = ?,
              updated_at = NOW()
          WHERE id = ?
          `,
          [
            authority,
            verification.refId ?? null,
            verification.transactionId ?? null,
            rawResponse,
            rawResponse,
            paidAt,
            payment.id,
          ],
        );

        await connection.execute(
          `
          UPDATE orders
          SET payment_status = 'PAID',
              status = 'PAID',
              paid_at = NOW(),
              updated_at = NOW()
          WHERE id = ?
          `,
          [payment.order_id],
        );

        if (orderInfo?.cart_id) {
          await connection.execute(
            `
            DELETE FROM cart_items
            WHERE cart_id = ?
            `,
            [orderInfo.cart_id],
          );

          await connection.execute(
            `
            UPDATE carts
            SET status = 'ORDERED',
                updated_at = NOW()
            WHERE id = ?
            `,
            [orderInfo.cart_id],
          );
        }

        // Commit the verified payment and its notification in ONE transaction.
        await adminNotificationRepository.create({
          type: "payment_success",
          title: "پرداخت سفارش تأیید شد",
          message: "سفارش " + (orderInfo?.order_number || payment.order_id) +
            (orderInfo?.customer_name ? " برای " + orderInfo.customer_name : "") +
            " پرداخت شد.",
          entity_type: "order",
          entity_id: payment.order_id,
        }, connection);
        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }

      return NextResponse.redirect(
        new URL(
          `/payment/result?status=success&order_id=${payment.order_id}&message=payment_success`,
          request.url,
        ),
      );
    }

    // سناریوی شکست پرداخت یا لغو توسط کاربر
    const failedStatus = status === "CANCELLED" ? "CANCELLED" : "FAILED";

    await paymentRepository.updateStatus(payment.id, {
      status: failedStatus,
      authority,
      payload: verification.raw,
      raw_response: verification.raw,
    });

    await db.execute(
      `
      UPDATE orders
      SET payment_status = ?,
          updated_at = NOW()
      WHERE id = ?
      `,
      [failedStatus, payment.order_id],
    );

    return NextResponse.redirect(
      new URL(
        `/payment/result?status=failed&order_id=${payment.order_id}&message=${
          status === "CANCELLED" ? "payment_cancelled" : "payment_failed"
        }`,
        request.url,
      ),
    );
  } catch (error) {
    console.error("Payment callback error:", error);

    return NextResponse.redirect(
      new URL(
        "/payment/result?status=failed&message=server_error",
        request.url,
      ),
    );
  }
}
