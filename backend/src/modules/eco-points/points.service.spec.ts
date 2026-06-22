import { SupabaseService } from '../../supabase/supabase.service';
import { TraceabilityService } from '../traceability/traceability.service';
import { PointsService } from './points.service';
import { POINT_EVENT_TYPES, POINT_VALUES } from './points.types';

interface MockOptions {
  existingCount?: number;
  rows?: Array<Record<string, unknown>>;
  insertError?: string | null;
}

function createSupabaseMock(opts: MockOptions = {}) {
  const inserts: Array<{ table: string; row: Record<string, unknown> }> = [];
  const existingCount = opts.existingCount ?? 0;
  const rows = opts.rows ?? [];

  const from = jest.fn((table: string) => ({
    select: jest.fn((_cols: string, options?: { head?: boolean }) => {
      const payload = options?.head
        ? { count: existingCount, error: null }
        : { data: rows, error: null };

      return {
        eq: jest.fn(() => {
          const promise = Promise.resolve(payload);
          return Object.assign(promise, {
            order: jest.fn(() => Promise.resolve(payload)),
          });
        }),
      };
    }),
    insert: jest.fn((row: Record<string, unknown>) => {
      inserts.push({ table, row });
      return Promise.resolve({
        error: opts.insertError ? { message: opts.insertError } : null,
      });
    }),
  }));

  const supabaseService = {
    getAdminClient: () => ({ from }),
  } as unknown as SupabaseService;

  return { supabaseService, inserts };
}

function createTraceabilityMock() {
  const emitEvent = jest.fn();
  return {
    traceability: { emitEvent } as unknown as TraceabilityService,
    emitEvent,
  };
}

describe('PointsService', () => {
  const userId = '11111111-1111-4111-8111-111111111111';
  const entityId = '22222222-2222-4222-8222-222222222222';

  it('POINT_VALUES defines a positive value for every point event type', () => {
    for (const eventType of POINT_EVENT_TYPES) {
      expect(POINT_VALUES[eventType]).toBeGreaterThan(0);
    }
  });

  it('awards points and emits an eco_points_awarded traceability event', async () => {
    const { supabaseService, inserts } = createSupabaseMock({
      existingCount: 5,
    });
    const { traceability, emitEvent } = createTraceabilityMock();
    const service = new PointsService(supabaseService, traceability);

    await service.awardPoints({
      userId,
      eventType: 'listing_published',
      entityType: 'waste_listing',
      entityId,
    });

    const ledgerInserts = inserts.filter((i) => i.table === 'point_ledger');
    expect(ledgerInserts).toHaveLength(1);
    expect(ledgerInserts[0]?.row).toMatchObject({
      user_id: userId,
      points: POINT_VALUES.listing_published,
      event_type: 'listing_published',
    });
    expect(emitEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'eco_points_awarded' }),
    );
  });

  it('grants a first-time bonus on the user first award', async () => {
    const { supabaseService, inserts } = createSupabaseMock({
      existingCount: 0,
    });
    const service = new PointsService(
      supabaseService,
      createTraceabilityMock().traceability,
    );

    await service.awardPoints({
      userId,
      eventType: 'rating_submitted',
      entityType: 'order',
      entityId,
    });

    const ledgerInserts = inserts.filter((i) => i.table === 'point_ledger');
    expect(ledgerInserts).toHaveLength(2);
    expect(
      ledgerInserts.some((i) => i.row.event_type === 'first_time_bonus'),
    ).toBe(true);
  });

  it('does not grant a first-time bonus when the user already has entries', async () => {
    const { supabaseService, inserts } = createSupabaseMock({
      existingCount: 3,
    });
    const service = new PointsService(
      supabaseService,
      createTraceabilityMock().traceability,
    );

    await service.awardPoints({
      userId,
      eventType: 'pickup_completed',
      entityType: 'pickup_route',
      entityId,
    });

    const ledgerInserts = inserts.filter((i) => i.table === 'point_ledger');
    expect(ledgerInserts).toHaveLength(1);
    expect(
      ledgerInserts.some((i) => i.row.event_type === 'first_time_bonus'),
    ).toBe(false);
  });

  it('never throws when the ledger insert fails', async () => {
    const { supabaseService } = createSupabaseMock({
      existingCount: 1,
      insertError: 'db down',
    });
    const { traceability, emitEvent } = createTraceabilityMock();
    const service = new PointsService(supabaseService, traceability);

    await expect(
      service.awardPoints({
        userId,
        eventType: 'transaction_completed',
        entityType: 'transaction',
        entityId,
      }),
    ).resolves.toBeUndefined();
    expect(emitEvent).not.toHaveBeenCalled();
  });

  it('sums ledger points in getUserPoints', async () => {
    const { supabaseService } = createSupabaseMock({
      rows: [{ points: 10 }, { points: 25 }, { points: 100 }],
    });
    const service = new PointsService(
      supabaseService,
      createTraceabilityMock().traceability,
    );

    const result = await service.getUserPoints(userId);

    expect(result.total_points).toBe(135);
    expect(result.entry_count).toBe(3);
  });

  it('groups points by event type in getPointsSummary', async () => {
    const { supabaseService } = createSupabaseMock({
      rows: [
        {
          id: 'a',
          user_id: userId,
          points: 10,
          event_type: 'listing_published',
          entity_type: 'waste_listing',
          entity_id: entityId,
          description: null,
          created_at: '2026-06-22T00:00:00.000Z',
        },
        {
          id: 'b',
          user_id: userId,
          points: 50,
          event_type: 'transaction_completed',
          entity_type: 'transaction',
          entity_id: entityId,
          description: null,
          created_at: '2026-06-22T01:00:00.000Z',
        },
        {
          id: 'c',
          user_id: userId,
          points: 10,
          event_type: 'listing_published',
          entity_type: 'waste_listing',
          entity_id: entityId,
          description: null,
          created_at: '2026-06-22T02:00:00.000Z',
        },
      ],
    });
    const service = new PointsService(
      supabaseService,
      createTraceabilityMock().traceability,
    );

    const summary = await service.getPointsSummary(userId);

    expect(summary.total_points).toBe(70);
    expect(summary.by_event_type.listing_published).toBe(20);
    expect(summary.by_event_type.transaction_completed).toBe(50);
    expect(summary.recent).toHaveLength(3);
  });
});
