import { SupabaseService } from '../../src/supabase/supabase.service';

export type Row = Record<string, unknown>;

export interface SupabaseMockStore {
  nextId: number;
  waste_categories: Row[];
  waste_listings: Row[];
  waste_listing_images: Row[];
  collector_handled_categories: Row[];
  collector_profiles: Row[];
  user_profiles: Row[];
  pickup_claims: Row[];
  material_batches: Row[];
  material_batch_sources: Row[];
  orders: Row[];
  negotiation_threads: Row[];
  negotiation_messages: Row[];
  negotiation_offers: Row[];
  traceability_events: Row[];
  report_exports: Row[];
  transactions: Row[];
  [key: string]: Row[] | number;
}

interface Filter {
  column: string;
  op: 'eq' | 'neq' | 'lt' | 'in' | 'ilike';
  value: unknown;
}

function nextRowId(store: SupabaseMockStore): string {
  store.nextId += 1;
  return `${String(store.nextId).padStart(8, '0')}-0000-0000-0000-000000000000`;
}

function tableRows(store: SupabaseMockStore, tableName: string): Row[] {
  const rows = store[tableName];
  return Array.isArray(rows) ? rows : [];
}

function setTableRows(
  store: SupabaseMockStore,
  tableName: string,
  rows: Row[],
): void {
  store[tableName] = rows;
}

function cellToString(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return String(value);
  }
  return JSON.stringify(value);
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
    if (filter.op === 'in') {
      return (
        Array.isArray(filter.value) && filter.value.includes(row[filter.column])
      );
    }
    if (filter.op === 'ilike') {
      const pattern = String(filter.value).replace(/%/g, '');
      return cellToString(row[filter.column])
        .toLowerCase()
        .includes(pattern.toLowerCase());
    }
    return true;
  });
}

function enrichRow(store: SupabaseMockStore, tableName: string, row: Row): Row {
  const enriched = { ...row };

  if (tableName === 'waste_listings') {
    enriched.category =
      tableRows(store, 'waste_categories').find(
        (item) => item.id === row.category_id,
      ) ?? null;
    enriched.images = tableRows(store, 'waste_listing_images').filter(
      (item) => item.listing_id === row.id,
    );
    enriched.household =
      tableRows(store, 'user_profiles').find(
        (item) => item.id === row.household_id,
      ) ?? null;
  }

  if (tableName === 'orders') {
    enriched.batch =
      tableRows(store, 'material_batches').find(
        (item) => item.id === row.batch_id,
      ) ?? null;
  }

  if (tableName === 'material_batches') {
    enriched.category =
      tableRows(store, 'waste_categories').find(
        (item) => item.id === row.category_id,
      ) ?? null;
    enriched.collector =
      tableRows(store, 'user_profiles').find(
        (item) => item.id === row.collector_id,
      ) ?? null;
    enriched.collector_profile = { rating_average: 4.5 };
  }

  return enriched;
}

class QueryBuilder {
  private filters: Filter[] = [];
  private orderBy: { column: string; ascending: boolean } | null = null;
  private limitValue: number | null = null;
  private rangeFrom: number | null = null;
  private rangeTo: number | null = null;
  private countExact = false;
  private wantsSelect = false;

  constructor(
    private readonly store: SupabaseMockStore,
    private readonly tableName: string,
    private operation: 'select' | 'insert' | 'update' | 'delete',
    private payload: Row | Row[] | null = null,
  ) {}

  select(_columns?: string, options?: { count?: 'exact' }): this {
    this.wantsSelect = true;
    if (options?.count === 'exact') {
      this.countExact = true;
    }
    return this;
  }

  insert(payload: Row | Row[]): QueryBuilder {
    return new QueryBuilder(this.store, this.tableName, 'insert', payload);
  }

  update(payload: Row): QueryBuilder {
    return new QueryBuilder(this.store, this.tableName, 'update', payload);
  }

  delete(): QueryBuilder {
    return new QueryBuilder(this.store, this.tableName, 'delete');
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

  in(column: string, value: unknown[]): this {
    this.filters.push({ column, op: 'in', value });
    return this;
  }

  ilike(column: string, value: string): this {
    this.filters.push({ column, op: 'ilike', value });
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

  range(from: number, to: number): this {
    this.rangeFrom = from;
    this.rangeTo = to;
    return this;
  }

  single<T>(): Promise<{ data: T | null; error: null }> {
    return this.maybeSingle<T>();
  }

  maybeSingle<T>(): Promise<{ data: T | null; error: null }> {
    const rows = this.executeRows();
    return Promise.resolve({
      data: (rows.rows[0] as T | undefined) ?? null,
      error: null,
    });
  }

  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?:
      | ((value: QueryResult) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(this.buildResult()).then(onfulfilled, onrejected);
  }

  private buildResult(): QueryResult {
    if (
      (this.operation === 'delete' || this.operation === 'update') &&
      !this.wantsSelect
    ) {
      this.executeRows();
      return { data: null, error: null };
    }

    if (this.operation === 'insert' && !this.wantsSelect) {
      this.executeRows();
      return { data: null, error: null };
    }

    const { rows, totalCount } = this.executeRows();
    return {
      data: rows,
      error: null,
      count: this.countExact ? totalCount : undefined,
    };
  }

  private executeRows(): { rows: Row[]; totalCount: number } {
    const rows = tableRows(this.store, this.tableName);

    if (this.operation === 'insert') {
      const payload = Array.isArray(this.payload)
        ? this.payload
        : [this.payload ?? {}];
      const inserted = payload.map((row) => {
        const record = {
          ...row,
          id: row.id ?? nextRowId(this.store),
          created_at: row.created_at ?? new Date().toISOString(),
          updated_at: row.updated_at ?? new Date().toISOString(),
          pickup_fee: row.pickup_fee ?? 0,
          actual_weight_kg: row.actual_weight_kg ?? null,
          metadata: row.metadata ?? {},
        };
        rows.push(record);
        return enrichRow(this.store, this.tableName, record);
      });
      return { rows: inserted, totalCount: inserted.length };
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
        updated.push(enrichRow(this.store, this.tableName, { ...row }));
      }
      return { rows: updated, totalCount: updated.length };
    }

    if (this.operation === 'delete') {
      const remaining = rows.filter((row) => !matches(row, this.filters));
      const deleted = rows.filter((row) => matches(row, this.filters));
      setTableRows(this.store, this.tableName, remaining);
      return { rows: deleted, totalCount: deleted.length };
    }

    let selected = rows.filter((row) => matches(row, this.filters));

    if (this.orderBy) {
      selected = [...selected].sort((left, right) => {
        const leftValue = cellToString(left[this.orderBy!.column]);
        const rightValue = cellToString(right[this.orderBy!.column]);
        const comparison = leftValue.localeCompare(rightValue);
        return this.orderBy!.ascending ? comparison : -comparison;
      });
    }

    const totalCount = selected.length;

    if (this.rangeFrom !== null && this.rangeTo !== null) {
      selected = selected.slice(this.rangeFrom, this.rangeTo + 1);
    }

    if (this.limitValue !== null) {
      selected = selected.slice(0, this.limitValue);
    }

    return {
      rows: selected.map((row) =>
        enrichRow(this.store, this.tableName, { ...row }),
      ),
      totalCount,
    };
  }
}

interface QueryResult {
  data: Row[] | null;
  error: null;
  count?: number;
}

function createTableClient(store: SupabaseMockStore, tableName: string) {
  return {
    select: (columns?: string, options?: { count?: 'exact' }) =>
      new QueryBuilder(store, tableName, 'select').select(columns, options),
    insert: (payload: Row | Row[]) =>
      new QueryBuilder(store, tableName, 'insert', payload),
    update: (payload: Row) =>
      new QueryBuilder(store, tableName, 'update', payload),
    delete: () => new QueryBuilder(store, tableName, 'delete'),
  };
}

export function createEmptyStore(): SupabaseMockStore {
  return {
    nextId: 100,
    waste_categories: [],
    waste_listings: [],
    waste_listing_images: [],
    collector_handled_categories: [],
    collector_profiles: [],
    user_profiles: [],
    pickup_claims: [],
    material_batches: [],
    material_batch_sources: [],
    orders: [],
    negotiation_threads: [],
    negotiation_messages: [],
    negotiation_offers: [],
    traceability_events: [],
    report_exports: [],
    transactions: [],
  };
}

export function createSupabaseMock(store: SupabaseMockStore): SupabaseService {
  const client = {
    from: (tableName: string) => createTableClient(store, tableName),
    storage: {
      from: () => ({
        upload: () =>
          Promise.resolve({
            data: { path: 'reports/mock.pdf' },
            error: null,
          }),
        createSignedUrl: () =>
          Promise.resolve({
            data: { signedUrl: 'https://example.com/signed' },
            error: null,
          }),
      }),
    },
  };

  return {
    getAdminClient: () => client,
    getClientForToken: () => client,
    getUserFromToken: () => Promise.resolve(null),
  } as unknown as SupabaseService;
}

export function seedCollectorCategories(
  store: SupabaseMockStore,
  collectorId: string,
  categoryIds: string[],
): void {
  for (const categoryId of categoryIds) {
    store.collector_handled_categories.push({
      collector_id: collectorId,
      category_id: categoryId,
      is_active: true,
    });
  }
}
