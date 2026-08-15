import { EventEmitter } from "node:events";

export type AdminNotificationEvent = {
  id: number;
  type: string;
  title: string;
  message: string | null;
  entity_type: string | null;
  entity_id: number | null;
  is_read: 0 | 1;
  created_at: string;
};

class AdminNotificationBus extends EventEmitter {
  emitNotification(payload: AdminNotificationEvent) {
    const listenerCount = this.listenerCount("notification");

    console.log("[ADMIN_NOTIFICATION_BUS][EMIT_START]", {
      notificationId: payload.id,
      listenerCount,
      at: new Date().toISOString(),
    });

    const delivered = this.emit("notification", payload);

    console.log("[ADMIN_NOTIFICATION_BUS][EMIT_DONE]", {
      notificationId: payload.id,
      delivered,
      listenerCount: this.listenerCount("notification"),
      at: new Date().toISOString(),
    });

    return delivered;
  }

  onNotification(listener: (payload: AdminNotificationEvent) => void) {
    console.log("[ADMIN_NOTIFICATION_BUS][SUBSCRIBE]", {
      listenerCountBefore: this.listenerCount("notification"),
      at: new Date().toISOString(),
    });

    this.on("notification", listener);

    console.log("[ADMIN_NOTIFICATION_BUS][SUBSCRIBE_DONE]", {
      listenerCountAfter: this.listenerCount("notification"),
      at: new Date().toISOString(),
    });

    return () => {
      this.off("notification", listener);

      console.log("[ADMIN_NOTIFICATION_BUS][UNSUBSCRIBE_DONE]", {
        listenerCountAfter: this.listenerCount("notification"),
        at: new Date().toISOString(),
      });
    };
  }
}

const globalForAdminNotificationBus = globalThis as typeof globalThis & {
  __adminNotificationBus?: AdminNotificationBus;
};

export const adminNotificationBus =
  globalForAdminNotificationBus.__adminNotificationBus ??
  new AdminNotificationBus();

globalForAdminNotificationBus.__adminNotificationBus = adminNotificationBus;
