import { db } from "@/lib/db";
import type {
  Pool,
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";

type DbExecutor = Pool | PoolConnection;

function getExecutor(connection?: PoolConnection): DbExecutor {
  return connection ?? db;
}

export type AdminNotificationRow = RowDataPacket & {
  id: number;
  type: string;
  title: string;
  message: string | null;
  entity_type: string | null;
  entity_id: number | null;
  is_read: number;
  created_at: Date | string;
};

export type CreateAdminNotificationInput = {
  type: string;
  title: string;
  message?: string | null;
  entity_type?: string | null;
  entity_id?: number | null;
};

export const adminNotificationRepository = {
  async create(
    data: CreateAdminNotificationInput,
    connection?: PoolConnection,
  ): Promise<number> {
    const executor = getExecutor(connection);

    console.log("[ADMIN_NOTIFICATION][REPOSITORY_CREATE_START]", {
      data,
      hasConnection: Boolean(connection),
      at: new Date().toISOString(),
    });

    try {
      const [result] = await executor.execute<ResultSetHeader>(
        `
        INSERT INTO admin_notifications
        (
          type,
          title,
          message,
          entity_type,
          entity_id,
          is_read,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, 0, NOW(), NOW())
        `,
        [
          data.type,
          data.title,
          data.message ?? null,
          data.entity_type ?? null,
          data.entity_id ?? null,
        ],
      );

      console.log("[ADMIN_NOTIFICATION][REPOSITORY_CREATE_SUCCESS]", {
        insertId: result.insertId,
        affectedRows: result.affectedRows,
        warningStatus: result.warningStatus,
        at: new Date().toISOString(),
      });

      return result.insertId;
    } catch (error) {
      console.error("[ADMIN_NOTIFICATION][REPOSITORY_CREATE_ERROR]", {
        data,
        hasConnection: Boolean(connection),
        error,
        at: new Date().toISOString(),
      });

      throw error;
    }
  },

  async findById(id: number, connection?: PoolConnection) {
    const executor = getExecutor(connection);

    console.log("[ADMIN_NOTIFICATION][REPOSITORY_FIND_BY_ID_START]", {
      id,
      hasConnection: Boolean(connection),
      at: new Date().toISOString(),
    });

    try {
      const [rows] = await executor.execute<AdminNotificationRow[]>(
        `
        SELECT
          id,
          type,
          title,
          message,
          entity_type,
          entity_id,
          is_read,
          created_at
        FROM admin_notifications
        WHERE id = ? 
        LIMIT 1
        `,
        [id],
      );

      console.log("[ADMIN_NOTIFICATION][REPOSITORY_FIND_BY_ID_SUCCESS]", {
        id,
        found: Boolean(rows[0]),
        row: rows[0] ?? null,
        at: new Date().toISOString(),
      });

      return rows[0] ?? null;
    } catch (error) {
      console.error("[ADMIN_NOTIFICATION][REPOSITORY_FIND_BY_ID_ERROR]", {
        id,
        hasConnection: Boolean(connection),
        error,
        at: new Date().toISOString(),
      });

      throw error;
    }
  },

  async findByTypeAndEntity(
    params: {
      type: string;
      entityType: string;
      entityId: number;
    },
    connection?: PoolConnection,
  ): Promise<AdminNotificationRow | null> {
    const executor = getExecutor(connection);

    try {
      const [rows] = await executor.execute<AdminNotificationRow[]>(
        `
        SELECT
          id,
          type,
          title,
          message,
          entity_type,
          entity_id,
          is_read,
          created_at
        FROM admin_notifications
        WHERE type = ?
          AND entity_type = ?
          AND entity_id = ?
        ORDER BY id DESC
        LIMIT 1
        `,
        [params.type, params.entityType, params.entityId],
      );

      return rows[0] ?? null;
    } catch (error) {
      console.error("[ADMIN_NOTIFICATION][REPOSITORY_FIND_BY_TYPE_ENTITY_ERROR]", {
        params,
        error,
        at: new Date().toISOString(),
      });

      throw error;
    }
  },

  async getLatest(limit = 20, connection?: PoolConnection) {
    const executor = getExecutor(connection);

    console.log("[ADMIN_NOTIFICATION][REPOSITORY_GET_LATEST_START]", {
      limit,
      hasConnection: Boolean(connection),
      at: new Date().toISOString(),
    });

    try {
      const [rows] = await executor.execute<AdminNotificationRow[]>(
        `
        SELECT
          id,
          type,
          title,
          message,
          entity_type,
          entity_id,
          is_read,
          created_at
        FROM admin_notifications
        
        ORDER BY id DESC
        LIMIT ?
        `,
        [limit],
      );

      console.log("[ADMIN_NOTIFICATION][REPOSITORY_GET_LATEST_SUCCESS]", {
        count: rows.length,
        firstId: rows[0]?.id ?? null,
        at: new Date().toISOString(),
      });

      return rows;
    } catch (error) {
      console.error("[ADMIN_NOTIFICATION][REPOSITORY_GET_LATEST_ERROR]", {
        limit,
        hasConnection: Boolean(connection),
        error,
        at: new Date().toISOString(),
      });

      throw error;
    }
  },

  async getUnreadCount(connection?: PoolConnection): Promise<number> {
    const executor = getExecutor(connection);

    console.log("[ADMIN_NOTIFICATION][REPOSITORY_UNREAD_COUNT_START]", {
      hasConnection: Boolean(connection),
      at: new Date().toISOString(),
    });

    try {
      const [rows] = await executor.execute<RowDataPacket[]>(
        `
        SELECT COUNT(*) AS unread_count
        FROM admin_notifications
        WHERE is_read = 0 
        `,
      );

      const unreadCount = Number(rows[0]?.unread_count ?? 0);

      console.log("[ADMIN_NOTIFICATION][REPOSITORY_UNREAD_COUNT_SUCCESS]", {
        unreadCount,
        at: new Date().toISOString(),
      });

      return unreadCount;
    } catch (error) {
      console.error("[ADMIN_NOTIFICATION][REPOSITORY_UNREAD_COUNT_ERROR]", {
        hasConnection: Boolean(connection),
        error,
        at: new Date().toISOString(),
      });

      throw error;
    }
  },

  async markAllAsRead(connection?: PoolConnection): Promise<number> {
    const executor = getExecutor(connection);

    console.log("[ADMIN_NOTIFICATION][REPOSITORY_MARK_ALL_READ_START]", {
      hasConnection: Boolean(connection),
      at: new Date().toISOString(),
    });

    try {
      const [result] = await executor.execute<ResultSetHeader>(
        `
        UPDATE admin_notifications
        SET
          is_read = 1,
          updated_at = NOW()
        WHERE is_read = 0 
        `,
      );

      console.log("[ADMIN_NOTIFICATION][REPOSITORY_MARK_ALL_READ_SUCCESS]", {
        affectedRows: result.affectedRows,
        changedRows: result.changedRows,
        at: new Date().toISOString(),
      });

      return result.affectedRows;
    } catch (error) {
      console.error("[ADMIN_NOTIFICATION][REPOSITORY_MARK_ALL_READ_ERROR]", {
        hasConnection: Boolean(connection),
        error,
        at: new Date().toISOString(),
      });

      throw error;
    }
  },

  async markAsRead(id: number, connection?: PoolConnection): Promise<boolean> {
    const executor = getExecutor(connection);

    console.log("[ADMIN_NOTIFICATION][REPOSITORY_MARK_ONE_READ_START]", {
      id,
      hasConnection: Boolean(connection),
      at: new Date().toISOString(),
    });

    try {
      const [result] = await executor.execute<ResultSetHeader>(
        `
        UPDATE admin_notifications
        SET
          is_read = 1,
          updated_at = NOW()
        WHERE id = ? 
        LIMIT 1
        `,
        [id],
      );

      console.log("[ADMIN_NOTIFICATION][REPOSITORY_MARK_ONE_READ_SUCCESS]", {
        id,
        affectedRows: result.affectedRows,
        changedRows: result.changedRows,
        at: new Date().toISOString(),
      });

      return result.affectedRows > 0;
    } catch (error) {
      console.error("[ADMIN_NOTIFICATION][REPOSITORY_MARK_ONE_READ_ERROR]", {
        id,
        hasConnection: Boolean(connection),
        error,
        at: new Date().toISOString(),
      });

      throw error;
    }
  },

  async deleteById(id: number, connection?: PoolConnection): Promise<boolean> {
    const executor = getExecutor(connection);

    console.log("[ADMIN_NOTIFICATION][REPOSITORY_DELETE_ONE_START]", {
      id,
      hasConnection: Boolean(connection),
      at: new Date().toISOString(),
    });

    try {
      const [result] = await executor.execute<ResultSetHeader>(
        `
        DELETE FROM admin_notifications
        WHERE id = ? 
        `,
        [id],
      );

      console.log("[ADMIN_NOTIFICATION][REPOSITORY_DELETE_ONE_SUCCESS]", {
        id,
        affectedRows: result.affectedRows,
        at: new Date().toISOString(),
      });

      return result.affectedRows > 0;
    } catch (error) {
      console.error("[ADMIN_NOTIFICATION][REPOSITORY_DELETE_ONE_ERROR]", {
        id,
        hasConnection: Boolean(connection),
        error,
        at: new Date().toISOString(),
      });

      throw error;
    }
  },

  async deleteAll(connection?: PoolConnection): Promise<number> {
    const executor = getExecutor(connection);

    console.log("[ADMIN_NOTIFICATION][REPOSITORY_DELETE_ALL_START]", {
      hasConnection: Boolean(connection),
      at: new Date().toISOString(),
    });

    try {
      const [result] = await executor.execute<ResultSetHeader>(
        `
        DELETE FROM admin_notifications 
        `,
      );

      console.log("[ADMIN_NOTIFICATION][REPOSITORY_DELETE_ALL_SUCCESS]", {
        affectedRows: result.affectedRows,
        at: new Date().toISOString(),
      });

      return result.affectedRows;
    } catch (error) {
      console.error("[ADMIN_NOTIFICATION][REPOSITORY_DELETE_ALL_ERROR]", {
        hasConnection: Boolean(connection),
        error,
        at: new Date().toISOString(),
      });

      throw error;
    }
  },
};
