import type { TraceabilityEntityType } from '../traceability/traceability.types';

export const POINT_EVENT_TYPES = [
  'listing_published',
  'pickup_completed',
  'material_batch_created',
  'material_published',
  'transaction_completed',
  'rating_submitted',
  'first_time_bonus',
] as const;

export type PointEventType = (typeof POINT_EVENT_TYPES)[number];

/**
 * Points awarded per business event. Values are product/demo decisions, not a
 * monetary equivalence. Tune freely without touching ledger logic.
 */
export const POINT_VALUES: Record<PointEventType, number> = {
  listing_published: 10,
  pickup_completed: 25,
  material_batch_created: 15,
  material_published: 20,
  transaction_completed: 50,
  rating_submitted: 5,
  first_time_bonus: 100,
};

export interface AwardPointsInput {
  userId: string;
  eventType: PointEventType;
  entityType: TraceabilityEntityType;
  entityId: string;
  description?: string;
  points?: number;
}

export interface PointLedgerEntry {
  id: string;
  user_id: string;
  points: number;
  event_type: PointEventType;
  entity_type: string | null;
  entity_id: string | null;
  description: string | null;
  created_at: string;
}

export interface UserPoints {
  user_id: string;
  total_points: number;
  entry_count: number;
}

export interface UserPointsSummary extends UserPoints {
  by_event_type: Record<string, number>;
  recent: PointLedgerEntry[];
}
