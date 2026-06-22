export type PickupClaimStatus =
  | 'claimed'
  | 'pickup_planned'
  | 'picked_up'
  | 'cancelled';

export interface PickupClaim {
  id: string;
  listing_id: string;
  collector_id: string;
  status: PickupClaimStatus;
  claimed_at: string;
  pickup_scheduled_at: string | null;
  pickup_completed_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  route_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdatePickupClaimStatusData {
  pickup_scheduled_at?: string;
  notes?: string;
  cancel_reason?: string;
}
