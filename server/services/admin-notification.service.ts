import { adminNotificationBus } from "@/lib/admin-notification-bus";
import {
  adminNotificationRepository,
  type AdminNotificationRow,
} from "@/server/repositories/admin-notification.repository";
import type { PoolConnection } from "mysql2/promise";

function serializeNotification(row: AdminNotificationRow) {
  const serialized = {
    id: Number(row.id),
    type: row.type,
    title: row.title,
    message: row.message ?? null,
    entity_type: row.entity_type ?? null,
    entity_id: row.entity_id === null ? null : Number(row.entity_id),
    is_read: row.is_read ? 1 : 0,
    created_at:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : new Date(row.created_at).toISOString(),
  } as const;

  console.log("[ADMIN_NOTIFICATION][SERIALIZE]", {
    inputId: row.id,
    output: serialized,
    at: new Date().toISOString(),
  });

  return serialized;
}

type CreatePaymentStatusNotificationInput = {
  orderId: number;
  orderNumber: string;
  customerName: string | null;
  status: "SUCCESS" | "FAILED" | "CANCELLED";
  transactionId?: string | null;
  refId?: string | null;
};

class AdminNotificationService {
  async createOrderCreatedNotification(
    payload: {
      orderId: number;
      orderNumber: string;
      customerName: string;
    },
    connection?: PoolConnection,
  ) {
    console.log("[ADMIN_NOTIFICATION][SERVICE_CREATE_ORDER_START]", {
      payload,
      hasConnection: Boolean(connection),
      at: new Date().toISOString(),
    });

    try {
      const notificationId = await adminNotificationRepository.create(
        {
          type: "order_created",
          title: "سفارش جدید ثبت شد",
          message: `سفارش ${payload.orderNumber} برای ${payload.customerName} ثبت شد`,
          entity_type: "order",
          entity_id: payload.orderId,
        },
        connection,
      );

      console.log("[ADMIN_NOTIFICATION][SERVICE_CREATE_ORDER_INSERTED]", {
        notificationId,
        at: new Date().toISOString(),
      });

      const notification = await adminNotificationRepository.findById(
        notificationId,
        connection,
      );

      if (!notification) {
        console.error("[ADMIN_NOTIFICATION][SERVICE_CREATE_ORDER_NOT_FOUND]", {
          notificationId,
          at: new Date().toISOString(),
        });

        throw new Error(
          "Admin notification was created but could not be loaded",
        );
      }

      const serialized = serializeNotification(notification);

      console.log("[ADMIN_NOTIFICATION][SERVICE_BEFORE_BUS_EMIT]", {
        notificationId,
        serialized,
        at: new Date().toISOString(),
      });

      adminNotificationBus.emitNotification(serialized);

      console.log("[ADMIN_NOTIFICATION][SERVICE_AFTER_BUS_EMIT]", {
        notificationId,
        serialized,
        at: new Date().toISOString(),
      });

      return serialized;
    } catch (error) {
      console.error("[ADMIN_NOTIFICATION][SERVICE_CREATE_ORDER_ERROR]", {
        payload,
        hasConnection: Boolean(connection),
        error,
        at: new Date().toISOString(),
      });

      throw error;
    }
  }

  async createPaymentStatusNotification(
    input: CreatePaymentStatusNotificationInput,
    connection?: PoolConnection,
  ) {
    console.log("[ADMIN_NOTIFICATION][SERVICE_PAYMENT_STATUS_START]", {
      input,
      hasConnection: Boolean(connection),
      at: new Date().toISOString(),
    });

    try {
      const type =
        input.status === "SUCCESS"
          ? "payment_success"
          : input.status === "FAILED"
            ? "payment_failed"
            : "payment_cancelled";

      const title =
        input.status === "SUCCESS"
          ? "پرداخت با موفقیت انجام شد"
          : input.status === "FAILED"
            ? "پرداخت ناموفق بود"
            : "پرداخت لغو شد";

      const messageParts = [
        `سفارش ${input.orderNumber}`,
        input.customerName ? `مربوط به ${input.customerName}` : null,
        input.refId ? `کد مرجع: ${input.refId}` : null,
        input.transactionId ? `کد تراکنش: ${input.transactionId}` : null,
      ].filter(Boolean);

      const message = messageParts.join(" - ");

      const existing = await adminNotificationRepository.findByTypeAndEntity(
        {
          type,
          entityType: "order",
          entityId: input.orderId,
        },
        connection,
      );

      if (existing) {
        console.log(
          "[ADMIN_NOTIFICATION][SERVICE_PAYMENT_STATUS_DUPLICATE_PREVENTED]",
          {
            orderId: input.orderId,
            type,
            at: new Date().toISOString(),
          },
        );

        return serializeNotification(existing);
      }

      const notificationId = await adminNotificationRepository.create(
        {
          type,
          title,
          message,
          entity_type: "order",
          entity_id: input.orderId,
        },
        connection,
      );

      const notification = await adminNotificationRepository.findById(
        notificationId,
        connection,
      );

      if (!notification) {
        throw new Error(
          "Admin notification for payment status was created but could not be loaded",
        );
      }

      const serialized = serializeNotification(notification);

      adminNotificationBus.emitNotification(serialized);

      return serialized;
    } catch (error) {
      console.error("[ADMIN_NOTIFICATION][SERVICE_PAYMENT_STATUS_ERROR]", {
        input,
        error,
        at: new Date().toISOString(),
      });

      throw error;
    }
  }

  async getInitialState() {
    console.log("[ADMIN_NOTIFICATION][SERVICE_GET_INITIAL_STATE_START]", {
      at: new Date().toISOString(),
    });

    try {
      const [items, unreadCount] = await Promise.all([
        adminNotificationRepository.getLatest(20),
        adminNotificationRepository.getUnreadCount(),
      ]);

      const result = {
        items: items.map(serializeNotification),
        unread_count: unreadCount,
      };

      console.log("[ADMIN_NOTIFICATION][SERVICE_GET_INITIAL_STATE_SUCCESS]", {
        itemCount: result.items.length,
        unreadCount: result.unread_count,
        at: new Date().toISOString(),
      });

      return result;
    } catch (error) {
      console.error("[ADMIN_NOTIFICATION][SERVICE_GET_INITIAL_STATE_ERROR]", {
        error,
        at: new Date().toISOString(),
      });

      throw error;
    }
  }

  async markAllAsRead() {
    console.log("[ADMIN_NOTIFICATION][SERVICE_MARK_ALL_READ_START]", {
      at: new Date().toISOString(),
    });

    try {
      const affectedRows = await adminNotificationRepository.markAllAsRead();

      console.log("[ADMIN_NOTIFICATION][SERVICE_MARK_ALL_READ_SUCCESS]", {
        affectedRows,
        at: new Date().toISOString(),
      });

      return {
        success: true,
        affectedRows,
      };
    } catch (error) {
      console.error("[ADMIN_NOTIFICATION][SERVICE_MARK_ALL_READ_ERROR]", {
        error,
        at: new Date().toISOString(),
      });

      throw error;
    }
  }

  async markAsRead(id: number) {
    console.log("[ADMIN_NOTIFICATION][SERVICE_MARK_ONE_READ_START]", {
      id,
      at: new Date().toISOString(),
    });

    try {
      const changed = await adminNotificationRepository.markAsRead(id);
      const notification = await adminNotificationRepository.findById(id);

      console.log("[ADMIN_NOTIFICATION][SERVICE_MARK_ONE_READ_SUCCESS]", {
        id,
        changed,
        notification: notification
          ? {
              id: notification.id,
              is_read: notification.is_read,
            }
          : null,
        at: new Date().toISOString(),
      });

      return {
        success: true,
        changed,
        notification: notification ? serializeNotification(notification) : null,
      };
    } catch (error) {
      console.error("[ADMIN_NOTIFICATION][SERVICE_MARK_ONE_READ_ERROR]", {
        id,
        error,
        at: new Date().toISOString(),
      });

      throw error;
    }
  }

  async deleteOne(id: number) {
    console.log("[ADMIN_NOTIFICATION][SERVICE_DELETE_ONE_START]", {
      id,
      at: new Date().toISOString(),
    });

    try {
      const deleted = await adminNotificationRepository.deleteById(id);

      console.log("[ADMIN_NOTIFICATION][SERVICE_DELETE_ONE_SUCCESS]", {
        id,
        deleted,
        at: new Date().toISOString(),
      });

      return {
        success: true,
        deleted,
      };
    } catch (error) {
      console.error("[ADMIN_NOTIFICATION][SERVICE_DELETE_ONE_ERROR]", {
        id,
        error,
        at: new Date().toISOString(),
      });

      throw error;
    }
  }

  async deleteAll() {
    console.log("[ADMIN_NOTIFICATION][SERVICE_DELETE_ALL_START]", {
      at: new Date().toISOString(),
    });

    try {
      const affectedRows = await adminNotificationRepository.deleteAll();

      console.log("[ADMIN_NOTIFICATION][SERVICE_DELETE_ALL_SUCCESS]", {
        affectedRows,
        at: new Date().toISOString(),
      });

      return {
        success: true,
        affectedRows,
      };
    } catch (error) {
      console.error("[ADMIN_NOTIFICATION][SERVICE_DELETE_ALL_ERROR]", {
        error,
        at: new Date().toISOString(),
      });

      throw error;
    }
  }
}

export const adminNotificationService = new AdminNotificationService();
