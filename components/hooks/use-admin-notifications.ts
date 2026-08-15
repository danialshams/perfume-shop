"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type AdminNotification = {
  id: number;
  type: string;
  title: string;
  message: string | null;
  entity_type: string | null;
  entity_id: number | null;
  is_read: 0 | 1;
  created_at: string;
};

type NotificationsResponse = {
  items: AdminNotification[];
  unread_count: number;
};

type MarkOneAsReadResponse = {
  success: boolean;
  changed: boolean;
  notification?: AdminNotification | null;
};

function isNotificationArray(value: unknown): value is AdminNotification[] {
  return Array.isArray(value);
}

export function useAdminNotifications() {
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [hasNewEffect, setHasNewEffect] = useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const effectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadInitial = useCallback(async () => {
    console.log("[ADMIN_NOTIFICATION_CLIENT][LOAD_INITIAL_START]", {
      at: new Date().toISOString(),
    });

    try {
      const res = await fetch("/api/v1/notifications", {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
          Pragma: "no-cache",
          "Cache-Control": "no-cache, no-store, max-age=0, must-revalidate",
        },
      });

      console.log("[ADMIN_NOTIFICATION_CLIENT][LOAD_INITIAL_RESPONSE]", {
        ok: res.ok,
        status: res.status,
        at: new Date().toISOString(),
      });

      if (!res.ok) {
        return;
      }

      const data: NotificationsResponse = await res.json();

      console.log("[ADMIN_NOTIFICATION_CLIENT][LOAD_INITIAL_DATA]", {
        itemCount: data.items?.length ?? 0,
        unreadCount: data.unread_count ?? 0,
        items: data.items?.map((item) => ({
          id: item.id,
          is_read: item.is_read,
        })),
        at: new Date().toISOString(),
      });

      setItems(isNotificationArray(data.items) ? data.items : []);
    } catch (error) {
      console.error("[ADMIN_NOTIFICATION_CLIENT][LOAD_INITIAL_ERROR]", {
        error,
        at: new Date().toISOString(),
      });
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    console.log("[ADMIN_NOTIFICATION_CLIENT][HOOK_MOUNT]", {
      at: new Date().toISOString(),
    });

    function connectSSE() {
      if (!mounted) return;

      console.log("[ADMIN_NOTIFICATION_CLIENT][SSE_CONNECT_START]", {
        at: new Date().toISOString(),
      });

      const eventSource = new EventSource("/api/v1/notifications/stream");
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log("[ADMIN_NOTIFICATION_CLIENT][SSE_OPEN]", {
          readyState: eventSource.readyState,
          at: new Date().toISOString(),
        });
      };

      eventSource.onmessage = (event) => {
        console.log("[ADMIN_NOTIFICATION_CLIENT][SSE_MESSAGE_RAW]", {
          data: event.data,
          at: new Date().toISOString(),
        });

        try {
          const data = JSON.parse(event.data);

          console.log("[ADMIN_NOTIFICATION_CLIENT][SSE_MESSAGE_PARSED]", {
            data,
            at: new Date().toISOString(),
          });

          if (data?.type !== "notification" || !data.payload) {
            return;
          }

          const nextItem = data.payload as AdminNotification;

          setItems((prev) => {
            const existingIndex = prev.findIndex(
              (item) => item.id === nextItem.id,
            );

            console.log("[ADMIN_NOTIFICATION_CLIENT][SSE_NOTIFICATION_STATE]", {
              nextItem,
              existingIndex,
              previousCount: prev.length,
              at: new Date().toISOString(),
            });

            if (existingIndex >= 0) {
              return prev.map((item) =>
                item.id === nextItem.id ? nextItem : item,
              );
            }

            return [nextItem, ...prev].slice(0, 20);
          });

          setHasNewEffect(true);

          if (effectTimerRef.current) {
            clearTimeout(effectTimerRef.current);
          }

          effectTimerRef.current = setTimeout(() => {
            setHasNewEffect(false);
          }, 1600);
        } catch (error) {
          console.error("[ADMIN_NOTIFICATION_CLIENT][SSE_MESSAGE_ERROR]", {
            raw: event.data,
            error,
            at: new Date().toISOString(),
          });
        }
      };

      eventSource.onerror = (error) => {
        console.error("[ADMIN_NOTIFICATION_CLIENT][SSE_ERROR]", {
          error,
          readyState: eventSource.readyState,
          at: new Date().toISOString(),
        });

        eventSource.close();

        if (reconnectTimerRef.current) {
          clearTimeout(reconnectTimerRef.current);
        }

        reconnectTimerRef.current = setTimeout(() => {
          if (mounted) {
            connectSSE();
          }
        }, 3000);
      };
    }

    void loadInitial();
    connectSSE();

    return () => {
      console.log("[ADMIN_NOTIFICATION_CLIENT][HOOK_UNMOUNT]", {
        at: new Date().toISOString(),
      });

      mounted = false;

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }

      if (effectTimerRef.current) {
        clearTimeout(effectTimerRef.current);
        effectTimerRef.current = null;
      }
    };
  }, [loadInitial]);

  const unreadItems = useMemo(
    () => items.filter((item) => item.is_read === 0),
    [items],
  );

  const unreadCount = unreadItems.length;

  const markAllAsRead = useCallback(async () => {
    console.log("[ADMIN_NOTIFICATION_CLIENT][MARK_ALL_READ_START]", {
      at: new Date().toISOString(),
    });

    const previousItems = items;
    const hasUnread = previousItems.some((item) => item.is_read === 0);

    if (!hasUnread) {
      return;
    }

    setItems((prev) => prev.map((item) => ({ ...item, is_read: 1 as const })));

    try {
      const res = await fetch("/api/v1/notifications/read-all", {
        method: "POST",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });

      console.log("[ADMIN_NOTIFICATION_CLIENT][MARK_ALL_READ_RESPONSE]", {
        ok: res.ok,
        status: res.status,
        at: new Date().toISOString(),
      });

      if (!res.ok) {
        setItems(previousItems);
        return;
      }
    } catch (error) {
      setItems(previousItems);

      console.error("[ADMIN_NOTIFICATION_CLIENT][MARK_ALL_READ_ERROR]", {
        error,
        at: new Date().toISOString(),
      });
    }
  }, [items]);

  const markOneAsRead = useCallback(
    async (id: number) => {
      console.log("[ADMIN_NOTIFICATION_CLIENT][MARK_ONE_READ_START]", {
        id,
        at: new Date().toISOString(),
      });

      const targetItem = items.find((item) => item.id === id);

      if (!targetItem || targetItem.is_read === 1) {
        return;
      }

      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, is_read: 1 as const } : item,
        ),
      );

      try {
        const res = await fetch(`/api/v1/notifications/${id}/read`, {
          method: "POST",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        });

        console.log("[ADMIN_NOTIFICATION_CLIENT][MARK_ONE_READ_RESPONSE]", {
          id,
          ok: res.ok,
          status: res.status,
          at: new Date().toISOString(),
        });

        if (!res.ok) {
          setItems((prev) =>
            prev.map((item) =>
              item.id === id ? { ...item, is_read: 0 as const } : item,
            ),
          );
          return;
        }

        const data: MarkOneAsReadResponse = await res.json();

        console.log("[ADMIN_NOTIFICATION_CLIENT][MARK_ONE_READ_DATA]", {
          id,
          data,
          at: new Date().toISOString(),
        });

        if (data.notification) {
          setItems((prev) =>
            prev.map((item) => (item.id === id ? data.notification! : item)),
          );
        }
      } catch (error) {
        setItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, is_read: 0 as const } : item,
          ),
        );

        console.error("[ADMIN_NOTIFICATION_CLIENT][MARK_ONE_READ_ERROR]", {
          id,
          error,
          at: new Date().toISOString(),
        });
      }
    },
    [items],
  );

  const deleteOne = useCallback(async (id: number) => {
    console.log("[ADMIN_NOTIFICATION_CLIENT][DELETE_ONE_START]", {
      id,
      at: new Date().toISOString(),
    });

    const res = await fetch(`/api/v1/notifications/${id}`, {
      method: "DELETE",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    console.log("[ADMIN_NOTIFICATION_CLIENT][DELETE_ONE_RESPONSE]", {
      id,
      ok: res.ok,
      status: res.status,
      at: new Date().toISOString(),
    });

    if (!res.ok) {
      throw new Error("خطا در حذف اعلان");
    }

    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const deleteAll = useCallback(async () => {
    console.log("[ADMIN_NOTIFICATION_CLIENT][DELETE_ALL_START]", {
      at: new Date().toISOString(),
    });

    const res = await fetch("/api/v1/notifications", {
      method: "DELETE",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    console.log("[ADMIN_NOTIFICATION_CLIENT][DELETE_ALL_RESPONSE]", {
      ok: res.ok,
      status: res.status,
      at: new Date().toISOString(),
    });

    if (!res.ok) {
      throw new Error("خطا در حذف همه اعلان‌ها");
    }

    setItems([]);
  }, []);

  return {
    items,
    unreadItems,
    unreadCount,
    hasNewEffect,
    loadInitial,
    markAllAsRead,
    markOneAsRead,
    deleteOne,
    deleteAll,
  };
}
