import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import type { AuditLogEntry, LogActionInput } from './notifications.types';

interface AuditLogRow {
  id: string;
  actor_id: string | null;
  actor_role: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

const AUDIT_LOG_SELECT = `
  id,
  actor_id,
  actor_role,
  action,
  entity_type,
  entity_id,
  ip_address,
  user_agent,
  metadata,
  created_at
`;

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  logAction(input: LogActionInput): void {
    void this.persistAction(input).catch((error: unknown) => {
      this.logger.error(
        `Failed to persist audit log for action '${input.action}'`,
        error instanceof Error ? error.stack : String(error),
      );
    });
  }

  async listOwnLogs(actorId: string, limit = 50): Promise<AuditLogEntry[]> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('audit_logs')
      .select(AUDIT_LOG_SELECT)
      .eq('actor_id', actorId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      this.logger.error(
        `Failed to load audit logs for actor ${actorId}`,
        error.message,
      );
      return [];
    }

    return (data ?? []).map((row) => this.mapAuditLog(row));
  }

  private async persistAction(input: LogActionInput): Promise<void> {
    const admin = this.supabaseService.getAdminClient();
    const { error } = await admin.from('audit_logs').insert({
      actor_id: input.actorId ?? null,
      actor_role: input.actorRole ?? null,
      action: input.action,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      ip_address: input.ipAddress ?? null,
      user_agent: input.userAgent ?? null,
      metadata: input.metadata ?? {},
    });

    if (error) {
      throw error;
    }
  }

  private mapAuditLog(row: AuditLogRow): AuditLogEntry {
    return {
      id: row.id,
      actor_id: row.actor_id,
      actor_role: row.actor_role,
      action: row.action,
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      ip_address: row.ip_address,
      user_agent: row.user_agent,
      metadata: row.metadata ?? {},
      created_at: row.created_at,
    };
  }
}
