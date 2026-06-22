import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { estimateCo2SavedKg } from '../../common/config/emission-factors';
import type {
  PlatformImpactMetrics,
  ReportExportFilters,
} from './reports.types';

const COLLECTED_LISTING_STATUSES = new Set([
  'picked_up',
  'sorting',
  'sorted',
  'converted_to_material',
]);

interface ListingAggregateRow {
  status: string;
  estimated_weight_kg: number | string;
  actual_weight_kg: number | string | null;
  category_id: string;
  city: string | null;
  created_at: string;
}

interface MaterialBatchAggregateRow {
  status: string;
  total_weight_kg: number | string;
  category_id: string;
  created_at: string;
}

interface TransactionAggregateRow {
  amount: number | string;
  status: string;
  created_at: string;
}

interface RouteAggregateRow {
  status: string;
  total_distance_km: number | string;
  estimated_cost: number | null;
  created_at: string;
}

interface CategoryRow {
  id: string;
  name: string;
  code: string | null;
}

@Injectable()
export class ReportDataService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getPlatformImpact(
    filters: ReportExportFilters,
  ): Promise<PlatformImpactMetrics> {
    const [listings, batches, transactions, routes, profiles] =
      await Promise.all([
        this.fetchListings(filters),
        this.fetchMaterialBatches(filters),
        this.fetchTransactions(filters),
        this.fetchRoutes(filters),
        this.fetchActiveProfileCounts(),
      ]);

    const { names: categories, codes: categoryCodes } =
      await this.fetchCategoryMaps();

    let totalWasteSubmittedKg = 0;
    let totalWasteCollectedKg = 0;
    const categoryWeights = new Map<string, number>();

    for (const row of listings) {
      const estimated = Number(row.estimated_weight_kg);
      const actual =
        row.actual_weight_kg === null ? null : Number(row.actual_weight_kg);
      totalWasteSubmittedKg += estimated;

      if (COLLECTED_LISTING_STATUSES.has(row.status)) {
        totalWasteCollectedKg += actual ?? estimated;
      }

      const categoryWeight = actual ?? estimated;
      categoryWeights.set(
        row.category_id,
        (categoryWeights.get(row.category_id) ?? 0) + categoryWeight,
      );
    }

    let totalMaterialProducedKg = 0;
    let totalMaterialSoldKg = 0;
    const soldWeightByCategoryCode = new Map<string, number>();
    const producedWeightByCategoryCode = new Map<string, number>();

    for (const row of batches) {
      const weight = Number(row.total_weight_kg);
      totalMaterialProducedKg += weight;
      const code = categoryCodes.get(row.category_id) ?? 'UNKNOWN';
      producedWeightByCategoryCode.set(
        code,
        (producedWeightByCategoryCode.get(code) ?? 0) + weight,
      );

      if (row.status === 'sold') {
        totalMaterialSoldKg += weight;
        soldWeightByCategoryCode.set(
          code,
          (soldWeightByCategoryCode.get(code) ?? 0) + weight,
        );
      }
    }

    let totalTransactionValueIdr = 0;
    let completedTransactions = 0;

    for (const row of transactions) {
      if (row.status === 'completed') {
        completedTransactions += 1;
        totalTransactionValueIdr += Number(row.amount);
      }
    }

    let totalPickupsCompleted = 0;
    let totalRouteDistanceKm = 0;
    let totalRouteCostIdr = 0;

    for (const row of routes) {
      if (row.status === 'completed') {
        totalPickupsCompleted += 1;
      }

      if (row.status !== 'cancelled') {
        totalRouteDistanceKm += Number(row.total_distance_km);
        totalRouteCostIdr += row.estimated_cost ?? 0;
      }
    }

    const recycledWeightByCategoryCode =
      totalMaterialSoldKg > 0
        ? soldWeightByCategoryCode
        : producedWeightByCategoryCode;
    const estimatedCo2SavedKg = estimateCo2SavedKg(
      recycledWeightByCategoryCode,
    );

    return {
      total_waste_submitted_kg: roundWeight(totalWasteSubmittedKg),
      total_waste_collected_kg: roundWeight(totalWasteCollectedKg),
      total_material_produced_kg: roundWeight(totalMaterialProducedKg),
      total_material_sold_kg: roundWeight(totalMaterialSoldKg),
      total_transactions: completedTransactions,
      total_transaction_value_idr: Math.round(totalTransactionValueIdr),
      total_pickups_completed: totalPickupsCompleted,
      total_route_distance_km: roundDistance(totalRouteDistanceKm),
      total_route_cost_idr: Math.round(totalRouteCostIdr),
      estimated_co2_saved_kg: roundWeight(estimatedCo2SavedKg),
      estimated_economic_value_idr: Math.round(totalTransactionValueIdr),
      active_households: profiles.households,
      active_collectors: profiles.collectors,
      active_industries: profiles.industries,
      top_categories: this.buildTopCategories(
        categoryWeights,
        categories,
        totalWasteSubmittedKg,
      ),
    };
  }

  private buildTopCategories(
    categoryWeights: Map<string, number>,
    categories: Map<string, string>,
    totalWeight: number,
  ): PlatformImpactMetrics['top_categories'] {
    return [...categoryWeights.entries()]
      .map(([categoryId, weightKg]) => ({
        category_name: categories.get(categoryId) ?? 'Unknown',
        weight_kg: roundWeight(weightKg),
        percentage:
          totalWeight > 0
            ? Math.round((weightKg / totalWeight) * 1000) / 10
            : 0,
      }))
      .sort((left, right) => right.weight_kg - left.weight_kg)
      .slice(0, 10);
  }

  private async fetchListings(
    filters: ReportExportFilters,
  ): Promise<ListingAggregateRow[]> {
    const admin = this.supabaseService.getAdminClient();
    let query = admin
      .from('waste_listings')
      .select(
        'status, estimated_weight_kg, actual_weight_kg, category_id, city, created_at',
      );

    if (filters.from_date) {
      query = query.gte('created_at', filters.from_date);
    }

    if (filters.to_date) {
      query = query.lte('created_at', filters.to_date);
    }

    if (filters.city) {
      query = query.eq('city', filters.city);
    }

    const { data, error } = await query;

    if (error) {
      throw loadFailed('waste listings for report', error.message);
    }

    return data ?? [];
  }

  private async fetchMaterialBatches(
    filters: ReportExportFilters,
  ): Promise<MaterialBatchAggregateRow[]> {
    const admin = this.supabaseService.getAdminClient();
    let query = admin
      .from('material_batches')
      .select('status, total_weight_kg, category_id, created_at');

    if (filters.from_date) {
      query = query.gte('created_at', filters.from_date);
    }

    if (filters.to_date) {
      query = query.lte('created_at', filters.to_date);
    }

    const { data, error } = await query;

    if (error) {
      throw loadFailed('material batches for report', error.message);
    }

    return data ?? [];
  }

  private async fetchTransactions(
    filters: ReportExportFilters,
  ): Promise<TransactionAggregateRow[]> {
    const admin = this.supabaseService.getAdminClient();
    let query = admin.from('transactions').select('amount, status, created_at');

    if (filters.from_date) {
      query = query.gte('created_at', filters.from_date);
    }

    if (filters.to_date) {
      query = query.lte('created_at', filters.to_date);
    }

    const { data, error } = await query;

    if (error) {
      throw loadFailed('transactions for report', error.message);
    }

    return data ?? [];
  }

  private async fetchRoutes(
    filters: ReportExportFilters,
  ): Promise<RouteAggregateRow[]> {
    const admin = this.supabaseService.getAdminClient();
    let query = admin
      .from('pickup_routes')
      .select('status, total_distance_km, estimated_cost, created_at');

    if (filters.from_date) {
      query = query.gte('created_at', filters.from_date);
    }

    if (filters.to_date) {
      query = query.lte('created_at', filters.to_date);
    }

    const { data, error } = await query;

    if (error) {
      throw loadFailed('pickup routes for report', error.message);
    }

    return data ?? [];
  }

  private async fetchCategoryMaps(): Promise<{
    names: Map<string, string>;
    codes: Map<string, string>;
  }> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('waste_categories')
      .select('id, name, code');

    if (error) {
      throw loadFailed('waste categories for report', error.message);
    }

    const names = new Map<string, string>();
    const codes = new Map<string, string>();

    for (const row of (data ?? []) as CategoryRow[]) {
      names.set(row.id, row.name);
      if (row.code) {
        codes.set(row.id, row.code);
      }
    }

    return { names, codes };
  }

  private async fetchActiveProfileCounts(): Promise<{
    households: number;
    collectors: number;
    industries: number;
  }> {
    const admin = this.supabaseService.getAdminClient();
    const [households, collectors, industries] = await Promise.all([
      admin
        .from('household_profiles')
        .select('id', { count: 'exact', head: true }),
      admin
        .from('collector_profiles')
        .select('id', { count: 'exact', head: true }),
      admin
        .from('industry_profiles')
        .select('id', { count: 'exact', head: true }),
    ]);

    if (households.error || collectors.error || industries.error) {
      throw loadFailed(
        'profile counts for report',
        households.error?.message ??
          collectors.error?.message ??
          industries.error?.message ??
          'Unknown error',
      );
    }

    return {
      households: households.count ?? 0,
      collectors: collectors.count ?? 0,
      industries: industries.count ?? 0,
    };
  }
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
    code: 'REPORT_DATA_LOAD_FAILED',
    details,
  });
}
