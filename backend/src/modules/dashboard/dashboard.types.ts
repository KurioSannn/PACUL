export interface DashboardRatingSummary {
  average: number;
  count: number;
}

export interface HouseholdListingSummaryItem {
  id: string;
  title: string;
  status: string;
  estimated_weight_kg: number;
  actual_weight_kg: number | null;
  city: string | null;
  created_at: string;
}

export interface HouseholdSummaryCounts {
  total_listings: number;
  active_listings: number;
  waiting_pickup: number;
  picked_up: number;
  completed: number;
  cancelled: number;
}

export interface HouseholdSummaryWeights {
  total_estimated_kg: number;
  total_actual_kg: number;
  collected_kg: number;
}

export interface HouseholdSummaryCosts {
  total_pickup_fees_idr: number;
}

export interface HouseholdSummary {
  role: 'household';
  counts: HouseholdSummaryCounts;
  weights: HouseholdSummaryWeights;
  costs: HouseholdSummaryCosts;
  ratings: DashboardRatingSummary;
  recent_listings: HouseholdListingSummaryItem[];
}

export interface CollectorClaimSummaryItem {
  id: string;
  listing_id: string;
  status: string;
  claimed_at: string;
}

export interface CollectorRouteSummaryItem {
  id: string;
  status: string;
  total_distance_km: number;
  total_weight_kg: number;
  estimated_cost: number;
  created_at: string;
}

export interface CollectorMaterialSummaryItem {
  id: string;
  name: string;
  status: string;
  total_weight_kg: number;
  price_per_kg: number;
  city: string | null;
  created_at: string;
}

export interface CollectorSummaryCounts {
  active_claims: number;
  planned_routes: number;
  ongoing_routes: number;
  available_batches: number;
  completed_pickups: number;
}

export interface CollectorSummaryWeights {
  total_kg_collected: number;
  material_stock_kg: number;
}

export interface CollectorSummaryDistances {
  total_route_distance_km: number;
  today_planned_distance_km: number;
}

export interface CollectorSummaryCosts {
  total_estimated_route_cost_idr: number;
  today_estimated_route_cost_idr: number;
}

export interface CollectorSummary {
  role: 'collector';
  counts: CollectorSummaryCounts;
  weights: CollectorSummaryWeights;
  distances: CollectorSummaryDistances;
  costs: CollectorSummaryCosts;
  ratings: DashboardRatingSummary;
  recent_claims: CollectorClaimSummaryItem[];
  recent_routes: CollectorRouteSummaryItem[];
  recent_material_batches: CollectorMaterialSummaryItem[];
}

export interface IndustryOrderSummaryItem {
  id: string;
  status: string;
  requested_weight_kg: number;
  total_amount: number | null;
  batch_name: string | null;
  created_at: string;
}

export interface IndustryNegotiationSummaryItem {
  id: string;
  order_id: string;
  status: string;
  last_offer_price_per_kg: number | null;
  updated_at: string;
}

export interface IndustrySummaryCounts {
  active_orders: number;
  open_negotiations: number;
  completed_orders: number;
  available_material_batches: number;
}

export interface IndustrySummaryWeights {
  total_purchased_kg: number;
  pending_order_kg: number;
}

export interface IndustrySummaryCosts {
  total_transaction_value_idr: number;
  pending_order_value_idr: number;
}

export interface IndustrySummary {
  role: 'industry';
  counts: IndustrySummaryCounts;
  weights: IndustrySummaryWeights;
  costs: IndustrySummaryCosts;
  ratings: DashboardRatingSummary;
  recent_orders: IndustryOrderSummaryItem[];
  recent_negotiations: IndustryNegotiationSummaryItem[];
}

export type DashboardSummary =
  | HouseholdSummary
  | CollectorSummary
  | IndustrySummary;

/** Optional filters for platform-wide dashboard aggregates. */
export interface DashboardImpactFilters {
  from_date?: string;
  to_date?: string;
  city?: string;
  province?: string;
}

/** kg CO₂ avoided per kg of material sold (platform recycling estimate). */
export const CO2_SAVED_KG_PER_RECYCLED_KG = 2.5;

export interface PlatformImpactTopCategory {
  category_name: string;
  weight_kg: number;
  percentage: number;
}

export interface PlatformImpact {
  filters: DashboardImpactFilters;
  total_waste_submitted_kg: number;
  total_waste_collected_kg: number;
  total_material_produced_kg: number;
  total_material_sold_kg: number;
  total_transactions: number;
  total_transaction_value_idr: number;
  total_pickups_completed: number;
  total_route_distance_km: number;
  total_route_cost_idr: number;
  top_categories: PlatformImpactTopCategory[];
  /** `total_material_sold_kg * CO2_SAVED_KG_PER_RECYCLED_KG` (2.5 kg CO₂ per kg sold). */
  estimated_co2_saved_kg: number;
  estimated_economic_value_idr: number;
  active_households: number;
  active_collectors: number;
  active_industries: number;
}

export type MaterialFlowNodeType =
  | 'household'
  | 'collector'
  | 'material'
  | 'industry';

export interface MaterialFlowNode {
  id: MaterialFlowNodeType;
  label: string;
  type: MaterialFlowNodeType;
  value: number;
}

export interface MaterialFlowEdge {
  from: MaterialFlowNodeType;
  to: MaterialFlowNodeType;
  weight_kg: number;
  value_idr: number;
}

export interface MaterialFlowCategoryBreakdown {
  category_name: string;
  weight_kg_in: number;
  weight_kg_out: number;
}

/** Aggregate Sankey-style flow; no user-identifying fields. */
export interface MaterialFlow {
  filters: DashboardImpactFilters;
  nodes: MaterialFlowNode[];
  edges: MaterialFlowEdge[];
  categories_breakdown: MaterialFlowCategoryBreakdown[];
}

export interface RouteStatsCounts {
  total_routes: number;
  planned_routes: number;
  ongoing_routes: number;
  completed_routes: number;
  cancelled_routes: number;
}

export interface RouteStats {
  counts: RouteStatsCounts;
  total_distance_km: number;
  total_weight_kg: number;
  total_estimated_cost_idr: number;
  total_actual_cost_idr: number;
  average_distance_km: number;
  average_weight_kg: number;
}
