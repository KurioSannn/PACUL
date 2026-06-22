export type UserRole = "household" | "collector" | "industry";

export type WasteListingStatus =
  | "draft"
  | "available"
  | "claimed"
  | "pickup_planned"
  | "picked_up"
  | "sorting"
  | "sorted"
  | "converted_to_material"
  | "cancelled";

export interface WasteCategory {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon_key: string | null;
  unit: string;
  typical_price_per_kg: number | null;
  ai_model_class: string | null;
  sort_order: number;
}

export interface WasteListingImage {
  id: string;
  listing_id: string;
  image_path: string;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

export interface WasteListing {
  id: string;
  household_id: string;
  category_id: string;
  classification_id: string | null;
  title: string;
  description: string | null;
  estimated_weight_kg: number;
  actual_weight_kg: number | null;
  status: WasteListingStatus;
  address: string;
  latitude: number;
  longitude: number;
  district: string | null;
  city: string | null;
  province: string | null;
  available_from: string | null;
  available_until: string | null;
  notes: string | null;
  pickup_fee: number;
  claimed_by: string | null;
  claimed_at: string | null;
  picked_up_at: string | null;
  sorted_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface WasteListingWithDetails extends WasteListing {
  category: WasteCategory;
  images: WasteListingImage[];
}

export interface PaginatedWasteListings {
  items: WasteListingWithDetails[];
  page: number;
  limit: number;
  total: number;
}

export interface CollectorAvailableWasteListing {
  id: string;
  title: string;
  description: string | null;
  estimated_weight_kg: number;
  status: "available";
  city: string | null;
  district: string | null;
  province: string | null;
  latitude: number;
  longitude: number;
  available_from: string | null;
  available_until: string | null;
  pickup_fee: number;
  created_at: string;
  category: WasteCategory;
  household_display_name: string;
  images: WasteListingImage[];
  distance_km: number | null;
}

export interface PaginatedCollectorAvailableWaste {
  items: CollectorAvailableWasteListing[];
  page: number;
  limit: number;
  total: number;
}

export type MaterialBatchStatus =
  | "draft"
  | "available"
  | "ordered"
  | "negotiating"
  | "sold"
  | "unavailable";

export interface MaterialBatch {
  id: string;
  collector_id: string;
  category_id: string;
  name: string;
  description: string | null;
  total_weight_kg: number;
  price_per_kg: number;
  min_order_kg: number;
  status: MaterialBatchStatus;
  location_address: string | null;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  province: string | null;
  available_from: string | null;
  available_until: string | null;
  notes: string | null;
  published_at: string | null;
  sold_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MaterialBatchMarketplaceItem extends MaterialBatch {
  category: { id: string; code: string; name: string; unit: string };
  collector: { display_name: string; rating_average: number };
}

export interface PaginatedMaterialMarketplace {
  items: MaterialBatchMarketplaceItem[];
  page: number;
  limit: number;
  total: number;
}

export type OrderStatus =
  | "created"
  | "negotiating"
  | "accepted"
  | "rejected"
  | "cancelled"
  | "completed";

export interface OrderBatchSummary {
  id: string;
  name: string;
  category_id: string;
  total_weight_kg: number;
  price_per_kg: number;
  min_order_kg: number;
  status: string;
  city: string | null;
  province: string | null;
}

export interface OrderRecord {
  id: string;
  industry_id: string;
  collector_id: string;
  batch_id: string;
  requested_weight_kg: number;
  final_weight_kg: number | null;
  offered_price_per_kg: number;
  final_price_per_kg: number | null;
  total_amount: number | null;
  status: OrderStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  accepted_at: string | null;
  rejected_at: string | null;
  cancelled_at: string | null;
  completed_at: string | null;
  cancel_reason: string | null;
}

export interface OrderWithDetails extends OrderRecord {
  batch: OrderBatchSummary;
}

export type NegotiationThreadStatus =
  | "open"
  | "countered"
  | "accepted"
  | "cancelled"
  | "expired";

export interface NegotiationThread {
  id: string;
  order_id: string;
  industry_id: string;
  collector_id: string;
  status: NegotiationThreadStatus;
  last_offer_by: string | null;
  last_offer_price_per_kg: number | null;
  last_offer_weight_kg: number | null;
  agreed_price_per_kg: number | null;
  agreed_weight_kg: number | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NegotiationMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  message_type: "text" | "offer" | "counter_offer" | "system" | "accepted" | "cancelled";
  content: string | null;
  offer_price_per_kg: number | null;
  offer_weight_kg: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface NegotiationOffer {
  id: string;
  thread_id: string;
  message_id: string | null;
  offered_by: string;
  price_per_kg: number;
  weight_kg: number;
  status: string;
  created_at: string;
}

export interface NegotiationThreadWithDetails extends NegotiationThread {
  messages: NegotiationMessage[];
  offers: NegotiationOffer[];
}

export interface PickupClaim {
  id: string;
  listing_id: string;
  collector_id: string;
  status: string;
  claimed_at: string;
  updated_at: string;
}

export interface PickupRoute {
  id: string;
  collector_id: string;
  title: string;
  status: string;
  total_distance_km: number | null;
  estimated_duration_minutes: number | null;
  estimated_cost: number | null;
  created_at: string;
  updated_at: string;
}

export interface MeResponse {
  id: string;
  email: string;
  role: UserRole;
  display_name: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  profile: Record<string, unknown>;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown>;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface NotificationListResult {
  items: NotificationItem[];
  unread_count: number;
}

export interface PointsSummary {
  user_id: string;
  total_points: number;
  entry_count: number;
  by_event_type: Record<string, number>;
  recent: Array<{
    id: string;
    points: number;
    event_type: string;
    description: string | null;
    created_at: string;
  }>;
}

export interface PlatformImpact {
  total_waste_submitted_kg: number;
  total_waste_collected_kg: number;
  total_material_produced_kg: number;
  total_material_sold_kg: number;
  total_transactions: number;
  total_transaction_value_idr: number;
  total_pickups_completed: number;
  total_route_distance_km: number;
  total_route_cost_idr: number;
  estimated_co2_saved_kg: number;
  estimated_economic_value_idr: number;
  active_households: number;
  active_collectors: number;
  active_industries: number;
}

export interface LocalImpactLocation {
  city: string;
  province: string | null;
  total_waste_collected_kg: number;
  total_material_sold_kg: number;
  estimated_co2_saved_kg: number;
  listing_count: number;
  pickup_count: number;
}

export interface LocalImpact {
  totals: {
    total_waste_collected_kg: number;
    total_material_sold_kg: number;
    estimated_co2_saved_kg: number;
    location_count: number;
  };
  locations: LocalImpactLocation[];
}

export interface TraceabilityEvent {
  id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  title: string;
  detail: string | null;
  occurred_at: string;
}

export interface AiClassificationResult {
  id: string;
  top_class: string;
  confidence: number;
  db_category_id: string | null;
  is_mock: boolean;
  model_version: string;
  inference_time_ms: number;
  is_overridden: boolean;
}

export interface ReportExportRecord {
  id: string;
  report_type: string;
  format: string;
  status: string;
  created_at: string;
  expires_at: string | null;
}

export interface TransactionRecord {
  id: string;
  order_id: string;
  industry_id: string;
  collector_id: string;
  batch_id: string;
  amount: number;
  status: string;
  payment_method: string;
  payment_reference: string | null;
  notes: string | null;
  simulated_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
}

export interface RatingSummary {
  actor_id: string;
  average_rating: number;
  rating_count: number;
}

export interface DashboardRatingSummary {
  average: number;
  count: number;
}

export interface HouseholdSummary {
  role: "household";
  counts: {
    total_listings: number;
    active_listings: number;
    waiting_pickup: number;
    picked_up: number;
    completed: number;
    cancelled: number;
  };
  weights: {
    total_estimated_kg: number;
    total_actual_kg: number;
    collected_kg: number;
  };
  costs: { total_pickup_fees_idr: number };
  ratings: DashboardRatingSummary;
  recent_listings: Array<{
    id: string;
    title: string;
    status: string;
    estimated_weight_kg: number;
    actual_weight_kg: number | null;
    city: string | null;
    created_at: string;
  }>;
}

export interface CollectorSummary {
  role: "collector";
  counts: {
    active_claims: number;
    planned_routes: number;
    ongoing_routes: number;
    available_batches: number;
    completed_pickups: number;
  };
  weights: { total_kg_collected: number; material_stock_kg: number };
  distances: { total_route_distance_km: number; today_planned_distance_km: number };
  costs: { total_estimated_route_cost_idr: number; today_estimated_route_cost_idr: number };
  ratings: DashboardRatingSummary;
  recent_claims: Array<{ id: string; listing_id: string; status: string; claimed_at: string }>;
  recent_routes: Array<{
    id: string;
    status: string;
    total_distance_km: number;
    total_weight_kg: number;
    estimated_cost: number;
    created_at: string;
  }>;
  recent_material_batches: Array<{
    id: string;
    name: string;
    status: string;
    total_weight_kg: number;
    price_per_kg: number;
    city: string | null;
    created_at: string;
  }>;
}

export interface IndustrySummary {
  role: "industry";
  counts: {
    active_orders: number;
    open_negotiations: number;
    completed_orders: number;
    available_material_batches: number;
  };
  weights: { total_purchased_kg: number; pending_order_kg: number };
  costs: { total_transaction_value_idr: number; pending_order_value_idr: number };
  ratings: DashboardRatingSummary;
  recent_orders: Array<{
    id: string;
    status: string;
    requested_weight_kg: number;
    total_amount: number | null;
    batch_name: string | null;
    created_at: string;
  }>;
  recent_negotiations: Array<{
    id: string;
    order_id: string;
    status: string;
    last_offer_price_per_kg: number | null;
    updated_at: string;
  }>;
}

export type DashboardSummary = HouseholdSummary | CollectorSummary | IndustrySummary;

export interface MaterialMarketListing {
  id: string;
  batch_id: string;
  collector_id: string;
  category_id: string;
  title: string;
  quality_grade: string;
  specifications: Record<string, unknown>;
  photos: string[];
  asking_price_per_kg: number;
  available_weight_kg: number;
  status: "active" | "sold" | "withdrawn";
  view_count: number;
  created_at: string;
  updated_at: string;
}
