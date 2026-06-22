import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import {
  CO2_SAVED_KG_PER_RECYCLED_KG,
  type CollectorClaimSummaryItem,
  type CollectorMaterialSummaryItem,
  type CollectorRouteSummaryItem,
  type CollectorSummary,
  type DashboardImpactFilters,
  type DashboardRatingSummary,
  type HouseholdListingSummaryItem,
  type HouseholdSummary,
  type IndustryNegotiationSummaryItem,
  type IndustryOrderSummaryItem,
  type IndustrySummary,
  type MaterialFlow,
  type MaterialFlowCategoryBreakdown,
  type MaterialFlowEdge,
  type MaterialFlowNode,
  type PlatformImpact,
  type PlatformImpactTopCategory,
  type RouteStats,
} from './dashboard.types';

const RECENT_LIST_LIMIT = 5;

const HOUSEHOLD_ACTIVE_STATUSES = new Set([
  'draft',
  'available',
  'claimed',
  'pickup_planned',
]);
const HOUSEHOLD_WAITING_PICKUP_STATUSES = new Set([
  'claimed',
  'pickup_planned',
]);
const HOUSEHOLD_PICKED_UP_STATUSES = new Set([
  'picked_up',
  'sorting',
  'sorted',
]);
const HOUSEHOLD_COMPLETED_STATUSES = new Set(['converted_to_material']);
const HOUSEHOLD_COLLECTED_STATUSES = new Set([
  'picked_up',
  'sorting',
  'sorted',
  'converted_to_material',
]);

const COLLECTOR_ACTIVE_CLAIM_STATUSES = new Set(['claimed', 'pickup_planned']);
const COLLECTOR_MATERIAL_STOCK_STATUSES = new Set([
  'draft',
  'available',
  'ordered',
  'negotiating',
]);

const INDUSTRY_ACTIVE_ORDER_STATUSES = new Set([
  'created',
  'negotiating',
  'accepted',
]);
const INDUSTRY_OPEN_NEGOTIATION_STATUSES = new Set(['open', 'countered']);

const PLATFORM_LISTING_COLLECTED_STATUSES = new Set([
  'picked_up',
  'sorting',
  'sorted',
  'converted_to_material',
]);

const PLATFORM_MATERIAL_PRODUCED_STATUSES = new Set([
  'available',
  'ordered',
  'negotiating',
  'sold',
  'unavailable',
]);

const COMPLETED_TRANSACTION_STATUSES = new Set(['simulated_paid', 'completed']);

interface HouseholdListingAggregateRow {
  status: string;
  estimated_weight_kg: number | string;
  actual_weight_kg: number | string | null;
  pickup_fee: number | string;
}

interface HouseholdListingRecentRow {
  id: string;
  title: string;
  status: string;
  estimated_weight_kg: number | string;
  actual_weight_kg: number | string | null;
  city: string | null;
  created_at: string;
}

interface RatingRow {
  rating: number;
}

interface CollectorProfileRow {
  rating_average: number | string;
  rating_count: number;
  total_pickups: number;
  total_kg_collected: number | string;
}

interface PickupClaimAggregateRow {
  status: string;
}

interface PickupRouteAggregateRow {
  status: string;
  total_distance_km: number | string;
  estimated_cost: number | null;
  created_at: string;
}

interface PickupRouteRecentRow {
  id: string;
  status: string;
  total_distance_km: number | string;
  total_weight_kg: number | string | null;
  estimated_cost: number | null;
  created_at: string;
}

interface MaterialBatchAggregateRow {
  status: string;
  total_weight_kg: number | string;
}

interface MaterialBatchRecentRow {
  id: string;
  name: string;
  status: string;
  total_weight_kg: number | string;
  price_per_kg: number | string;
  city: string | null;
  created_at: string;
}

interface IndustryProfileRow {
  rating_average: number | string;
  rating_count: number;
  total_orders: number;
}

interface OrderAggregateRow {
  status: string;
  requested_weight_kg: number | string;
  final_weight_kg: number | string | null;
  total_amount: number | string | null;
}

interface OrderRecentRow {
  id: string;
  status: string;
  requested_weight_kg: number | string;
  total_amount: number | string | null;
  created_at: string;
  batch: { name: string } | { name: string }[] | null;
}

interface NegotiationAggregateRow {
  status: string;
}

interface NegotiationRecentRow {
  id: string;
  order_id: string;
  status: string;
  last_offer_price_per_kg: number | string | null;
  updated_at: string;
}

interface ImpactListingRow {
  status: string;
  estimated_weight_kg: number | string;
  actual_weight_kg: number | string | null;
  category: { name: string } | { name: string }[] | null;
}

interface ImpactMaterialBatchRow {
  status: string;
  total_weight_kg: number | string;
  category: { name: string } | { name: string }[] | null;
}

interface ImpactTransactionRow {
  amount: number | string;
  status: string;
}

interface ImpactPickupClaimRow {
  status: string;
  pickup_completed_at: string | null;
}

interface ImpactRouteRow {
  status: string;
  total_distance_km: number | string;
  total_weight_kg?: number | string | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  created_at: string;
}

interface RouteStopRouteIdRow {
  route_id: string;
}

interface ActiveUserCountRow {
  role: string;
}

@Injectable()
export class DashboardService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getHouseholdSummary(householdId: string): Promise<HouseholdSummary> {
    const [listingRows, recentListings, ratings] = await Promise.all([
      this.fetchHouseholdListingAggregates(householdId),
      this.fetchHouseholdRecentListings(householdId),
      this.fetchReceivedRatings(householdId),
    ]);

    const counts = {
      total_listings: listingRows.length,
      active_listings: 0,
      waiting_pickup: 0,
      picked_up: 0,
      completed: 0,
      cancelled: 0,
    };
    const weights = {
      total_estimated_kg: 0,
      total_actual_kg: 0,
      collected_kg: 0,
    };
    let totalPickupFees = 0;

    for (const row of listingRows) {
      const status = row.status;
      const estimatedWeight = Number(row.estimated_weight_kg);
      const actualWeight =
        row.actual_weight_kg === null ? null : Number(row.actual_weight_kg);

      if (HOUSEHOLD_ACTIVE_STATUSES.has(status)) {
        counts.active_listings += 1;
      }
      if (HOUSEHOLD_WAITING_PICKUP_STATUSES.has(status)) {
        counts.waiting_pickup += 1;
      }
      if (HOUSEHOLD_PICKED_UP_STATUSES.has(status)) {
        counts.picked_up += 1;
      }
      if (HOUSEHOLD_COMPLETED_STATUSES.has(status)) {
        counts.completed += 1;
      }
      if (status === 'cancelled') {
        counts.cancelled += 1;
      }

      weights.total_estimated_kg += estimatedWeight;
      if (actualWeight !== null) {
        weights.total_actual_kg += actualWeight;
      }
      if (HOUSEHOLD_COLLECTED_STATUSES.has(status)) {
        weights.collected_kg += actualWeight ?? estimatedWeight;
      }

      totalPickupFees += Number(row.pickup_fee);
    }

    return {
      role: 'household',
      counts,
      weights: {
        total_estimated_kg: roundWeight(weights.total_estimated_kg),
        total_actual_kg: roundWeight(weights.total_actual_kg),
        collected_kg: roundWeight(weights.collected_kg),
      },
      costs: {
        total_pickup_fees_idr: Math.round(totalPickupFees),
      },
      ratings,
      recent_listings: recentListings,
    };
  }

  async getCollectorSummary(collectorId: string): Promise<CollectorSummary> {
    const todayStart = startOfTodayIso();
    const [
      profile,
      claimRows,
      routeRows,
      batchRows,
      recentClaims,
      recentRoutes,
      recentBatches,
    ] = await Promise.all([
      this.fetchCollectorProfile(collectorId),
      this.fetchCollectorClaimAggregates(collectorId),
      this.fetchCollectorRouteAggregates(collectorId),
      this.fetchCollectorMaterialBatchAggregates(collectorId),
      this.fetchCollectorRecentClaims(collectorId),
      this.fetchCollectorRecentRoutes(collectorId),
      this.fetchCollectorRecentMaterialBatches(collectorId),
    ]);

    const counts = {
      active_claims: 0,
      planned_routes: 0,
      ongoing_routes: 0,
      available_batches: 0,
      completed_pickups: profile?.total_pickups ?? 0,
    };
    let materialStockKg = 0;

    for (const row of claimRows) {
      if (COLLECTOR_ACTIVE_CLAIM_STATUSES.has(row.status)) {
        counts.active_claims += 1;
      }
    }

    let totalRouteDistanceKm = 0;
    let todayPlannedDistanceKm = 0;
    let totalEstimatedRouteCost = 0;
    let todayEstimatedRouteCost = 0;

    for (const row of routeRows) {
      const distanceKm = Number(row.total_distance_km);
      const estimatedCost = row.estimated_cost ?? 0;
      const isTodayRoute = row.created_at >= todayStart;

      if (row.status === 'planned') {
        counts.planned_routes += 1;
      }
      if (row.status === 'ongoing') {
        counts.ongoing_routes += 1;
      }

      if (row.status !== 'cancelled') {
        totalRouteDistanceKm += distanceKm;
        totalEstimatedRouteCost += estimatedCost;
      }

      if (
        isTodayRoute &&
        (row.status === 'planned' || row.status === 'ongoing')
      ) {
        todayPlannedDistanceKm += distanceKm;
        todayEstimatedRouteCost += estimatedCost;
      }
    }

    for (const row of batchRows) {
      const weightKg = Number(row.total_weight_kg);

      if (row.status === 'available') {
        counts.available_batches += 1;
      }
      if (COLLECTOR_MATERIAL_STOCK_STATUSES.has(row.status)) {
        materialStockKg += weightKg;
      }
    }

    return {
      role: 'collector',
      counts,
      weights: {
        total_kg_collected: roundWeight(
          Number(profile?.total_kg_collected ?? 0),
        ),
        material_stock_kg: roundWeight(materialStockKg),
      },
      distances: {
        total_route_distance_km: roundDistance(totalRouteDistanceKm),
        today_planned_distance_km: roundDistance(todayPlannedDistanceKm),
      },
      costs: {
        total_estimated_route_cost_idr: Math.round(totalEstimatedRouteCost),
        today_estimated_route_cost_idr: Math.round(todayEstimatedRouteCost),
      },
      ratings: mapProfileRatings(profile),
      recent_claims: recentClaims,
      recent_routes: recentRoutes,
      recent_material_batches: recentBatches,
    };
  }

  async getIndustrySummary(industryId: string): Promise<IndustrySummary> {
    const [
      profile,
      orderRows,
      negotiationRows,
      availableMaterialCount,
      recentOrders,
      recentNegotiations,
    ] = await Promise.all([
      this.fetchIndustryProfile(industryId),
      this.fetchIndustryOrderAggregates(industryId),
      this.fetchIndustryNegotiationAggregates(industryId),
      this.fetchAvailableMaterialBatchCount(),
      this.fetchIndustryRecentOrders(industryId),
      this.fetchIndustryRecentNegotiations(industryId),
    ]);

    const counts = {
      active_orders: 0,
      open_negotiations: 0,
      completed_orders: profile?.total_orders ?? 0,
      available_material_batches: availableMaterialCount,
    };
    const weights = {
      total_purchased_kg: 0,
      pending_order_kg: 0,
    };
    const costs = {
      total_transaction_value_idr: 0,
      pending_order_value_idr: 0,
    };

    for (const row of orderRows) {
      const requestedWeight = Number(row.requested_weight_kg);
      const finalWeight =
        row.final_weight_kg === null ? null : Number(row.final_weight_kg);
      const totalAmount =
        row.total_amount === null ? null : Number(row.total_amount);

      if (INDUSTRY_ACTIVE_ORDER_STATUSES.has(row.status)) {
        counts.active_orders += 1;
        weights.pending_order_kg += requestedWeight;
        if (totalAmount !== null) {
          costs.pending_order_value_idr += totalAmount;
        }
      }

      if (row.status === 'completed') {
        weights.total_purchased_kg += finalWeight ?? requestedWeight;
        if (totalAmount !== null) {
          costs.total_transaction_value_idr += totalAmount;
        }
      }
    }

    for (const row of negotiationRows) {
      if (INDUSTRY_OPEN_NEGOTIATION_STATUSES.has(row.status)) {
        counts.open_negotiations += 1;
      }
    }

    return {
      role: 'industry',
      counts,
      weights: {
        total_purchased_kg: roundWeight(weights.total_purchased_kg),
        pending_order_kg: roundWeight(weights.pending_order_kg),
      },
      costs: {
        total_transaction_value_idr: Math.round(
          costs.total_transaction_value_idr,
        ),
        pending_order_value_idr: Math.round(costs.pending_order_value_idr),
      },
      ratings: mapProfileRatings(profile),
      recent_orders: recentOrders,
      recent_negotiations: recentNegotiations,
    };
  }

  async getPlatformImpact(
    filters: DashboardImpactFilters,
  ): Promise<PlatformImpact> {
    const [
      listingRows,
      batchRows,
      transactionRows,
      pickupClaimRows,
      routeRows,
      activeUsers,
    ] = await Promise.all([
      this.fetchImpactListings(filters),
      this.fetchImpactMaterialBatches(filters),
      this.fetchImpactTransactions(filters),
      this.fetchImpactPickupClaims(filters),
      this.fetchImpactRoutes(filters),
      this.fetchActiveUserCounts(),
    ]);

    let totalWasteSubmittedKg = 0;
    let totalWasteCollectedKg = 0;
    const categoryWeights = new Map<string, number>();

    for (const row of listingRows) {
      if (row.status === 'cancelled') {
        continue;
      }

      const estimatedWeight = Number(row.estimated_weight_kg);
      const actualWeight =
        row.actual_weight_kg === null ? null : Number(row.actual_weight_kg);
      const categoryName = unwrapJoinName(row.category) ?? 'Unknown';

      totalWasteSubmittedKg += estimatedWeight;

      if (PLATFORM_LISTING_COLLECTED_STATUSES.has(row.status)) {
        const collectedWeight = actualWeight ?? estimatedWeight;
        totalWasteCollectedKg += collectedWeight;
        categoryWeights.set(
          categoryName,
          (categoryWeights.get(categoryName) ?? 0) + collectedWeight,
        );
      }
    }

    let totalMaterialProducedKg = 0;
    let totalMaterialSoldKg = 0;

    for (const row of batchRows) {
      const weightKg = Number(row.total_weight_kg);

      if (PLATFORM_MATERIAL_PRODUCED_STATUSES.has(row.status)) {
        totalMaterialProducedKg += weightKg;
      }
      if (row.status === 'sold') {
        totalMaterialSoldKg += weightKg;
      }
    }

    let totalTransactions = 0;
    let totalTransactionValueIdr = 0;

    for (const row of transactionRows) {
      if (!COMPLETED_TRANSACTION_STATUSES.has(row.status)) {
        continue;
      }

      totalTransactions += 1;
      totalTransactionValueIdr += Number(row.amount);
    }

    let totalPickupsCompleted = 0;

    for (const row of pickupClaimRows) {
      if (row.status === 'picked_up') {
        totalPickupsCompleted += 1;
      }
    }

    let totalRouteDistanceKm = 0;
    let totalRouteCostIdr = 0;

    for (const row of routeRows) {
      if (row.status === 'cancelled') {
        continue;
      }

      totalRouteDistanceKm += Number(row.total_distance_km);
      totalRouteCostIdr += row.estimated_cost ?? 0;
    }

    const topCategories = buildTopCategories(
      categoryWeights,
      totalWasteCollectedKg,
    );
    const estimatedCo2SavedKg =
      totalMaterialSoldKg * CO2_SAVED_KG_PER_RECYCLED_KG;

    return {
      filters,
      total_waste_submitted_kg: roundWeight(totalWasteSubmittedKg),
      total_waste_collected_kg: roundWeight(totalWasteCollectedKg),
      total_material_produced_kg: roundWeight(totalMaterialProducedKg),
      total_material_sold_kg: roundWeight(totalMaterialSoldKg),
      total_transactions: totalTransactions,
      total_transaction_value_idr: Math.round(totalTransactionValueIdr),
      total_pickups_completed: totalPickupsCompleted,
      total_route_distance_km: roundDistance(totalRouteDistanceKm),
      total_route_cost_idr: Math.round(totalRouteCostIdr),
      top_categories: topCategories,
      estimated_co2_saved_kg: roundWeight(estimatedCo2SavedKg),
      estimated_economic_value_idr: Math.round(totalTransactionValueIdr),
      active_households: activeUsers.household,
      active_collectors: activeUsers.collector,
      active_industries: activeUsers.industry,
    };
  }

  async getMaterialFlow(
    filters: DashboardImpactFilters,
  ): Promise<MaterialFlow> {
    const [listingRows, batchRows, transactionRows] = await Promise.all([
      this.fetchImpactListings(filters),
      this.fetchImpactMaterialBatches(filters),
      this.fetchImpactTransactions(filters),
    ]);

    let householdSubmittedKg = 0;
    let collectorCollectedKg = 0;
    let materialProducedKg = 0;
    let industrySoldKg = 0;
    let industryValueIdr = 0;
    const categoryInWeights = new Map<string, number>();
    const categoryOutWeights = new Map<string, number>();

    for (const row of listingRows) {
      if (row.status === 'cancelled') {
        continue;
      }

      const estimatedWeight = Number(row.estimated_weight_kg);
      const actualWeight =
        row.actual_weight_kg === null ? null : Number(row.actual_weight_kg);
      const categoryName = unwrapJoinName(row.category) ?? 'Unknown';

      householdSubmittedKg += estimatedWeight;

      if (PLATFORM_LISTING_COLLECTED_STATUSES.has(row.status)) {
        const collectedWeight = actualWeight ?? estimatedWeight;
        collectorCollectedKg += collectedWeight;
        categoryInWeights.set(
          categoryName,
          (categoryInWeights.get(categoryName) ?? 0) + collectedWeight,
        );
      }
    }

    for (const row of batchRows) {
      const weightKg = Number(row.total_weight_kg);
      const categoryName = unwrapJoinName(row.category) ?? 'Unknown';

      if (PLATFORM_MATERIAL_PRODUCED_STATUSES.has(row.status)) {
        materialProducedKg += weightKg;
      }
      if (row.status === 'sold') {
        industrySoldKg += weightKg;
        categoryOutWeights.set(
          categoryName,
          (categoryOutWeights.get(categoryName) ?? 0) + weightKg,
        );
      }
    }

    for (const row of transactionRows) {
      if (!COMPLETED_TRANSACTION_STATUSES.has(row.status)) {
        continue;
      }

      industryValueIdr += Number(row.amount);
    }

    const nodes: MaterialFlowNode[] = [
      {
        id: 'household',
        label: 'Household waste',
        type: 'household',
        value: roundWeight(householdSubmittedKg),
      },
      {
        id: 'collector',
        label: 'Collector pickup',
        type: 'collector',
        value: roundWeight(collectorCollectedKg),
      },
      {
        id: 'material',
        label: 'Material batches',
        type: 'material',
        value: roundWeight(materialProducedKg),
      },
      {
        id: 'industry',
        label: 'Industry purchase',
        type: 'industry',
        value: roundWeight(industrySoldKg),
      },
    ];

    const edges: MaterialFlowEdge[] = [
      {
        from: 'household',
        to: 'collector',
        weight_kg: roundWeight(collectorCollectedKg),
        value_idr: 0,
      },
      {
        from: 'collector',
        to: 'material',
        weight_kg: roundWeight(materialProducedKg),
        value_idr: 0,
      },
      {
        from: 'material',
        to: 'industry',
        weight_kg: roundWeight(industrySoldKg),
        value_idr: Math.round(industryValueIdr),
      },
    ];

    const categoriesBreakdown = buildCategoryFlowBreakdown(
      categoryInWeights,
      categoryOutWeights,
    );

    return {
      filters,
      nodes,
      edges,
      categories_breakdown: categoriesBreakdown,
    };
  }

  async getRouteStats(collectorId: string): Promise<RouteStats> {
    const routeRows = await this.fetchCollectorRouteStatsRows(collectorId);

    const counts = {
      total_routes: routeRows.length,
      planned_routes: 0,
      ongoing_routes: 0,
      completed_routes: 0,
      cancelled_routes: 0,
    };
    let totalDistanceKm = 0;
    let totalWeightKg = 0;
    let totalEstimatedCostIdr = 0;
    let totalActualCostIdr = 0;
    let activeRouteCount = 0;

    for (const row of routeRows) {
      switch (row.status) {
        case 'planned':
          counts.planned_routes += 1;
          break;
        case 'ongoing':
          counts.ongoing_routes += 1;
          break;
        case 'completed':
          counts.completed_routes += 1;
          break;
        case 'cancelled':
          counts.cancelled_routes += 1;
          break;
      }

      if (row.status === 'cancelled') {
        continue;
      }

      activeRouteCount += 1;
      totalDistanceKm += Number(row.total_distance_km);
      totalWeightKg += Number(row.total_weight_kg ?? 0);
      totalEstimatedCostIdr += row.estimated_cost ?? 0;
      totalActualCostIdr += row.actual_cost ?? 0;
    }

    return {
      counts,
      total_distance_km: roundDistance(totalDistanceKm),
      total_weight_kg: roundWeight(totalWeightKg),
      total_estimated_cost_idr: Math.round(totalEstimatedCostIdr),
      total_actual_cost_idr: Math.round(totalActualCostIdr),
      average_distance_km:
        activeRouteCount > 0
          ? roundDistance(totalDistanceKm / activeRouteCount)
          : 0,
      average_weight_kg:
        activeRouteCount > 0
          ? roundWeight(totalWeightKg / activeRouteCount)
          : 0,
    };
  }

  private async fetchHouseholdListingAggregates(
    householdId: string,
  ): Promise<HouseholdListingAggregateRow[]> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('waste_listings')
      .select('status, estimated_weight_kg, actual_weight_kg, pickup_fee')
      .eq('household_id', householdId);

    if (error) {
      throw loadFailed('household listing aggregates', error.message);
    }

    return data ?? [];
  }

  private async fetchHouseholdRecentListings(
    householdId: string,
  ): Promise<HouseholdListingSummaryItem[]> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('waste_listings')
      .select(
        'id, title, status, estimated_weight_kg, actual_weight_kg, city, created_at',
      )
      .eq('household_id', householdId)
      .order('created_at', { ascending: false })
      .limit(RECENT_LIST_LIMIT);

    if (error) {
      throw loadFailed('household recent listings', error.message);
    }

    return (data ?? []).map((row: HouseholdListingRecentRow) => ({
      id: row.id,
      title: row.title,
      status: row.status,
      estimated_weight_kg: Number(row.estimated_weight_kg),
      actual_weight_kg:
        row.actual_weight_kg === null ? null : Number(row.actual_weight_kg),
      city: row.city,
      created_at: row.created_at,
    }));
  }

  private async fetchReceivedRatings(
    actorId: string,
  ): Promise<DashboardRatingSummary> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('ratings_reviews')
      .select('rating')
      .eq('ratee_id', actorId);

    if (error) {
      throw loadFailed('rating summary', error.message);
    }

    return aggregateRatings(data ?? []);
  }

  private async fetchCollectorProfile(
    collectorId: string,
  ): Promise<CollectorProfileRow | null> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('collector_profiles')
      .select('rating_average, rating_count, total_pickups, total_kg_collected')
      .eq('id', collectorId)
      .maybeSingle<CollectorProfileRow>();

    if (error) {
      throw loadFailed('collector profile', error.message);
    }

    return data;
  }

  private async fetchCollectorClaimAggregates(
    collectorId: string,
  ): Promise<PickupClaimAggregateRow[]> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('pickup_claims')
      .select('status')
      .eq('collector_id', collectorId);

    if (error) {
      throw loadFailed('collector claim aggregates', error.message);
    }

    return data ?? [];
  }

  private async fetchCollectorRouteAggregates(
    collectorId: string,
  ): Promise<PickupRouteAggregateRow[]> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('pickup_routes')
      .select('status, total_distance_km, estimated_cost, created_at')
      .eq('collector_id', collectorId);

    if (error) {
      throw loadFailed('collector route aggregates', error.message);
    }

    return data ?? [];
  }

  private async fetchCollectorMaterialBatchAggregates(
    collectorId: string,
  ): Promise<MaterialBatchAggregateRow[]> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('material_batches')
      .select('status, total_weight_kg')
      .eq('collector_id', collectorId);

    if (error) {
      throw loadFailed('collector material batch aggregates', error.message);
    }

    return data ?? [];
  }

  private async fetchCollectorRecentClaims(
    collectorId: string,
  ): Promise<CollectorClaimSummaryItem[]> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('pickup_claims')
      .select('id, listing_id, status, claimed_at')
      .eq('collector_id', collectorId)
      .order('claimed_at', { ascending: false })
      .limit(RECENT_LIST_LIMIT);

    if (error) {
      throw loadFailed('collector recent claims', error.message);
    }

    return data ?? [];
  }

  private async fetchCollectorRecentRoutes(
    collectorId: string,
  ): Promise<CollectorRouteSummaryItem[]> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('pickup_routes')
      .select(
        'id, status, total_distance_km, total_weight_kg, estimated_cost, created_at',
      )
      .eq('collector_id', collectorId)
      .order('created_at', { ascending: false })
      .limit(RECENT_LIST_LIMIT);

    if (error) {
      throw loadFailed('collector recent routes', error.message);
    }

    return (data ?? []).map((row: PickupRouteRecentRow) => ({
      id: row.id,
      status: row.status,
      total_distance_km: Number(row.total_distance_km),
      total_weight_kg: Number(row.total_weight_kg ?? 0),
      estimated_cost: row.estimated_cost ?? 0,
      created_at: row.created_at,
    }));
  }

  private async fetchCollectorRecentMaterialBatches(
    collectorId: string,
  ): Promise<CollectorMaterialSummaryItem[]> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('material_batches')
      .select(
        'id, name, status, total_weight_kg, price_per_kg, city, created_at',
      )
      .eq('collector_id', collectorId)
      .order('created_at', { ascending: false })
      .limit(RECENT_LIST_LIMIT);

    if (error) {
      throw loadFailed('collector recent material batches', error.message);
    }

    return (data ?? []).map((row: MaterialBatchRecentRow) => ({
      id: row.id,
      name: row.name,
      status: row.status,
      total_weight_kg: Number(row.total_weight_kg),
      price_per_kg: Number(row.price_per_kg),
      city: row.city,
      created_at: row.created_at,
    }));
  }

  private async fetchIndustryProfile(
    industryId: string,
  ): Promise<IndustryProfileRow | null> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('industry_profiles')
      .select('rating_average, rating_count, total_orders')
      .eq('id', industryId)
      .maybeSingle<IndustryProfileRow>();

    if (error) {
      throw loadFailed('industry profile', error.message);
    }

    return data;
  }

  private async fetchIndustryOrderAggregates(
    industryId: string,
  ): Promise<OrderAggregateRow[]> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('orders')
      .select('status, requested_weight_kg, final_weight_kg, total_amount')
      .eq('industry_id', industryId);

    if (error) {
      throw loadFailed('industry order aggregates', error.message);
    }

    return data ?? [];
  }

  private async fetchIndustryNegotiationAggregates(
    industryId: string,
  ): Promise<NegotiationAggregateRow[]> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('negotiation_threads')
      .select('status')
      .eq('industry_id', industryId);

    if (error) {
      throw loadFailed('industry negotiation aggregates', error.message);
    }

    return data ?? [];
  }

  private async fetchAvailableMaterialBatchCount(): Promise<number> {
    const admin = this.supabaseService.getAdminClient();
    const { count, error } = await admin
      .from('material_batches')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'available');

    if (error) {
      throw loadFailed('available material batch count', error.message);
    }

    return count ?? 0;
  }

  private async fetchIndustryRecentOrders(
    industryId: string,
  ): Promise<IndustryOrderSummaryItem[]> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('orders')
      .select(
        `
        id,
        status,
        requested_weight_kg,
        total_amount,
        created_at,
        batch:material_batches (
          name
        )
      `,
      )
      .eq('industry_id', industryId)
      .order('created_at', { ascending: false })
      .limit(RECENT_LIST_LIMIT);

    if (error) {
      throw loadFailed('industry recent orders', error.message);
    }

    return (data ?? []).map((row: OrderRecentRow) => ({
      id: row.id,
      status: row.status,
      requested_weight_kg: Number(row.requested_weight_kg),
      total_amount: row.total_amount === null ? null : Number(row.total_amount),
      batch_name: unwrapJoinName(row.batch),
      created_at: row.created_at,
    }));
  }

  private async fetchIndustryRecentNegotiations(
    industryId: string,
  ): Promise<IndustryNegotiationSummaryItem[]> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('negotiation_threads')
      .select('id, order_id, status, last_offer_price_per_kg, updated_at')
      .eq('industry_id', industryId)
      .order('updated_at', { ascending: false })
      .limit(RECENT_LIST_LIMIT);

    if (error) {
      throw loadFailed('industry recent negotiations', error.message);
    }

    return (data ?? []).map((row: NegotiationRecentRow) => ({
      id: row.id,
      order_id: row.order_id,
      status: row.status,
      last_offer_price_per_kg:
        row.last_offer_price_per_kg === null
          ? null
          : Number(row.last_offer_price_per_kg),
      updated_at: row.updated_at,
    }));
  }

  private async fetchImpactListings(
    filters: DashboardImpactFilters,
  ): Promise<ImpactListingRow[]> {
    const admin = this.supabaseService.getAdminClient();
    let query = admin.from('waste_listings').select(
      `
        status,
        estimated_weight_kg,
        actual_weight_kg,
        category:waste_categories (
          name
        )
      `,
    );

    query = applyDashboardDateFilters(query, filters);
    query = applyDashboardLocationFilters(query, filters);

    const { data, error } = await query;

    if (error) {
      throw loadFailed('platform impact listings', error.message);
    }

    return data ?? [];
  }

  private async fetchImpactMaterialBatches(
    filters: DashboardImpactFilters,
  ): Promise<ImpactMaterialBatchRow[]> {
    const admin = this.supabaseService.getAdminClient();
    let query = admin.from('material_batches').select(
      `
        status,
        total_weight_kg,
        category:waste_categories (
          name
        )
      `,
    );

    query = applyDashboardDateFilters(query, filters);
    query = applyDashboardLocationFilters(query, filters);

    const { data, error } = await query;

    if (error) {
      throw loadFailed('platform impact material batches', error.message);
    }

    return data ?? [];
  }

  private async fetchImpactTransactions(
    filters: DashboardImpactFilters,
  ): Promise<ImpactTransactionRow[]> {
    const admin = this.supabaseService.getAdminClient();
    let query = admin.from('transactions').select('amount, status, created_at');

    query = applyDashboardDateFilters(query, filters);

    const { data, error } = await query;

    if (error) {
      throw loadFailed('platform impact transactions', error.message);
    }

    let rows = data ?? [];

    if (filters.city || filters.province) {
      const batchIds = await this.fetchFilteredBatchIds(filters);
      if (batchIds.length === 0) {
        return [];
      }

      const { data: filteredRows, error: filteredError } = await admin
        .from('transactions')
        .select('amount, status, created_at')
        .in('batch_id', batchIds);

      if (filteredError) {
        throw loadFailed('platform impact transactions', filteredError.message);
      }

      rows = filteredRows ?? [];
      rows = filterRowsByDate(rows, filters);
    }

    return rows;
  }

  private async fetchImpactPickupClaims(
    filters: DashboardImpactFilters,
  ): Promise<ImpactPickupClaimRow[]> {
    const admin = this.supabaseService.getAdminClient();
    let query = admin
      .from('pickup_claims')
      .select('status, pickup_completed_at, created_at');

    query = applyDashboardDateFilters(query, filters, 'pickup_completed_at');

    const { data, error } = await query;

    if (error) {
      throw loadFailed('platform impact pickup claims', error.message);
    }

    let rows = (data ?? []) as ImpactPickupClaimRow[];

    if (filters.city || filters.province) {
      const listingIds = await this.fetchFilteredListingIds(filters);
      if (listingIds.length === 0) {
        return [];
      }

      const { data: filteredRows, error: filteredError } = await admin
        .from('pickup_claims')
        .select('status, pickup_completed_at, created_at')
        .in('listing_id', listingIds);

      if (filteredError) {
        throw loadFailed(
          'platform impact pickup claims',
          filteredError.message,
        );
      }

      rows = filteredRows ?? [];
      rows = filterRowsByDate(rows, filters, 'pickup_completed_at');
    }

    return rows;
  }

  private async fetchImpactRoutes(
    filters: DashboardImpactFilters,
  ): Promise<ImpactRouteRow[]> {
    const admin = this.supabaseService.getAdminClient();
    let query = admin
      .from('pickup_routes')
      .select(
        'status, total_distance_km, estimated_cost, actual_cost, created_at',
      );

    query = applyDashboardDateFilters(query, filters);

    const { data, error } = await query;

    if (error) {
      throw loadFailed('platform impact routes', error.message);
    }

    let rows = (data ?? []) as ImpactRouteRow[];

    if (filters.city || filters.province) {
      const routeIds = await this.fetchFilteredRouteIds(filters);
      if (routeIds.length === 0) {
        return [];
      }

      const { data: filteredRows, error: filteredError } = await admin
        .from('pickup_routes')
        .select(
          'status, total_distance_km, estimated_cost, actual_cost, created_at',
        )
        .in('id', routeIds);

      if (filteredError) {
        throw loadFailed('platform impact routes', filteredError.message);
      }

      rows = filteredRows ?? [];
      rows = filterRowsByDate(rows, filters);
    }

    return rows;
  }

  private async fetchFilteredListingIds(
    filters: DashboardImpactFilters,
  ): Promise<string[]> {
    const admin = this.supabaseService.getAdminClient();
    let query = admin.from('waste_listings').select('id');

    query = applyDashboardDateFilters(query, filters);
    query = applyDashboardLocationFilters(query, filters);

    const { data, error } = await query;

    if (error) {
      throw loadFailed('filtered listing ids', error.message);
    }

    return (data ?? []).map((row: { id: string }) => row.id);
  }

  private async fetchFilteredBatchIds(
    filters: DashboardImpactFilters,
  ): Promise<string[]> {
    const admin = this.supabaseService.getAdminClient();
    let query = admin.from('material_batches').select('id');

    query = applyDashboardDateFilters(query, filters);
    query = applyDashboardLocationFilters(query, filters);

    const { data, error } = await query;

    if (error) {
      throw loadFailed('filtered batch ids', error.message);
    }

    return (data ?? []).map((row: { id: string }) => row.id);
  }

  private async fetchFilteredRouteIds(
    filters: DashboardImpactFilters,
  ): Promise<string[]> {
    const listingIds = await this.fetchFilteredListingIds(filters);
    if (listingIds.length === 0) {
      return [];
    }

    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('pickup_route_stops')
      .select('route_id')
      .in('listing_id', listingIds);

    if (error) {
      throw loadFailed('filtered route ids', error.message);
    }

    const routeIds = new Set<string>();
    const stopRows = (data ?? []) as RouteStopRouteIdRow[];

    for (const row of stopRows) {
      routeIds.add(row.route_id);
    }

    return [...routeIds];
  }

  private async fetchActiveUserCounts(): Promise<{
    household: number;
    collector: number;
    industry: number;
  }> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('user_profiles')
      .select('role')
      .eq('is_active', true);

    if (error) {
      throw loadFailed('active user counts', error.message);
    }

    const counts = { household: 0, collector: 0, industry: 0 };

    for (const row of (data ?? []) as ActiveUserCountRow[]) {
      if (row.role === 'household') {
        counts.household += 1;
      } else if (row.role === 'collector') {
        counts.collector += 1;
      } else if (row.role === 'industry') {
        counts.industry += 1;
      }
    }

    return counts;
  }

  private async fetchCollectorRouteStatsRows(
    collectorId: string,
  ): Promise<ImpactRouteRow[]> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('pickup_routes')
      .select(
        'status, total_distance_km, total_weight_kg, estimated_cost, actual_cost, created_at',
      )
      .eq('collector_id', collectorId);

    if (error) {
      throw loadFailed('collector route stats', error.message);
    }

    return data ?? [];
  }
}

function mapProfileRatings(
  profile:
    | Pick<CollectorProfileRow, 'rating_average' | 'rating_count'>
    | Pick<IndustryProfileRow, 'rating_average' | 'rating_count'>
    | null,
): DashboardRatingSummary {
  if (!profile) {
    return { average: 0, count: 0 };
  }

  return {
    average: Number(profile.rating_average ?? 0),
    count: profile.rating_count ?? 0,
  };
}

function aggregateRatings(rows: RatingRow[]): DashboardRatingSummary {
  if (rows.length === 0) {
    return { average: 0, count: 0 };
  }

  const total = rows.reduce((sum, row) => sum + Number(row.rating), 0);

  return {
    average: Math.round((total / rows.length) * 100) / 100,
    count: rows.length,
  };
}

function unwrapJoinName(
  value: { name: string } | { name: string }[] | null,
): string | null {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    return value[0]?.name ?? null;
  }

  return value.name;
}

function startOfTodayIso(): string {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  ).toISOString();
}

function roundWeight(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function roundDistance(value: number): number {
  return Math.round(value * 100) / 100;
}

function loadFailed(
  resource: string,
  details: string,
): InternalServerErrorException {
  return new InternalServerErrorException({
    error: `Failed to load ${resource}`,
    code: 'DASHBOARD_SUMMARY_LOAD_FAILED',
    details,
  });
}

function applyDashboardDateFilters<
  T extends { gte: (...args: any[]) => T; lte: (...args: any[]) => T },
>(query: T, filters: DashboardImpactFilters, column = 'created_at'): T {
  if (filters.from_date) {
    query = query.gte(column, filters.from_date);
  }

  if (filters.to_date) {
    query = query.lte(column, endOfDayIso(filters.to_date));
  }

  return query;
}

function applyDashboardLocationFilters<
  T extends { ilike: (...args: any[]) => T },
>(query: T, filters: DashboardImpactFilters): T {
  if (filters.city) {
    query = query.ilike('city', `%${filters.city}%`);
  }

  if (filters.province) {
    query = query.ilike('province', `%${filters.province}%`);
  }

  return query;
}

function endOfDayIso(date: string): string {
  return `${date}T23:59:59.999Z`;
}

function filterRowsByDate<
  T extends { created_at?: string; pickup_completed_at?: string | null },
>(
  rows: T[],
  filters: DashboardImpactFilters,
  column: 'created_at' | 'pickup_completed_at' = 'created_at',
): T[] {
  return rows.filter((row) => {
    const value = row[column];
    if (!value) {
      return !filters.from_date && !filters.to_date;
    }

    if (filters.from_date && value < filters.from_date) {
      return false;
    }

    if (filters.to_date && value > endOfDayIso(filters.to_date)) {
      return false;
    }

    return true;
  });
}

function buildTopCategories(
  categoryWeights: Map<string, number>,
  totalWeightKg: number,
): PlatformImpactTopCategory[] {
  const entries = [...categoryWeights.entries()].sort(
    (left, right) => right[1] - left[1],
  );

  return entries.slice(0, 10).map(([categoryName, weightKg]) => ({
    category_name: categoryName,
    weight_kg: roundWeight(weightKg),
    percentage:
      totalWeightKg > 0
        ? Math.round((weightKg / totalWeightKg) * 1000) / 10
        : 0,
  }));
}

function buildCategoryFlowBreakdown(
  categoryInWeights: Map<string, number>,
  categoryOutWeights: Map<string, number>,
): MaterialFlowCategoryBreakdown[] {
  const categoryNames = new Set([
    ...categoryInWeights.keys(),
    ...categoryOutWeights.keys(),
  ]);

  return [...categoryNames]
    .sort((left, right) => left.localeCompare(right))
    .map((categoryName) => ({
      category_name: categoryName,
      weight_kg_in: roundWeight(categoryInWeights.get(categoryName) ?? 0),
      weight_kg_out: roundWeight(categoryOutWeights.get(categoryName) ?? 0),
    }));
}
