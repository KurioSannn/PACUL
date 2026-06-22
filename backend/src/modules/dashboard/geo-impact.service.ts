import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { getEmissionFactor } from '../../common/config/emission-factors';
import { haversineDistance } from '../../common/utils/haversine';
import type {
  DashboardImpactFilters,
  LocalImpact,
  LocalImpactLocation,
  PickupMapData,
  PickupMapPoint,
} from './dashboard.types';

const COLLECTED_LISTING_STATUSES = new Set([
  'picked_up',
  'sorting',
  'sorted',
  'converted_to_material',
]);

const MAP_AVAILABLE_STATUS = 'available';
const MAX_MAP_POINTS = 200;
const UNKNOWN_CITY = 'Unknown';

interface ImpactListingLocationRow {
  status: string;
  estimated_weight_kg: number | string;
  actual_weight_kg: number | string | null;
  city: string | null;
  province: string | null;
}

interface ImpactBatchLocationRow {
  status: string;
  total_weight_kg: number | string;
  city: string | null;
  province: string | null;
  category: { code: string } | { code: string }[] | null;
}

interface MapListingRow {
  id: string;
  category_id: string;
  estimated_weight_kg: number | string;
  latitude: number | string;
  longitude: number | string;
  district: string | null;
  city: string | null;
  category: { name: string } | { name: string }[] | null;
}

interface CollectorBaseRow {
  base_latitude: number | string | null;
  base_longitude: number | string | null;
}

interface LocationAccumulator extends LocalImpactLocation {
  groupKey: string;
}

@Injectable()
export class GeoImpactService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getLocalImpact(filters: DashboardImpactFilters): Promise<LocalImpact> {
    const [listings, batches] = await Promise.all([
      this.fetchListings(filters),
      this.fetchBatches(filters),
    ]);

    const byLocation = new Map<string, LocationAccumulator>();

    const accumulatorFor = (
      city: string | null,
      province: string | null,
    ): LocationAccumulator => {
      const displayCity = city?.trim() || UNKNOWN_CITY;
      const groupKey = `${displayCity.toLowerCase()}|${(province ?? '')
        .trim()
        .toLowerCase()}`;
      let entry = byLocation.get(groupKey);

      if (!entry) {
        entry = {
          groupKey,
          city: displayCity,
          province: province?.trim() || null,
          total_waste_collected_kg: 0,
          total_material_sold_kg: 0,
          estimated_co2_saved_kg: 0,
          listing_count: 0,
          pickup_count: 0,
        };
        byLocation.set(groupKey, entry);
      }

      return entry;
    };

    for (const row of listings) {
      const entry = accumulatorFor(row.city, row.province);
      entry.listing_count += 1;

      if (COLLECTED_LISTING_STATUSES.has(row.status)) {
        const actual =
          row.actual_weight_kg === null ? null : Number(row.actual_weight_kg);
        entry.total_waste_collected_kg +=
          actual ?? Number(row.estimated_weight_kg);
        entry.pickup_count += 1;
      }
    }

    for (const row of batches) {
      if (row.status !== 'sold') {
        continue;
      }

      const entry = accumulatorFor(row.city, row.province);
      const weightKg = Number(row.total_weight_kg);
      const code = unwrapCode(row.category);
      entry.total_material_sold_kg += weightKg;
      entry.estimated_co2_saved_kg += weightKg * getEmissionFactor(code);
    }

    const locations = [...byLocation.values()]
      .map((entry) => ({
        city: entry.city,
        province: entry.province,
        total_waste_collected_kg: roundKg(entry.total_waste_collected_kg),
        total_material_sold_kg: roundKg(entry.total_material_sold_kg),
        estimated_co2_saved_kg: roundKg(entry.estimated_co2_saved_kg),
        listing_count: entry.listing_count,
        pickup_count: entry.pickup_count,
      }))
      .sort((a, b) => b.total_waste_collected_kg - a.total_waste_collected_kg);

    const totals = locations.reduce(
      (acc, location) => {
        acc.total_waste_collected_kg += location.total_waste_collected_kg;
        acc.total_material_sold_kg += location.total_material_sold_kg;
        acc.estimated_co2_saved_kg += location.estimated_co2_saved_kg;
        return acc;
      },
      {
        total_waste_collected_kg: 0,
        total_material_sold_kg: 0,
        estimated_co2_saved_kg: 0,
        location_count: locations.length,
      },
    );

    return {
      filters,
      locations,
      totals: {
        total_waste_collected_kg: roundKg(totals.total_waste_collected_kg),
        total_material_sold_kg: roundKg(totals.total_material_sold_kg),
        estimated_co2_saved_kg: roundKg(totals.estimated_co2_saved_kg),
        location_count: totals.location_count,
      },
    };
  }

  async getPickupMapData(collectorId: string): Promise<PickupMapData> {
    const [base, handledCategoryIds] = await Promise.all([
      this.fetchCollectorBase(collectorId),
      this.fetchHandledCategoryIds(collectorId),
    ]);

    if (handledCategoryIds.length === 0) {
      return {
        collector_base: base,
        handled_category_ids: [],
        points: [],
      };
    }

    const listings = await this.fetchMapListings(handledCategoryIds);

    const points: PickupMapPoint[] = listings
      .map((row) => {
        const latitude = Number(row.latitude);
        const longitude = Number(row.longitude);
        const distanceKm = haversineDistance(base, { latitude, longitude });

        return {
          listing_id: row.id,
          category_id: row.category_id,
          category_name: unwrapName(row.category),
          estimated_weight_kg: roundKg(Number(row.estimated_weight_kg)),
          latitude,
          longitude,
          distance_km: roundKm(distanceKm),
          area_summary: buildAreaSummary(row.district, row.city),
        };
      })
      .sort((a, b) => a.distance_km - b.distance_km)
      .slice(0, MAX_MAP_POINTS);

    return {
      collector_base: base,
      handled_category_ids: handledCategoryIds,
      points,
    };
  }

  private async fetchListings(
    filters: DashboardImpactFilters,
  ): Promise<ImpactListingLocationRow[]> {
    const admin = this.supabaseService.getAdminClient();
    let query = admin
      .from('waste_listings')
      .select(
        'status, estimated_weight_kg, actual_weight_kg, city, province, created_at',
      );

    query = applyDateFilters(query, filters);
    query = applyLocationFilters(query, filters);

    const { data, error } = await query;

    if (error) {
      throw loadFailed('local impact listings', error.message);
    }

    return data ?? [];
  }

  private async fetchBatches(
    filters: DashboardImpactFilters,
  ): Promise<ImpactBatchLocationRow[]> {
    const admin = this.supabaseService.getAdminClient();
    let query = admin.from('material_batches').select(
      `
        status,
        total_weight_kg,
        city,
        province,
        created_at,
        category:waste_categories (
          code
        )
      `,
    );

    query = applyDateFilters(query, filters);
    query = applyLocationFilters(query, filters);

    const { data, error } = await query;

    if (error) {
      throw loadFailed('local impact material batches', error.message);
    }

    return data ?? [];
  }

  private async fetchCollectorBase(collectorId: string): Promise<{
    latitude: number;
    longitude: number;
  }> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('collector_profiles')
      .select('base_latitude, base_longitude')
      .eq('id', collectorId)
      .maybeSingle<CollectorBaseRow>();

    if (error) {
      throw loadFailed('collector base location', error.message);
    }

    return {
      latitude:
        data?.base_latitude === null ? 0 : Number(data?.base_latitude ?? 0),
      longitude:
        data?.base_longitude === null ? 0 : Number(data?.base_longitude ?? 0),
    };
  }

  private async fetchHandledCategoryIds(
    collectorId: string,
  ): Promise<string[]> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('collector_handled_categories')
      .select('category_id')
      .eq('collector_id', collectorId)
      .eq('is_active', true);

    if (error) {
      throw loadFailed('collector handled categories', error.message);
    }

    return (data ?? []).map((row: { category_id: string }) => row.category_id);
  }

  private async fetchMapListings(
    categoryIds: string[],
  ): Promise<MapListingRow[]> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('waste_listings')
      .select(
        `
        id,
        category_id,
        estimated_weight_kg,
        latitude,
        longitude,
        district,
        city,
        category:waste_categories (
          name
        )
      `,
      )
      .eq('status', MAP_AVAILABLE_STATUS)
      .in('category_id', categoryIds);

    if (error) {
      throw loadFailed('pickup map listings', error.message);
    }

    return data ?? [];
  }
}

function buildAreaSummary(
  district: string | null,
  city: string | null,
): string {
  const parts = [district?.trim(), city?.trim()].filter(
    (part): part is string => Boolean(part),
  );

  return parts.length > 0 ? parts.join(', ') : UNKNOWN_CITY;
}

function unwrapCode(
  value: { code: string } | { code: string }[] | null,
): string | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? (value[0]?.code ?? null) : value.code;
}

function unwrapName(
  value: { name: string } | { name: string }[] | null,
): string | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? (value[0]?.name ?? null) : value.name;
}

function roundKg(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundKm(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function applyDateFilters<
  T extends { gte: (...args: any[]) => T; lte: (...args: any[]) => T },
>(query: T, filters: DashboardImpactFilters): T {
  if (filters.from_date) {
    query = query.gte('created_at', filters.from_date);
  }

  if (filters.to_date) {
    query = query.lte('created_at', `${filters.to_date}T23:59:59.999Z`);
  }

  return query;
}

function applyLocationFilters<T extends { ilike: (...args: any[]) => T }>(
  query: T,
  filters: DashboardImpactFilters,
): T {
  if (filters.city) {
    query = query.ilike('city', `%${filters.city}%`);
  }

  if (filters.province) {
    query = query.ilike('province', `%${filters.province}%`);
  }

  return query;
}

function loadFailed(
  resource: string,
  message: string,
): InternalServerErrorException {
  return new InternalServerErrorException(
    `Gagal memuat ${resource}: ${message}`,
  );
}
