import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import type {
  CreateNotificationInput,
  Notification,
  NotificationListResult,
} from './notifications.types';

interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

const NOTIFICATION_SELECT = `
  id,
  user_id,
  type,
  title,
  message,
  data,
  is_read,
  read_at,
  created_at
`;

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  createNotification(input: CreateNotificationInput): void {
    void this.persistNotification(input).catch((error: unknown) => {
      this.logger.error(
        `Failed to create notification '${input.type}' for user ${input.userId}`,
        error instanceof Error ? error.stack : String(error),
      );
    });
  }

  async listNotifications(
    userId: string,
    filters: { isRead?: boolean; limit?: number } = {},
  ): Promise<NotificationListResult> {
    const limit = Math.min(filters.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    const admin = this.supabaseService.getAdminClient();
    let query = admin
      .from('notifications')
      .select(NOTIFICATION_SELECT)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (filters.isRead !== undefined) {
      query = query.eq('is_read', filters.isRead);
    }

    const [{ data, error }, unreadCount] = await Promise.all([
      query,
      this.getUnreadCount(userId),
    ]);

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to load notifications',
        code: 'NOTIFICATION_LIST_FAILED',
        details: error.message,
      });
    }

    return {
      items: (data ?? []).map((row) => this.mapNotification(row)),
      unread_count: unreadCount,
    };
  }

  async markAsRead(
    notificationId: string,
    userId: string,
  ): Promise<Notification> {
    const readAt = new Date().toISOString();
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('notifications')
      .update({
        is_read: true,
        read_at: readAt,
      })
      .eq('id', notificationId)
      .eq('user_id', userId)
      .select(NOTIFICATION_SELECT)
      .maybeSingle<NotificationRow>();

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to mark notification as read',
        code: 'NOTIFICATION_READ_FAILED',
        details: error.message,
      });
    }

    if (!data) {
      throw new NotFoundException({
        error: 'Notification not found',
        code: 'NOTIFICATION_NOT_FOUND',
      });
    }

    return this.mapNotification(data);
  }

  async markAllAsRead(userId: string): Promise<{ updated_count: number }> {
    const readAt = new Date().toISOString();
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('notifications')
      .update({
        is_read: true,
        read_at: readAt,
      })
      .eq('user_id', userId)
      .eq('is_read', false)
      .select('id');

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to mark all notifications as read',
        code: 'NOTIFICATION_READ_ALL_FAILED',
        details: error.message,
      });
    }

    return { updated_count: data?.length ?? 0 };
  }

  async getUnreadCount(userId: string): Promise<number> {
    const admin = this.supabaseService.getAdminClient();
    const { count, error } = await admin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      this.logger.error(
        `Failed to count unread notifications for user ${userId}`,
        error.message,
      );
      return 0;
    }

    return count ?? 0;
  }

  private async persistNotification(
    input: CreateNotificationInput,
  ): Promise<void> {
    const admin = this.supabaseService.getAdminClient();
    const { error } = await admin.from('notifications').insert({
      user_id: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      data: input.data ?? {},
    });

    if (error) {
      throw error;
    }
  }

  private mapNotification(row: NotificationRow): Notification {
    return {
      id: row.id,
      user_id: row.user_id,
      type: row.type as Notification['type'],
      title: row.title,
      message: row.message,
      data: row.data ?? {},
      is_read: row.is_read,
      read_at: row.read_at,
      created_at: row.created_at,
    };
  }
}
