import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { TraceabilityService } from '../traceability/traceability.service';
import {
  POINT_VALUES,
  type AwardPointsInput,
  type PointEventType,
  type PointLedgerEntry,
  type UserPoints,
  type UserPointsSummary,
} from './points.types';

interface PointLedgerRow {
  id: string;
  user_id: string;
  points: number;
  event_type: string;
  entity_type: string | null;
  entity_id: string | null;
  description: string | null;
  created_at: string;
}

const LEDGER_SELECT =
  'id, user_id, points, event_type, entity_type, entity_id, description, created_at';

const RECENT_LIMIT = 20;

@Injectable()
export class PointsService {
  private readonly logger = new Logger('PointsService');

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly traceabilityService: TraceabilityService,
  ) {}

  /**
   * Awards points for a business event. Non-blocking and safe: never throws, so
   * callers can fire-and-forget without affecting the main flow. Grants a
   * one-time first-time bonus when the user earns points for the first time.
   */
  async awardPoints(input: AwardPointsInput): Promise<void> {
    try {
      const points = input.points ?? POINT_VALUES[input.eventType];
      const admin = this.supabaseService.getAdminClient();

      const { count, error: countError } = await admin
        .from('point_ledger')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', input.userId);

      if (countError) {
        throw new Error(countError.message);
      }

      const isFirstAward = (count ?? 0) === 0;

      const { error: insertError } = await admin.from('point_ledger').insert({
        user_id: input.userId,
        points,
        event_type: input.eventType,
        entity_type: input.entityType,
        entity_id: input.entityId,
        description: input.description ?? null,
      });

      if (insertError) {
        throw new Error(insertError.message);
      }

      this.traceabilityService.emitEvent({
        eventType: 'eco_points_awarded',
        entityType: input.entityType,
        entityId: input.entityId,
        actorId: input.userId,
        metadata: {
          points,
          pointEventType: input.eventType,
        },
      });

      if (isFirstAward) {
        await this.awardFirstTimeBonus(input.userId);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Failed to award points (${input.eventType}) to ${input.userId}: ${message}`,
      );
    }
  }

  async getUserPoints(userId: string): Promise<UserPoints> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('point_ledger')
      .select('points')
      .eq('user_id', userId);

    if (error) {
      this.logger.warn(`Failed to load points for ${userId}: ${error.message}`);
      return { user_id: userId, total_points: 0, entry_count: 0 };
    }

    const rows = (data ?? []) as Array<{ points: number }>;
    const totalPoints = rows.reduce((sum, row) => sum + Number(row.points), 0);

    return {
      user_id: userId,
      total_points: totalPoints,
      entry_count: rows.length,
    };
  }

  async getPointsSummary(userId: string): Promise<UserPointsSummary> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('point_ledger')
      .select(LEDGER_SELECT)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.warn(
        `Failed to load points summary for ${userId}: ${error.message}`,
      );
      return {
        user_id: userId,
        total_points: 0,
        entry_count: 0,
        by_event_type: {},
        recent: [],
      };
    }

    const entries = ((data ?? []) as PointLedgerRow[]).map((row) =>
      this.mapEntry(row),
    );
    const totalPoints = entries.reduce((sum, entry) => sum + entry.points, 0);
    const byEventType: Record<string, number> = {};

    for (const entry of entries) {
      byEventType[entry.event_type] =
        (byEventType[entry.event_type] ?? 0) + entry.points;
    }

    return {
      user_id: userId,
      total_points: totalPoints,
      entry_count: entries.length,
      by_event_type: byEventType,
      recent: entries.slice(0, RECENT_LIMIT),
    };
  }

  private async awardFirstTimeBonus(userId: string): Promise<void> {
    const admin = this.supabaseService.getAdminClient();
    const { error } = await admin.from('point_ledger').insert({
      user_id: userId,
      points: POINT_VALUES.first_time_bonus,
      event_type: 'first_time_bonus',
      entity_type: 'user',
      entity_id: userId,
      description: 'Bonus poin pertama di PACUL',
    });

    if (error) {
      this.logger.warn(
        `Failed to award first-time bonus to ${userId}: ${error.message}`,
      );
    }
  }

  private mapEntry(row: PointLedgerRow): PointLedgerEntry {
    return {
      id: row.id,
      user_id: row.user_id,
      points: Number(row.points),
      event_type: row.event_type as PointEventType,
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      description: row.description,
      created_at: row.created_at,
    };
  }
}
