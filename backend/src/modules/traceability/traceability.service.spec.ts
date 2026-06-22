import { NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { TraceabilityService } from './traceability.service';

type Row = Record<string, unknown>;

interface TraceabilityTestStore {
  traceability_events: Row[];
  material_batches: Row[];
  material_batch_sources: Row[];
  waste_listings: Row[];
  orders: Row[];
  user_profiles: Row[];
  collector_profiles: Row[];
  nextId: number;
}

function nextId(store: TraceabilityTestStore): string {
  store.nextId += 1;
  return `${String(store.nextId).padStart(8, '0')}-0000-0000-0000-000000000000`;
}

interface Filter {
  column: string;
  op: 'eq' | 'in';
  value: unknown;
}

function matches(row: Row, filters: Filter[]): boolean {
  return filters.every((filter) => {
    if (filter.op === 'eq') {
      return row[filter.column] === filter.value;
    }

    if (filter.op === 'in') {
      return (
        Array.isArray(filter.value) && filter.value.includes(row[filter.column])
      );
    }

    return true;
  });
}

const TABLE_MAP: Record<string, keyof TraceabilityTestStore> = {
  traceability_events: 'traceability_events',
  material_batches: 'material_batches',
  material_batch_sources: 'material_batch_sources',
  waste_listings: 'waste_listings',
  orders: 'orders',
  user_profiles: 'user_profiles',
  collector_profiles: 'collector_profiles',
};

class QueryBuilder {
  private filters: Filter[] = [];
  private orderBy: { column: string; ascending: boolean } | null = null;
  private limitValue: number | null = null;

  constructor(
    private readonly store: TraceabilityTestStore,
    private readonly tableName: string,
    private readonly operation: 'select' | 'insert',
    private payload: Row | Row[] | null = null,
  ) {}

  select(): this {
    return this;
  }

  insert(payload: Row | Row[]): this {
    this.payload = payload;
    return this;
  }

  eq(column: string, value: unknown): this {
    this.filters.push({ column, op: 'eq', value });
    return this;
  }

  in(column: string, value: unknown[]): this {
    this.filters.push({ column, op: 'in', value });
    return this;
  }

  order(column: string, options: { ascending: boolean }): this {
    this.orderBy = { column, ascending: options.ascending };
    return this;
  }

  limit(value: number): this {
    this.limitValue = value;
    return this;
  }

  maybeSingle<T>(): Promise<{ data: T | null; error: null }> {
    const rows = this.execute();
    return Promise.resolve({
      data: (rows[0] as T | undefined) ?? null,
      error: null,
    });
  }

  then<TResult1 = { data: Row[]; error: null }, TResult2 = never>(
    onfulfilled?:
      | ((value: {
          data: Row[];
          error: null;
        }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve({ data: this.execute(), error: null }).then(
      onfulfilled,
      onrejected,
    );
  }

  private tableRows(): Row[] {
    const key = TABLE_MAP[this.tableName];
    if (!key || key === 'nextId') {
      return [];
    }

    return this.store[key];
  }

  private execute(): Row[] {
    const rows = this.tableRows();

    if (this.operation === 'insert') {
      const payload = Array.isArray(this.payload)
        ? this.payload
        : [this.payload ?? {}];
      const inserted = payload.map((row) => {
        const record = {
          id: row.id ?? nextId(this.store),
          created_at: row.created_at ?? new Date().toISOString(),
          metadata: row.metadata ?? {},
          ...row,
        };
        rows.push(record);
        return record;
      });

      return inserted;
    }

    let filtered = rows.filter((row) => matches(row, this.filters));

    if (this.orderBy) {
      filtered = [...filtered].sort((left, right) => {
        const leftValue = left[this.orderBy!.column];
        const rightValue = right[this.orderBy!.column];
        const leftComparable =
          typeof leftValue === 'string' || typeof leftValue === 'number'
            ? String(leftValue)
            : '';
        const rightComparable =
          typeof rightValue === 'string' || typeof rightValue === 'number'
            ? String(rightValue)
            : '';
        return this.orderBy!.ascending
          ? leftComparable.localeCompare(rightComparable)
          : rightComparable.localeCompare(leftComparable);
      });
    }

    if (this.limitValue !== null) {
      filtered = filtered.slice(0, this.limitValue);
    }

    return filtered;
  }
}

function createMockSupabase(store: TraceabilityTestStore): SupabaseService {
  return {
    getAdminClient: () => ({
      from: (tableName: string) => ({
        select: () => new QueryBuilder(store, tableName, 'select'),
        insert: (payload: Row | Row[]) =>
          new QueryBuilder(store, tableName, 'insert', payload),
      }),
    }),
  } as unknown as SupabaseService;
}

describe('TraceabilityService', () => {
  const collectorId = '11111111-1111-1111-1111-111111111111';
  const industryId = '22222222-2222-2222-2222-222222222222';
  const householdId = '33333333-3333-3333-3333-333333333333';
  const otherIndustryId = '44444444-4444-4444-4444-444444444444';
  const batchId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const listingId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const orderId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  const routeId = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

  let store: TraceabilityTestStore;
  let service: TraceabilityService;

  beforeEach(() => {
    store = {
      nextId: 100,
      material_batches: [
        {
          id: batchId,
          collector_id: collectorId,
          category_id: 'cat-1',
          name: 'Batch A',
          status: 'sold',
          total_weight_kg: 120,
          price_per_kg: 5000,
          published_at: '2026-06-20T08:00:00.000Z',
          sold_at: '2026-06-22T10:00:00.000Z',
          created_at: '2026-06-19T12:00:00.000Z',
        },
      ],
      material_batch_sources: [
        {
          batch_id: batchId,
          listing_id: listingId,
          created_at: '2026-06-19T12:05:00.000Z',
        },
      ],
      waste_listings: [
        {
          id: listingId,
          household_id: householdId,
          category_id: 'cat-1',
          title: 'Cardboard bundle',
          status: 'converted_to_material',
          estimated_weight_kg: 120,
          actual_weight_kg: 118,
          city: 'Bandung',
          claimed_by: collectorId,
          sorted_at: '2026-06-19T14:00:00.000Z',
          picked_up_at: '2026-06-18T16:00:00.000Z',
          created_at: '2026-06-17T09:00:00.000Z',
        },
      ],
      orders: [
        {
          id: orderId,
          industry_id: industryId,
          collector_id: collectorId,
          batch_id: batchId,
          status: 'completed',
          requested_weight_kg: 120,
          final_weight_kg: 118,
          final_price_per_kg: 5200,
          total_amount: 613600,
          created_at: '2026-06-20T09:00:00.000Z',
        },
      ],
      user_profiles: [
        {
          id: collectorId,
          display_name: 'Collector One',
        },
      ],
      collector_profiles: [
        {
          id: collectorId,
          business_name: 'Eco Collect Bandung',
        },
      ],
      traceability_events: [
        {
          id: nextId({ nextId: 0 } as TraceabilityTestStore),
          event_type: 'waste_uploaded',
          entity_type: 'waste_listing',
          entity_id: listingId,
          actor_id: householdId,
          actor_role: 'household',
          previous_status: null,
          new_status: 'draft',
          metadata: {},
          linked_entity_type: null,
          linked_entity_id: null,
          created_at: '2026-06-17T09:00:00.000Z',
        },
        {
          id: nextId({ nextId: 1 } as TraceabilityTestStore),
          event_type: 'picked_up',
          entity_type: 'waste_listing',
          entity_id: listingId,
          actor_id: collectorId,
          actor_role: 'collector',
          previous_status: 'pickup_planned',
          new_status: 'picked_up',
          metadata: {},
          linked_entity_type: 'pickup_route',
          linked_entity_id: routeId,
          created_at: '2026-06-18T16:00:00.000Z',
        },
        {
          id: nextId({ nextId: 2 } as TraceabilityTestStore),
          event_type: 'material_batch_created',
          entity_type: 'material_batch',
          entity_id: batchId,
          actor_id: collectorId,
          actor_role: 'collector',
          previous_status: null,
          new_status: 'draft',
          metadata: {},
          linked_entity_type: null,
          linked_entity_id: null,
          created_at: '2026-06-19T12:00:00.000Z',
        },
        {
          id: nextId({ nextId: 3 } as TraceabilityTestStore),
          event_type: 'material_listed',
          entity_type: 'material_batch',
          entity_id: batchId,
          actor_id: collectorId,
          actor_role: 'collector',
          previous_status: 'draft',
          new_status: 'available',
          metadata: {},
          linked_entity_type: null,
          linked_entity_id: null,
          created_at: '2026-06-20T08:00:00.000Z',
        },
        {
          id: nextId({ nextId: 4 } as TraceabilityTestStore),
          event_type: 'order_created',
          entity_type: 'order',
          entity_id: orderId,
          actor_id: industryId,
          actor_role: 'industry',
          previous_status: null,
          new_status: 'created',
          metadata: {},
          linked_entity_type: 'material_batch',
          linked_entity_id: batchId,
          created_at: '2026-06-20T09:00:00.000Z',
        },
        {
          id: nextId({ nextId: 5 } as TraceabilityTestStore),
          event_type: 'deal_accepted',
          entity_type: 'negotiation_thread',
          entity_id: 'thread-1',
          actor_id: industryId,
          actor_role: 'industry',
          previous_status: null,
          new_status: 'accepted',
          metadata: { pricePerKg: 5200, weightKg: 118, totalAmount: 613600 },
          linked_entity_type: 'order',
          linked_entity_id: orderId,
          created_at: '2026-06-21T08:00:00.000Z',
        },
        {
          id: nextId({ nextId: 6 } as TraceabilityTestStore),
          event_type: 'transaction_completed',
          entity_type: 'transaction',
          entity_id: 'txn-1',
          actor_id: industryId,
          actor_role: 'industry',
          previous_status: null,
          new_status: 'completed',
          metadata: {},
          linked_entity_type: 'order',
          linked_entity_id: orderId,
          created_at: '2026-06-22T10:00:00.000Z',
        },
      ],
    };

    service = new TraceabilityService(createMockSupabase(store));
  });

  it('returns material timeline with chain_summary using city-only waste sources', async () => {
    const timeline = await service.getMaterialTrackTimeline(
      batchId,
      industryId,
      'industry',
    );

    expect(timeline.batch.id).toBe(batchId);
    expect(timeline.sources).toHaveLength(1);
    expect(
      timeline.sources[0]?.listingEvents.some(
        (event) => event.event_type === 'waste_uploaded',
      ),
    ).toBe(true);
    expect(timeline.chain_summary.waste_sources).toEqual([
      {
        listingId,
        householdCity: 'Bandung',
        weightKg: 118,
        uploadedAt: '2026-06-17T09:00:00.000Z',
      },
    ]);
    expect(timeline.chain_summary.collection).toMatchObject({
      collectorName: 'Eco Collect Bandung',
      pickedUpAt: '2026-06-18T16:00:00.000Z',
      routeId,
    });
    expect(timeline.chain_summary.processing.batchCreatedAt).toBe(
      '2026-06-19T12:00:00.000Z',
    );
    expect(timeline.chain_summary.market.listedAt).toBe(
      '2026-06-20T08:00:00.000Z',
    );
    expect(timeline.chain_summary.transaction).toMatchObject({
      agreedPricePerKg: 5200,
      completedAt: '2026-06-22T10:00:00.000Z',
    });
    expect(timeline.sources[0]?.listing).not.toHaveProperty('household_id');
    expect(timeline.chain_summary.waste_sources[0]).not.toHaveProperty(
      'address',
    );
  });

  it('denies material timeline access to industry users without an order', async () => {
    await expect(
      service.getMaterialTrackTimeline(batchId, otherIndustryId, 'industry'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns order timeline with linked batch events for authorized collector', async () => {
    const timeline = await service.getOrderTrackTimeline(
      orderId,
      collectorId,
      'collector',
    );

    expect(timeline.order.id).toBe(orderId);
    expect(timeline.orderEvents.map((event) => event.event_type)).toEqual([
      'order_created',
      'deal_accepted',
      'transaction_completed',
    ]);
    expect(timeline.batch.id).toBe(batchId);
    expect(timeline.batchEvents.map((event) => event.event_type)).toEqual([
      'material_batch_created',
      'material_listed',
    ]);
  });

  it('allows household owners to view waste listing journey', async () => {
    const journey = await service.getWasteTrackJourney(
      listingId,
      householdId,
      'household',
    );

    expect(journey.listing.id).toBe(listingId);
    expect(
      journey.events.some((event) => event.event_type === 'picked_up'),
    ).toBe(true);
    expect(journey.materialBatches[0]?.batchId).toBe(batchId);
    expect(journey.materialBatches[0]?.batchEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ event_type: 'material_batch_created' }),
      ]),
    );
  });

  it('allows any role to view completed waste listing journeys', async () => {
    const journey = await service.getWasteTrackJourney(
      listingId,
      otherIndustryId,
      'industry',
    );

    expect(journey.listing.status).toBe('converted_to_material');
    expect(journey.listing).not.toHaveProperty('household_id');
  });
});
