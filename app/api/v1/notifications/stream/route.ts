import { adminNotificationBus } from "@/lib/admin-notification-bus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

function sseData(data: unknown) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function GET(request: Request) {
  console.log("[ADMIN_NOTIFICATION_SSE][REQUEST_START]", {
    at: new Date().toISOString(),
  });

  const encoder = new TextEncoder();

  let active = true;
  let controllerClosed = false;
  let heartbeat: ReturnType<typeof setInterval> | null = null;
  let unsubscribe: (() => void) | null = null;
  let controllerRef: ReadableStreamDefaultController<Uint8Array> | null = null;

  const cleanup = () => {
    if (!active) return;

    active = false;

    console.log("[ADMIN_NOTIFICATION_SSE][CLEANUP_START]", {
      at: new Date().toISOString(),
    });

    if (heartbeat) {
      clearInterval(heartbeat);
      heartbeat = null;
    }

    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }

    request.signal.removeEventListener("abort", handleAbort);

    console.log("[ADMIN_NOTIFICATION_SSE][CLEANUP_DONE]", {
      at: new Date().toISOString(),
    });
  };

  const safeClose = () => {
    if (controllerClosed) return;

    controllerClosed = true;

    try {
      controllerRef?.close();
    } catch (error) {
      console.warn("[ADMIN_NOTIFICATION_SSE][CLOSE_IGNORED]", {
        error,
        at: new Date().toISOString(),
      });
    }
  };

  const send = (data: unknown) => {
    if (!active || controllerClosed || !controllerRef) {
      console.log("[ADMIN_NOTIFICATION_SSE][SEND_SKIPPED]", {
        data,
        active,
        controllerClosed,
        hasController: Boolean(controllerRef),
        at: new Date().toISOString(),
      });

      return;
    }

    try {
      controllerRef.enqueue(encoder.encode(sseData(data)));

      console.log("[ADMIN_NOTIFICATION_SSE][SEND_SUCCESS]", {
        data,
        at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("[ADMIN_NOTIFICATION_SSE][SEND_ERROR]", {
        data,
        error,
        at: new Date().toISOString(),
      });

      cleanup();
      safeClose();
    }
  };

  function handleAbort() {
    console.log("[ADMIN_NOTIFICATION_SSE][REQUEST_ABORTED]", {
      at: new Date().toISOString(),
    });

    cleanup();
    safeClose();
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controllerRef = controller;

      console.log("[ADMIN_NOTIFICATION_SSE][STREAM_START]", {
        at: new Date().toISOString(),
      });

      request.signal.addEventListener("abort", handleAbort);

      send({
        type: "connected",
        ts: Date.now(),
      });

      heartbeat = setInterval(() => {
        send({
          type: "heartbeat",
          ts: Date.now(),
        });
      }, 15000);

      unsubscribe = adminNotificationBus.onNotification((notification) => {
        console.log("[ADMIN_NOTIFICATION_SSE][BUS_NOTIFICATION_RECEIVED]", {
          notification,
          at: new Date().toISOString(),
        });

        send({
          type: "notification",
          payload: notification,
        });
      });
    },

    cancel(reason) {
      console.log("[ADMIN_NOTIFICATION_SSE][STREAM_CANCEL]", {
        reason,
        at: new Date().toISOString(),
      });

      cleanup();
      controllerClosed = true;
      controllerRef = null;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-store, max-age=0, must-revalidate",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
