export const TRACEABILITY_EVENT_TYPES = [
  'waste_uploaded',
  'ai_classified',
  'listing_published',
  'pickup_claimed',
  'route_created',
  'picked_up',
  'sorted_by_collector',
  'material_batch_created',
  'material_listed',
  'order_created',
  'negotiation_started',
  'offer_sent',
  'counter_offer_sent',
  'deal_accepted',
  'transaction_completed',
  'rating_submitted',
  'report_exported',
  'ai_classification_overridden',
  'listing_cancelled',
  'order_cancelled',
] as const;

export type TraceabilityEventType = (typeof TRACEABILITY_EVENT_TYPES)[number];

export const TRACEABILITY_ENTITY_TYPES = [
  'waste_listing',
  'ai_classification',
  'pickup_claim',
  'pickup_route',
  'pickup_route_stop',
  'material_batch',
  'order',
  'negotiation_thread',
  'transaction',
] as const;

export type TraceabilityEntityType = (typeof TRACEABILITY_ENTITY_TYPES)[number];

export interface EmitEventDto {
  eventType: TraceabilityEventType;
  entityType: TraceabilityEntityType;
  entityId: string;
  actorId?: string | null;
  actorRole?: string | null;
  previousStatus?: string | null;
  newStatus?: string | null;
  metadata?: Record<string, unknown>;
  linkedEntityType?: string | null;
  linkedEntityId?: string | null;
}

export interface TraceabilityEvent {
  id: string;
  event_type: TraceabilityEventType;
  entity_type: string;
  entity_id: string;
  actor_id: string | null;
  actor_role: string | null;
  previous_status: string | null;
  new_status: string | null;
  metadata: Record<string, unknown>;
  linked_entity_type: string | null;
  linked_entity_id: string | null;
  created_at: string;
}

export interface EntityTimeline {
  entityType: string;
  entityId: string;
  events: TraceabilityEvent[];
}

export interface MaterialBatchTimelineSummary {
  id: string;
  collector_id: string;
  category_id: string;
  name: string;
  status: string;
  total_weight_kg: number;
  price_per_kg: number;
  published_at: string | null;
  sold_at: string | null;
  created_at: string;
}

export interface WasteListingTimelineSummary {
  id: string;
  household_id?: string;
  category_id: string;
  title: string;
  status: string;
  estimated_weight_kg: number;
  actual_weight_kg: number | null;
  city: string | null;
  picked_up_at?: string | null;
  sorted_at?: string | null;
  created_at: string;
}

export interface OrderTimelineSummary {
  id: string;
  industry_id: string;
  collector_id: string;
  batch_id: string;
  status: string;
  requested_weight_kg: number;
  final_weight_kg: number | null;
  final_price_per_kg: number | null;
  total_amount: number | null;
  created_at: string;
}

export interface MaterialSourceTimelineEntry {
  listing: WasteListingTimelineSummary;
  listingEvents: TraceabilityEvent[];
}

export interface MaterialOrderTimelineEntry {
  order: OrderTimelineSummary;
  orderEvents: TraceabilityEvent[];
}

export interface MaterialTimeline {
  batch: MaterialBatchTimelineSummary;
  batchEvents: TraceabilityEvent[];
  sources: MaterialSourceTimelineEntry[];
  orders: MaterialOrderTimelineEntry[];
}

export interface MaterialChainWasteSource {
  listingId: string;
  householdCity: string | null;
  weightKg: number;
  uploadedAt: string | null;
}

export interface MaterialChainSummary {
  waste_sources: MaterialChainWasteSource[];
  collection: {
    collectorName: string | null;
    pickedUpAt: string | null;
    routeId: string | null;
  };
  processing: {
    sortedAt: string | null;
    batchCreatedAt: string | null;
  };
  market: {
    listedAt: string | null;
    orderedAt: string | null;
  };
  transaction: {
    agreedPricePerKg: number | null;
    completedAt: string | null;
  };
}

export interface MaterialTrackTimeline extends MaterialTimeline {
  chain_summary: MaterialChainSummary;
}

export interface WasteListingJourney {
  listing: WasteListingTimelineSummary;
  events: TraceabilityEvent[];
  materialBatches: Array<{
    batchId: string;
    batchEvents: TraceabilityEvent[];
  }>;
}

export interface OrderTrackTimeline {
  order: OrderTimelineSummary;
  orderEvents: TraceabilityEvent[];
  batch: MaterialBatchTimelineSummary;
  batchEvents: TraceabilityEvent[];
}
