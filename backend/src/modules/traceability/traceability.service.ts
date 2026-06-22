import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import type { UserRole } from '../profiles/profiles.types';
import type {
  EmitEventDto,
  EntityTimeline,
  MaterialBatchTimelineSummary,
  MaterialChainSummary,
  MaterialOrderTimelineEntry,
  MaterialSourceTimelineEntry,
  MaterialTimeline,
  MaterialTrackTimeline,
  OrderTimelineSummary,
  OrderTrackTimeline,
  TraceabilityEvent,
  TraceabilityEventType,
  WasteListingJourney,
  WasteListingTimelineSummary,
} from './traceability.types';

interface TraceabilityEventRow {
  id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  actor_id: string | null;
  actor_role: string | null;
  previous_status: string | null;
  new_status: string | null;
  metadata: Record<string, unknown> | null;
  linked_entity_type: string | null;
  linked_entity_id: string | null;
  created_at: string;
}

interface MaterialBatchRow {
  id: string;
  collector_id: string;
  category_id: string;
  name: string;
  status: string;
  total_weight_kg: number | string;
  price_per_kg: number | string;
  published_at: string | null;
  sold_at: string | null;
  created_at: string;
}

interface WasteListingRow {
  id: string;
  household_id: string;
  category_id: string;
  title: string;
  status: string;
  estimated_weight_kg: number | string;
  actual_weight_kg: number | string | null;
  city: string | null;
  claimed_by: string | null;
  sorted_at: string | null;
  picked_up_at: string | null;
  created_at: string;
}

interface OrderRow {
  id: string;
  industry_id: string;
  collector_id: string;
  batch_id: string;
  status: string;
  requested_weight_kg: number | string;
  final_weight_kg: number | string | null;
  final_price_per_kg: number | string | null;
  total_amount: number | string | null;
  created_at: string;
}

interface BatchSourceRow {
  listing_id: string;
}

const EVENT_SELECT = `
  id,
  event_type,
  entity_type,
  entity_id,
  actor_id,
  actor_role,
  previous_status,
  new_status,
  metadata,
  linked_entity_type,
  linked_entity_id,
  created_at
`;

@Injectable()
export class TraceabilityService {
  private readonly logger = new Logger(TraceabilityService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  emitEvent(dto: EmitEventDto): void {
    void this.persistEvent(dto).catch((error: unknown) => {
      this.logger.error(
        `Failed to emit traceability event '${dto.eventType}' for ${dto.entityType}:${dto.entityId}`,
        error instanceof Error ? error.stack : String(error),
      );
    });
  }

  async getEntityTimeline(
    entityType: string,
    entityId: string,
  ): Promise<EntityTimeline> {
    const events = await this.fetchEventsByEntity(entityType, entityId);

    return {
      entityType,
      entityId,
      events,
    };
  }

  async getMaterialTimeline(batchId: string): Promise<MaterialTimeline> {
    const batch = await this.fetchMaterialBatch(batchId);

    if (!batch) {
      throw new NotFoundException({
        error: 'Material batch not found',
        code: 'MATERIAL_BATCH_NOT_FOUND',
      });
    }

    const batchEvents = await this.fetchEventsByEntity(
      'material_batch',
      batchId,
    );
    const sourceListingIds = await this.fetchBatchSourceListingIds(batchId);
    const listingMap = await this.fetchListingMap(sourceListingIds);
    const sources: MaterialSourceTimelineEntry[] = [];

    for (const listingId of sourceListingIds) {
      const listing = listingMap.get(listingId);

      if (!listing) {
        continue;
      }

      const listingEvents = await this.fetchEventsByEntity(
        'waste_listing',
        listingId,
      );

      sources.push({
        listing: this.mapListingSummary(listing),
        listingEvents,
      });
    }

    const orders = await this.fetchOrdersForBatch(batchId);
    const orderEntries: MaterialOrderTimelineEntry[] = [];

    for (const order of orders) {
      const orderEvents = await this.fetchOrderTimelineEvents(order.id);
      orderEntries.push({
        order: this.mapOrderSummary(order),
        orderEvents,
      });
    }

    return {
      batch: this.mapBatchSummary(batch),
      batchEvents,
      sources,
      orders: orderEntries,
    };
  }

  async getWasteListingJourney(
    listingId: string,
  ): Promise<WasteListingJourney> {
    const listing = await this.fetchListingById(listingId);

    if (!listing) {
      throw new NotFoundException({
        error: 'Waste listing not found',
        code: 'LISTING_NOT_FOUND',
      });
    }

    const events = await this.fetchEventsByEntity('waste_listing', listingId);
    const batchIds = await this.fetchBatchIdsForListing(listingId);
    const materialBatches = await Promise.all(
      batchIds.map(async (batchId) => ({
        batchId,
        batchEvents: await this.fetchEventsByEntity('material_batch', batchId),
      })),
    );

    return {
      listing: this.mapListingSummary(listing),
      events,
      materialBatches,
    };
  }

  async getMaterialTrackTimeline(
    batchId: string,
    requesterId: string,
    role: UserRole,
  ): Promise<MaterialTrackTimeline> {
    const timeline = await this.getMaterialTimeline(batchId);

    if (
      !this.canAccessMaterialTimeline(
        timeline.batch,
        timeline.orders,
        requesterId,
        role,
      )
    ) {
      throw new NotFoundException({
        error: 'Material batch not found',
        code: 'MATERIAL_BATCH_NOT_FOUND',
      });
    }

    const collectorName = await this.fetchCollectorDisplayName(
      timeline.batch.collector_id,
    );
    const transactionCompletedAt = await this.fetchLatestTransactionCompletedAt(
      timeline.orders.map((entry) => entry.order.id),
    );
    const chainSummary = this.buildChainSummary(
      timeline,
      collectorName,
      transactionCompletedAt,
    );
    const sanitizedSources = timeline.sources.map((source) => ({
      ...source,
      listing: this.sanitizeListingSummary(source.listing, role),
    }));

    return {
      ...timeline,
      sources: sanitizedSources,
      chain_summary: chainSummary,
    };
  }

  async getWasteTrackJourney(
    listingId: string,
    requesterId: string,
    role: UserRole,
  ): Promise<WasteListingJourney> {
    const listing = await this.fetchListingById(listingId);

    if (!listing) {
      throw new NotFoundException({
        error: 'Waste listing not found',
        code: 'LISTING_NOT_FOUND',
      });
    }

    if (!(await this.canAccessWasteJourney(listing, requesterId, role))) {
      throw new NotFoundException({
        error: 'Waste listing not found',
        code: 'LISTING_NOT_FOUND',
      });
    }

    const journey = await this.getWasteListingJourney(listingId);

    return {
      ...journey,
      listing: this.sanitizeListingSummary(journey.listing, role),
    };
  }

  async getOrderTrackTimeline(
    orderId: string,
    requesterId: string,
    role: UserRole,
  ): Promise<OrderTrackTimeline> {
    const order = await this.fetchOrderById(orderId);

    if (!order || !this.canAccessOrder(order, requesterId, role)) {
      throw new NotFoundException({
        error: 'Order not found',
        code: 'ORDER_NOT_FOUND',
      });
    }

    const batch = await this.fetchMaterialBatch(order.batch_id);

    if (!batch) {
      throw new InternalServerErrorException({
        error: 'Linked material batch not found for order traceability',
        code: 'MATERIAL_BATCH_LOAD_FAILED',
      });
    }

    const [orderEvents, batchEvents] = await Promise.all([
      this.fetchOrderTimelineEvents(orderId),
      this.fetchEventsByEntity('material_batch', order.batch_id),
    ]);

    return {
      order: this.mapOrderSummary(order),
      orderEvents,
      batch: this.mapBatchSummary(batch),
      batchEvents,
    };
  }

  private async persistEvent(dto: EmitEventDto): Promise<void> {
    try {
      const admin = this.supabaseService.getAdminClient();
      const { error } = await admin.from('traceability_events').insert({
        event_type: dto.eventType,
        entity_type: dto.entityType,
        entity_id: dto.entityId,
        actor_id: dto.actorId ?? null,
        actor_role: dto.actorRole ?? null,
        previous_status: dto.previousStatus ?? null,
        new_status: dto.newStatus ?? null,
        metadata: dto.metadata ?? {},
        linked_entity_type: dto.linkedEntityType ?? null,
        linked_entity_id: dto.linkedEntityId ?? null,
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      this.logger.error(
        `Traceability persist failed for '${dto.eventType}'`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  private async fetchEventsByEntity(
    entityType: string,
    entityId: string,
  ): Promise<TraceabilityEvent[]> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('traceability_events')
      .select(EVENT_SELECT)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to load traceability events',
        code: 'TRACEABILITY_EVENTS_LOAD_FAILED',
        details: error.message,
      });
    }

    return (data ?? []).map((row) => this.mapEvent(row));
  }

  private async fetchEventsLinkedToEntity(
    linkedEntityType: string,
    linkedEntityId: string,
  ): Promise<TraceabilityEvent[]> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('traceability_events')
      .select(EVENT_SELECT)
      .eq('linked_entity_type', linkedEntityType)
      .eq('linked_entity_id', linkedEntityId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to load linked traceability events',
        code: 'TRACEABILITY_EVENTS_LOAD_FAILED',
        details: error.message,
      });
    }

    return (data ?? []).map((row) => this.mapEvent(row));
  }

  private async fetchOrderTimelineEvents(
    orderId: string,
  ): Promise<TraceabilityEvent[]> {
    const [entityEvents, linkedEvents] = await Promise.all([
      this.fetchEventsByEntity('order', orderId),
      this.fetchEventsLinkedToEntity('order', orderId),
    ]);

    return this.mergeEventsChronologically(entityEvents, linkedEvents);
  }

  private mergeEventsChronologically(
    ...eventGroups: TraceabilityEvent[][]
  ): TraceabilityEvent[] {
    const uniqueEvents = new Map<string, TraceabilityEvent>();

    for (const events of eventGroups) {
      for (const event of events) {
        uniqueEvents.set(event.id, event);
      }
    }

    return [...uniqueEvents.values()].sort((left, right) =>
      left.created_at.localeCompare(right.created_at),
    );
  }

  private async fetchMaterialBatch(
    batchId: string,
  ): Promise<MaterialBatchRow | null> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('material_batches')
      .select(
        'id, collector_id, category_id, name, status, total_weight_kg, price_per_kg, published_at, sold_at, created_at',
      )
      .eq('id', batchId)
      .maybeSingle<MaterialBatchRow>();

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to load material batch for traceability',
        code: 'MATERIAL_BATCH_LOAD_FAILED',
        details: error.message,
      });
    }

    return data;
  }

  private async fetchBatchSourceListingIds(batchId: string): Promise<string[]> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('material_batch_sources')
      .select('listing_id')
      .eq('batch_id', batchId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to load material batch sources for traceability',
        code: 'BATCH_SOURCES_LOAD_FAILED',
        details: error.message,
      });
    }

    return (data ?? []).map((row: BatchSourceRow) => row.listing_id);
  }

  private async fetchListingMap(
    listingIds: string[],
  ): Promise<Map<string, WasteListingRow>> {
    if (listingIds.length === 0) {
      return new Map();
    }

    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('waste_listings')
      .select(
        'id, household_id, category_id, title, status, estimated_weight_kg, actual_weight_kg, city, claimed_by, sorted_at, picked_up_at, created_at',
      )
      .in('id', listingIds);

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to load waste listings for traceability',
        code: 'LISTING_LOAD_FAILED',
        details: error.message,
      });
    }

    return new Map((data ?? []).map((listing) => [listing.id, listing]));
  }

  private async fetchListingById(
    listingId: string,
  ): Promise<WasteListingRow | null> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('waste_listings')
      .select(
        'id, household_id, category_id, title, status, estimated_weight_kg, actual_weight_kg, city, claimed_by, sorted_at, picked_up_at, created_at',
      )
      .eq('id', listingId)
      .maybeSingle<WasteListingRow>();

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to load waste listing for traceability',
        code: 'LISTING_LOAD_FAILED',
        details: error.message,
      });
    }

    return data;
  }

  private async fetchOrdersForBatch(batchId: string): Promise<OrderRow[]> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('orders')
      .select(
        'id, industry_id, collector_id, batch_id, status, requested_weight_kg, final_weight_kg, final_price_per_kg, total_amount, created_at',
      )
      .eq('batch_id', batchId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to load orders for traceability',
        code: 'ORDER_LOAD_FAILED',
        details: error.message,
      });
    }

    return data ?? [];
  }

  private async fetchBatchIdsForListing(listingId: string): Promise<string[]> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('material_batch_sources')
      .select('batch_id')
      .eq('listing_id', listingId);

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to load linked material batches for listing',
        code: 'BATCH_SOURCES_LOAD_FAILED',
        details: error.message,
      });
    }

    return (data ?? []).map((row: { batch_id: string }) => row.batch_id);
  }

  private async fetchOrderById(orderId: string): Promise<OrderRow | null> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('orders')
      .select(
        'id, industry_id, collector_id, batch_id, status, requested_weight_kg, final_weight_kg, final_price_per_kg, total_amount, created_at',
      )
      .eq('id', orderId)
      .maybeSingle<OrderRow>();

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to load order for traceability',
        code: 'ORDER_LOAD_FAILED',
        details: error.message,
      });
    }

    return data;
  }

  private async fetchCollectorDisplayName(
    collectorId: string,
  ): Promise<string | null> {
    const admin = this.supabaseService.getAdminClient();
    const [profileResult, collectorResult] = await Promise.all([
      admin
        .from('user_profiles')
        .select('display_name')
        .eq('id', collectorId)
        .maybeSingle<{ display_name: string }>(),
      admin
        .from('collector_profiles')
        .select('business_name')
        .eq('id', collectorId)
        .maybeSingle<{ business_name: string | null }>(),
    ]);

    if (profileResult.error || collectorResult.error) {
      this.logger.warn(
        `Failed to load collector display name for ${collectorId}`,
      );
      return null;
    }

    return (
      collectorResult.data?.business_name?.trim() ||
      profileResult.data?.display_name?.trim() ||
      null
    );
  }

  private async fetchLatestTransactionCompletedAt(
    orderIds: string[],
  ): Promise<string | null> {
    if (orderIds.length === 0) {
      return null;
    }

    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('traceability_events')
      .select('created_at')
      .eq('event_type', 'transaction_completed')
      .in('linked_entity_id', orderIds)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      this.logger.warn(
        'Failed to load transaction_completed traceability events',
      );
      return null;
    }

    const row = data?.[0] as { created_at: string } | undefined;
    return row?.created_at ?? null;
  }

  private canAccessMaterialTimeline(
    batch: MaterialBatchTimelineSummary,
    orders: MaterialOrderTimelineEntry[],
    requesterId: string,
    role: UserRole,
  ): boolean {
    if (role === 'collector' && batch.collector_id === requesterId) {
      return true;
    }

    if (role === 'industry') {
      return orders.some((entry) => entry.order.industry_id === requesterId);
    }

    return false;
  }

  private async canAccessWasteJourney(
    listing: WasteListingRow,
    requesterId: string,
    role: UserRole,
  ): Promise<boolean> {
    if (role === 'household' && listing.household_id === requesterId) {
      return true;
    }

    if (role === 'collector' && listing.claimed_by === requesterId) {
      return true;
    }

    return this.isListingJourneyCompleted(listing);
  }

  private async isListingJourneyCompleted(
    listing: WasteListingRow,
  ): Promise<boolean> {
    if (listing.status === 'converted_to_material') {
      return true;
    }

    const batchIds = await this.fetchBatchIdsForListing(listing.id);

    for (const batchId of batchIds) {
      const orders = await this.fetchOrdersForBatch(batchId);

      if (orders.some((order) => order.status === 'completed')) {
        return true;
      }
    }

    return false;
  }

  private canAccessOrder(
    order: OrderRow,
    requesterId: string,
    role: UserRole,
  ): boolean {
    if (role === 'industry') {
      return order.industry_id === requesterId;
    }

    if (role === 'collector') {
      return order.collector_id === requesterId;
    }

    return false;
  }

  private buildChainSummary(
    timeline: MaterialTimeline,
    collectorName: string | null,
    transactionCompletedAt: string | null,
  ): MaterialChainSummary {
    const wasteSources = timeline.sources.map((source) => ({
      listingId: source.listing.id,
      householdCity: source.listing.city,
      weightKg:
        source.listing.actual_weight_kg ?? source.listing.estimated_weight_kg,
      uploadedAt: this.findEventTimestamp(
        source.listingEvents,
        'waste_uploaded',
      ),
    }));

    const allListingEvents = timeline.sources.flatMap(
      (source) => source.listingEvents,
    );
    const pickedUpEvent = this.findLatestEvent(allListingEvents, 'picked_up');
    const allOrderEvents = timeline.orders.flatMap(
      (entry) => entry.orderEvents,
    );
    const dealAcceptedEvent = this.findLatestEvent(
      allOrderEvents,
      'deal_accepted',
    );
    const completedOrder = timeline.orders.find(
      (entry) => entry.order.status === 'completed',
    );

    return {
      waste_sources: wasteSources,
      collection: {
        collectorName,
        pickedUpAt:
          pickedUpEvent?.created_at ??
          timeline.sources
            .map((source) => source.listing.picked_up_at)
            .find(
              (timestamp) => timestamp !== null && timestamp !== undefined,
            ) ??
          null,
        routeId: pickedUpEvent?.linked_entity_id ?? null,
      },
      processing: {
        sortedAt:
          timeline.sources
            .map((source) => source.listing.sorted_at)
            .find(
              (timestamp) => timestamp !== null && timestamp !== undefined,
            ) ??
          timeline.sources
            .map((source) =>
              this.findEventTimestamp(
                source.listingEvents,
                'sorted_by_collector',
              ),
            )
            .find((timestamp) => timestamp !== null) ??
          null,
        batchCreatedAt:
          this.findEventTimestamp(
            timeline.batchEvents,
            'material_batch_created',
          ) ?? timeline.batch.created_at,
      },
      market: {
        listedAt:
          timeline.batch.published_at ??
          this.findEventTimestamp(timeline.batchEvents, 'material_listed'),
        orderedAt: this.findEventTimestamp(allOrderEvents, 'order_created'),
      },
      transaction: {
        agreedPricePerKg:
          this.readNumericMetadata(dealAcceptedEvent, 'pricePerKg') ??
          completedOrder?.order.final_price_per_kg ??
          null,
        completedAt:
          transactionCompletedAt ??
          (completedOrder ? timeline.batch.sold_at : null),
      },
    };
  }

  private sanitizeListingSummary(
    summary: WasteListingTimelineSummary,
    viewerRole: UserRole,
  ): WasteListingTimelineSummary {
    if (viewerRole === 'industry') {
      return {
        id: summary.id,
        category_id: summary.category_id,
        title: summary.title,
        status: summary.status,
        estimated_weight_kg: summary.estimated_weight_kg,
        actual_weight_kg: summary.actual_weight_kg,
        city: summary.city,
        picked_up_at: summary.picked_up_at,
        sorted_at: summary.sorted_at,
        created_at: summary.created_at,
      };
    }

    return summary;
  }

  private findEventTimestamp(
    events: TraceabilityEvent[],
    eventType: TraceabilityEventType,
  ): string | null {
    return (
      events.find((event) => event.event_type === eventType)?.created_at ?? null
    );
  }

  private findLatestEvent(
    events: TraceabilityEvent[],
    eventType: TraceabilityEventType,
  ): TraceabilityEvent | null {
    const matches = events.filter((event) => event.event_type === eventType);

    if (matches.length === 0) {
      return null;
    }

    return matches[matches.length - 1] ?? null;
  }

  private findLatestEventTimestamp(
    events: TraceabilityEvent[],
    eventType: TraceabilityEventType,
  ): string | null {
    return this.findLatestEvent(events, eventType)?.created_at ?? null;
  }

  private readNumericMetadata(
    event: TraceabilityEvent | null,
    key: string,
  ): number | null {
    if (!event) {
      return null;
    }

    const value = event.metadata[key];

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }

  private mapEvent(row: TraceabilityEventRow): TraceabilityEvent {
    return {
      id: row.id,
      event_type: row.event_type as TraceabilityEvent['event_type'],
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      actor_id: row.actor_id,
      actor_role: row.actor_role,
      previous_status: row.previous_status,
      new_status: row.new_status,
      metadata: row.metadata ?? {},
      linked_entity_type: row.linked_entity_type,
      linked_entity_id: row.linked_entity_id,
      created_at: row.created_at,
    };
  }

  private mapBatchSummary(row: MaterialBatchRow): MaterialBatchTimelineSummary {
    return {
      id: row.id,
      collector_id: row.collector_id,
      category_id: row.category_id,
      name: row.name,
      status: row.status,
      total_weight_kg: Number(row.total_weight_kg),
      price_per_kg: Number(row.price_per_kg),
      published_at: row.published_at,
      sold_at: row.sold_at,
      created_at: row.created_at,
    };
  }

  private mapListingSummary(row: WasteListingRow): WasteListingTimelineSummary {
    return {
      id: row.id,
      household_id: row.household_id,
      category_id: row.category_id,
      title: row.title,
      status: row.status,
      estimated_weight_kg: Number(row.estimated_weight_kg),
      actual_weight_kg:
        row.actual_weight_kg === null ? null : Number(row.actual_weight_kg),
      city: row.city,
      picked_up_at: row.picked_up_at,
      sorted_at: row.sorted_at,
      created_at: row.created_at,
    };
  }

  private mapOrderSummary(row: OrderRow): OrderTimelineSummary {
    return {
      id: row.id,
      industry_id: row.industry_id,
      collector_id: row.collector_id,
      batch_id: row.batch_id,
      status: row.status,
      requested_weight_kg: Number(row.requested_weight_kg),
      final_weight_kg:
        row.final_weight_kg === null ? null : Number(row.final_weight_kg),
      final_price_per_kg:
        row.final_price_per_kg === null ? null : Number(row.final_price_per_kg),
      total_amount: row.total_amount === null ? null : Number(row.total_amount),
      created_at: row.created_at,
    };
  }
}
