import { BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { AuditService } from '../notifications/audit.service';
import { NotificationService } from '../notifications/notification.service';
import { NegotiationService } from './negotiation.service';
import { TraceabilityService } from '../traceability/traceability.service';

type Row = Record<string, unknown>;

interface NegotiationTestStore {
  orders: Row[];
  batches: Row[];
  threads: Row[];
  messages: Row[];
  offers: Row[];
  nextId: number;
}

function nextId(store: NegotiationTestStore): string {
  store.nextId += 1;
  return `${String(store.nextId).padStart(8, '0')}-0000-0000-0000-000000000000`;
}

function matches(row: Row, filters: Filter[]): boolean {
  return filters.every((filter) => {
    if (filter.op === 'eq') {
      return row[filter.column] === filter.value;
    }

    if (filter.op === 'neq') {
      return row[filter.column] !== filter.value;
    }

    if (filter.op === 'lt') {
      return String(row[filter.column]) < String(filter.value);
    }

    return true;
  });
}

interface Filter {
  column: string;
  op: 'eq' | 'neq' | 'lt';
  value: unknown;
}

const TABLE_MAP: Record<string, keyof NegotiationTestStore> = {
  orders: 'orders',
  material_batches: 'batches',
  negotiation_threads: 'threads',
  negotiation_messages: 'messages',
  negotiation_offers: 'offers',
};

class QueryBuilder {
  private filters: Filter[] = [];
  private orderBy: { column: string; ascending: boolean } | null = null;
  private limitValue: number | null = null;

  constructor(
    private readonly store: NegotiationTestStore,
    private readonly tableName: string,
    private readonly operation: 'select' | 'insert' | 'update' | 'delete',
    private payload: Row | Row[] | null = null,
  ) {}

  select(): this {
    return this;
  }

  insert(payload: Row | Row[]): this {
    this.payload = payload;
    return this;
  }

  update(payload: Row): this {
    this.payload = payload;
    return this;
  }

  delete(): this {
    return this;
  }

  eq(column: string, value: unknown): this {
    this.filters.push({ column, op: 'eq', value });
    return this;
  }

  neq(column: string, value: unknown): this {
    this.filters.push({ column, op: 'neq', value });
    return this;
  }

  lt(column: string, value: unknown): this {
    this.filters.push({ column, op: 'lt', value });
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

  single<T>(): Promise<{ data: T | null; error: null }> {
    return this.maybeSingle<T>().then((result) => {
      if (!result.data) {
        return { data: null, error: null };
      }

      return { data: result.data, error: null };
    });
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
          updated_at: row.updated_at ?? new Date().toISOString(),
          metadata: row.metadata ?? {},
          ...row,
        };
        rows.push(record);
        return record;
      });

      return inserted;
    }

    if (this.operation === 'update') {
      const updated: Row[] = [];

      for (const row of rows) {
        if (!matches(row, this.filters)) {
          continue;
        }

        Object.assign(row, this.payload ?? {}, {
          updated_at: new Date().toISOString(),
        });
        updated.push({ ...row });
      }

      return updated;
    }

    if (this.operation === 'delete') {
      const remaining = rows.filter((row) => !matches(row, this.filters));
      const deleted = rows.filter((row) => matches(row, this.filters));
      const key = TABLE_MAP[this.tableName];
      if (!key || key === 'nextId') {
        return deleted;
      }
      const storeRows = this.store[key];
      storeRows.length = 0;
      storeRows.push(...remaining);
      return deleted;
    }

    let selected = rows.filter((row) => matches(row, this.filters));

    if (this.orderBy) {
      selected = [...selected].sort((left, right) => {
        const leftValue = String(left[this.orderBy!.column]);
        const rightValue = String(right[this.orderBy!.column]);
        const comparison = leftValue.localeCompare(rightValue);
        return this.orderBy!.ascending ? comparison : -comparison;
      });
    }

    if (this.limitValue !== null) {
      selected = selected.slice(0, this.limitValue);
    }

    return selected.map((row) => ({ ...row }));
  }
}

function createNegotiationSupabaseMock(
  store: NegotiationTestStore,
): SupabaseService {
  const client = {
    from: (table: string) => ({
      select: () => new QueryBuilder(store, table, 'select').select(),
      insert: (payload: Row | Row[]) =>
        new QueryBuilder(store, table, 'insert', payload),
      update: (payload: Row) =>
        new QueryBuilder(store, table, 'update', payload),
      delete: () => new QueryBuilder(store, table, 'delete'),
    }),
  };

  return {
    getAdminClient: () => client,
  } as unknown as SupabaseService;
}

describe('NegotiationService integration flow', () => {
  const orderId = '10000000-0000-0000-0000-000000000001';
  const industryId = '11111111-1111-1111-1111-111111111111';
  const collectorId = '22222222-2222-2222-2222-222222222222';
  const batchId = '33333333-3333-3333-3333-333333333333';

  let store: NegotiationTestStore;
  let service: NegotiationService;
  let auditLogMock: jest.Mock;
  let notificationMock: jest.Mock;
  let traceEmitMock: jest.Mock;

  beforeEach(() => {
    store = {
      nextId: 100,
      orders: [
        {
          id: orderId,
          industry_id: industryId,
          collector_id: collectorId,
          batch_id: batchId,
          status: 'created',
          requested_weight_kg: 50,
          offered_price_per_kg: 3400,
        },
      ],
      batches: [
        {
          id: batchId,
          status: 'ordered',
          total_weight_kg: 100,
          min_order_kg: 10,
        },
      ],
      threads: [],
      messages: [],
      offers: [],
    };

    auditLogMock = jest.fn();
    notificationMock = jest.fn();
    traceEmitMock = jest.fn();

    service = new NegotiationService(
      createNegotiationSupabaseMock(store),
      {
        emitEvent: traceEmitMock,
      } as unknown as TraceabilityService,
      {
        logAction: auditLogMock,
      } as unknown as AuditService,
      {
        createNotification: notificationMock,
      } as unknown as NotificationService,
    );
  });

  it('start creates thread and system message', async () => {
    const thread = await service.startNegotiation(orderId, industryId);

    expect(thread.status).toBe('open');
    expect(thread.messages).toHaveLength(1);
    expect(thread.messages[0]?.message_type).toBe('system');
    expect(thread.messages[0]?.content).toBe('Negosiasi dimulai');
    expect(store.orders[0]?.status).toBe('negotiating');
    expect(auditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'negotiation.started',
        actorId: industryId,
      }),
    );
  });

  it('industry offer appears in thread messages and offers', async () => {
    const started = await service.startNegotiation(orderId, industryId);

    const afterOffer = await service.sendOffer(
      started.id,
      industryId,
      'industry',
      { price_per_kg: 3300, weight_kg: 45 },
    );

    expect(
      afterOffer.messages.some((message) => message.message_type === 'offer'),
    ).toBe(true);
    expect(afterOffer.offers).toHaveLength(1);
    expect(afterOffer.offers[0]?.status).toBe('pending');
    expect(afterOffer.offers[0]?.price_per_kg).toBe(3300);
    expect(auditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'negotiation.offer_sent',
        actorId: industryId,
      }),
    );
    expect(notificationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: collectorId,
        type: 'negotiation_offer',
      }),
    );
  });

  it('collector counter marks previous offer as countered', async () => {
    const started = await service.startNegotiation(orderId, industryId);
    await service.sendOffer(started.id, industryId, 'industry', {
      price_per_kg: 3300,
      weight_kg: 45,
    });

    const afterCounter = await service.sendOffer(
      started.id,
      collectorId,
      'collector',
      { price_per_kg: 3350, weight_kg: 42 },
    );

    const statuses = afterCounter.offers.map((offer) => offer.status);
    expect(statuses).toContain('countered');
    expect(statuses).toContain('pending');
    expect(
      afterCounter.messages.some((m) => m.message_type === 'counter_offer'),
    ).toBe(true);
  });

  it('cannot accept own offer', async () => {
    const started = await service.startNegotiation(orderId, industryId);
    await service.sendOffer(started.id, industryId, 'industry', {
      price_per_kg: 3300,
      weight_kg: 45,
    });

    await expect(
      service.acceptOffer(started.id, industryId),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('accept sets thread and order to accepted', async () => {
    const started = await service.startNegotiation(orderId, industryId);
    await service.sendOffer(started.id, industryId, 'industry', {
      price_per_kg: 3300,
      weight_kg: 45,
    });

    const accepted = await service.acceptOffer(started.id, collectorId);

    expect(accepted.status).toBe('accepted');
    expect(accepted.agreed_price_per_kg).toBe(3300);
    expect(accepted.agreed_weight_kg).toBe(45);
    expect(store.orders[0]?.status).toBe('accepted');
    expect(store.orders[0]?.final_price_per_kg).toBe(3300);
    expect(auditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'negotiation.accepted',
        actorId: collectorId,
      }),
    );
    expect(
      notificationMock.mock.calls.filter(
        ([input]) =>
          (input as { type?: string }).type === 'negotiation_accepted',
      ),
    ).toHaveLength(2);
    expect(traceEmitMock).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'deal_accepted',
      }),
    );
  });

  it('cancel restores batch to available', async () => {
    const started = await service.startNegotiation(orderId, industryId);

    const cancelled = await service.cancelNegotiation(started.id, industryId, {
      reason: 'Jadwal bentrok',
    });

    expect(cancelled.status).toBe('cancelled');
    expect(store.orders[0]?.status).toBe('cancelled');
    expect(store.batches[0]?.status).toBe('available');
    expect(auditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'negotiation.cancelled',
        actorId: industryId,
      }),
    );
  });

  it('expired thread rejects new offers', async () => {
    const started = await service.startNegotiation(orderId, industryId);
    const thread = store.threads.find((row) => row.id === started.id);
    thread!.expires_at = '2020-01-01T00:00:00.000Z';

    await expect(
      service.sendOffer(started.id, industryId, 'industry', {
        price_per_kg: 3300,
        weight_kg: 45,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('getNegotiationHistory returns chronological messages and offers', async () => {
    const started = await service.startNegotiation(orderId, industryId);
    await service.sendOffer(started.id, industryId, 'industry', {
      price_per_kg: 3300,
      weight_kg: 45,
    });
    await service.sendOffer(started.id, collectorId, 'collector', {
      price_per_kg: 3350,
      weight_kg: 42,
    });

    const history = await service.getNegotiationHistory(orderId, collectorId);

    expect(history.messages.length).toBeGreaterThanOrEqual(3);
    const messageTimes = history.messages.map((message) => message.created_at);
    expect(messageTimes).toEqual([...messageTimes].sort());
    expect(history.offers).toHaveLength(2);
    expect(history.offers[0]?.created_at <= history.offers[1].created_at).toBe(
      true,
    );
  });

  it('emits audit log for text messages', async () => {
    const started = await service.startNegotiation(orderId, industryId);

    await service.sendTextMessage(started.id, industryId, {
      content: 'Bisa dikirim besok?',
    });

    expect(auditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'negotiation.text_message_sent',
        actorId: industryId,
        entityId: started.id,
      }),
    );
  });
});
