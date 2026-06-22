import type { CostEstimationResult } from './cost-estimation.service';

export type PickupRouteStatus =
  | 'planned'
  | 'ongoing'
  | 'completed'
  | 'cancelled';

export type PickupRouteStopStatus =
  | 'pending'
  | 'arrived'
  | 'completed'
  | 'skipped';

export interface CollectorBaseCoordinates {
  latitude: number;
  longitude: number;
}

export interface RoutePreviewStop {
  listingId: string;
  sequenceNumber: number;
  distanceFromPreviousKm: number;
  latitude: number;
  longitude: number;
  estimated_weight_kg: number;
  address: string | null;
}

export interface RoutePreviewResult {
  collectorBase: CollectorBaseCoordinates;
  orderedStops: RoutePreviewStop[];
  totalDistanceKm: number;
  estimatedDurationMinutes: number;
  totalWeightKg: number;
  costEstimation: CostEstimationResult;
  isPreview: true;
  estimateId?: string | null;
}

export type RouteCostEstimateType = 'preview' | 'committed' | 'actual';

export interface PickupRouteStop {
  id: string;
  route_id: string;
  listing_id: string;
  sequence_number: number;
  distance_from_previous_km: number | null;
  estimated_arrival_minutes: number | null;
  status: PickupRouteStopStatus;
  arrived_at: string | null;
  completed_at: string | null;
  notes: string | null;
}

export interface PickupRoute {
  id: string;
  collector_id: string;
  status: PickupRouteStatus;
  total_distance_km: number;
  estimated_duration_minutes: number | null;
  total_weight_kg: number;
  estimated_cost: number;
  actual_cost: number | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  stops: PickupRouteStop[];
}
