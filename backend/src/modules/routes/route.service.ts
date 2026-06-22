import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  optimizeRoute,
  type RouteStop,
} from '../../common/utils/route-optimizer';
import { haversineDistance } from '../../common/utils/haversine';
import type { UserRole } from '../profiles/profiles.types';
import { TraceabilityService } from '../traceability/traceability.service';
import { PointsService } from '../eco-points/points.service';
import { StatusTransitionService } from '../waste-listings/status-transition.service';
import { SupabaseService } from '../../supabase/supabase.service';
import {
  CostEstimationService,
  type CostEstimationResult,
} from './cost-estimation.service';
import type { UpdatableRouteStatus } from './dto/update-route-status.dto';
import type { UpdatableStopStatus } from './dto/update-stop-status.dto';
import type {
  CollectorBaseCoordinates,
  PickupRoute,
  PickupRouteStop,
  PickupRouteStatus,
  PickupRouteStopStatus,
  RouteCostEstimateType,
  RoutePreviewResult,
  RoutePreviewStop,
} from './routes.types';

interface ListingRow {
  id: string;
  status: string;
  claimed_by: string | null;
  latitude: number | string;
  longitude: number | string;
  estimated_weight_kg: number | string;
  address: string | null;
}

interface ListingEligibilityIssue {
  listingId: string;
  reason: 'not_found' | 'invalid_status' | 'not_claimed_by_collector';
  status?: string;
}

interface PickupRouteRow {
  id: string;
  collector_id: string;
  status: string;
  total_distance_km: number | string;
  estimated_duration_minutes: number | null;
  total_weight_kg: number | string | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface PickupRouteStopRow {
  id: string;
  route_id: string;
  listing_id: string;
  sequence_number: number;
  distance_from_previous_km: number | string | null;
  estimated_arrival_minutes: number | null;
  status: string;
  arrived_at: string | null;
  completed_at: string | null;
  notes: string | null;
}

const LISTING_SELECT =
  'id, status, claimed_by, latitude, longitude, estimated_weight_kg, address';

const ROUTE_SELECT = `
  id,
  collector_id,
  status,
  total_distance_km,
  estimated_duration_minutes,
  total_weight_kg,
  estimated_cost,
  actual_cost,
  started_at,
  completed_at,
  cancelled_at,
  cancel_reason,
  notes,
  created_at,
  updated_at
`;

const ROUTE_STOP_SELECT = `
  id,
  route_id,
  listing_id,
  sequence_number,
  distance_from_previous_km,
  estimated_arrival_minutes,
  status,
  arrived_at,
  completed_at,
  notes
`;

const ROUTE_STATUS_TRANSITIONS: Record<
  PickupRouteStatus,
  readonly PickupRouteStatus[]
> = {
  planned: ['ongoing', 'completed', 'cancelled'],
  ongoing: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

const STOP_STATUS_TRANSITIONS: Record<
  PickupRouteStopStatus,
  readonly PickupRouteStopStatus[]
> = {
  pending: ['arrived', 'completed', 'skipped'],
  arrived: ['completed', 'skipped'],
  completed: [],
  skipped: [],
};

@Injectable()
export class RouteService {
  private readonly logger = new Logger('RouteService');

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly costEstimationService: CostEstimationService,
    private readonly statusTransitionService: StatusTransitionService,
    private readonly traceabilityService: TraceabilityService,
    private readonly pointsService: PointsService,
  ) {}

  async previewRoute(
    collectorId: string,
    listingIds: string[],
  ): Promise<RoutePreviewResult> {
    const preview = await this.buildRoutePreview(collectorId, listingIds);

    const estimateId = await this.saveCostEstimate({
      routeId: null,
      collectorId,
      estimateType: 'preview',
      totalDistanceKm: preview.totalDistanceKm,
      totalWeightKg: preview.totalWeightKg,
      stopCount: preview.orderedStops.length,
      cost: preview.costEstimation,
    });

    return { ...preview, estimateId };
  }

  async commitRoute(
    collectorId: string,
    listingIds: string[],
    notes?: string,
  ): Promise<PickupRoute> {
    const preview = await this.buildRoutePreview(collectorId, listingIds);
    const routeId = await this.insertRoute(collectorId, preview, notes);
    const stops = await this.insertRouteStops(routeId, preview.orderedStops);

    for (const stop of preview.orderedStops) {
      await this.statusTransitionService.transitionListingStatus(
        stop.listingId,
        'pickup_planned',
        collectorId,
        'collector',
      );
      await this.linkPickupClaimToRoute(stop.listingId, collectorId, routeId);
    }

    const route = await this.fetchRouteRow(routeId);

    if (!route) {
      throw new InternalServerErrorException({
        error: 'Failed to load committed pickup route',
        code: 'ROUTE_LOAD_FAILED',
      });
    }

    await this.saveCostEstimate({
      routeId,
      collectorId,
      estimateType: 'committed',
      totalDistanceKm: preview.totalDistanceKm,
      totalWeightKg: preview.totalWeightKg,
      stopCount: preview.orderedStops.length,
      cost: preview.costEstimation,
    });

    this.traceabilityService.emitEvent({
      eventType: 'route_created',
      entityType: 'pickup_route',
      entityId: routeId,
      actorId: collectorId,
      actorRole: 'collector',
      newStatus: 'planned',
      metadata: {
        listingIds: preview.orderedStops.map((stop) => stop.listingId),
        stopCount: preview.orderedStops.length,
        totalDistanceKm: preview.totalDistanceKm,
        totalWeightKg: preview.totalWeightKg,
      },
    });

    return this.mapPickupRoute(route, stops);
  }

  async getRouteById(
    routeId: string,
    requesterId: string,
    requesterRole: UserRole,
  ): Promise<PickupRoute> {
    const route = await this.fetchRouteRow(routeId);

    if (!route) {
      throw new NotFoundException({
        error: 'Pickup route not found',
        code: 'ROUTE_NOT_FOUND',
      });
    }

    const stops = await this.fetchRouteStops(routeId);
    const canAccess = await this.canAccessRoute(
      route,
      stops,
      requesterId,
      requesterRole,
    );

    if (!canAccess) {
      throw new NotFoundException({
        error: 'Pickup route not found',
        code: 'ROUTE_NOT_FOUND',
      });
    }

    return this.mapPickupRoute(route, stops);
  }

  async updateRouteStatus(
    routeId: string,
    collectorId: string,
    newStatus: UpdatableRouteStatus,
    cancelReason?: string,
  ): Promise<PickupRoute> {
    const route = await this.getCollectorRouteOrThrow(routeId, collectorId);
    this.assertRouteStatusTransition(
      route.status as PickupRouteStatus,
      newStatus,
    );

    const stops = await this.fetchRouteStops(routeId);
    const transitionedAt = new Date().toISOString();

    if (newStatus === 'ongoing') {
      await this.persistRouteStatusUpdate(routeId, route.status, {
        status: 'ongoing',
        started_at: transitionedAt,
      });
    } else if (newStatus === 'completed') {
      await this.persistRouteStatusUpdate(routeId, route.status, {
        status: 'completed',
        completed_at: transitionedAt,
      });

      for (const stop of stops) {
        if (stop.status === 'pending' || stop.status === 'arrived') {
          await this.transitionListingToPickedUp(
            stop.listing_id,
            collectorId,
            routeId,
            stop.id,
          );
        }
      }

      const activeStopCount = stops.filter(
        (stop) => stop.status !== 'skipped',
      ).length;
      const actualCost = this.costEstimationService.estimatePickupCost({
        totalDistanceKm: Number(route.total_distance_km),
        totalWeightKg: Number(route.total_weight_kg ?? 0),
        stopCount: activeStopCount,
      });

      await this.saveCostEstimate({
        routeId,
        collectorId,
        estimateType: 'actual',
        totalDistanceKm: Number(route.total_distance_km),
        totalWeightKg: Number(route.total_weight_kg ?? 0),
        stopCount: activeStopCount,
        cost: actualCost,
      });

      void this.pointsService.awardPoints({
        userId: collectorId,
        eventType: 'pickup_completed',
        entityType: 'pickup_route',
        entityId: routeId,
        description: 'Rute pickup selesai',
      });
    } else if (newStatus === 'cancelled') {
      await this.persistRouteStatusUpdate(routeId, route.status, {
        status: 'cancelled',
        cancelled_at: transitionedAt,
        cancel_reason: cancelReason ?? null,
      });

      for (const stop of stops) {
        if (stop.status === 'pending' || stop.status === 'arrived') {
          await this.revertListingToClaimed(stop.listing_id);
        }
      }
    }

    return this.getCollectorRoute(routeId, collectorId);
  }

  async updateStopStatus(
    routeId: string,
    stopId: string,
    collectorId: string,
    newStatus: UpdatableStopStatus,
    notes?: string,
  ): Promise<PickupRoute> {
    await this.getCollectorRouteOrThrow(routeId, collectorId);
    const stop = await this.fetchRouteStopOrThrow(routeId, stopId);
    const currentStatus = stop.status as PickupRouteStopStatus;
    this.assertStopStatusTransition(currentStatus, newStatus);

    const transitionedAt = new Date().toISOString();
    const updatePayload: Record<string, unknown> = {
      status: newStatus,
    };

    if (notes !== undefined) {
      updatePayload.notes = notes;
    }

    if (newStatus === 'arrived') {
      updatePayload.arrived_at = transitionedAt;
    }

    if (newStatus === 'completed') {
      updatePayload.completed_at = transitionedAt;
      await this.transitionListingToPickedUp(
        stop.listing_id,
        collectorId,
        routeId,
        stopId,
      );
    }

    await this.persistStopStatusUpdate(
      stopId,
      routeId,
      currentStatus,
      updatePayload,
    );

    return this.getCollectorRoute(routeId, collectorId);
  }

  async recalculateRoute(
    routeId: string,
    collectorId: string,
  ): Promise<PickupRoute> {
    const route = await this.getCollectorRouteOrThrow(routeId, collectorId);

    if (route.status !== 'planned' && route.status !== 'ongoing') {
      throw new BadRequestException({
        error: 'Only planned or ongoing routes can be recalculated',
        code: 'ROUTE_NOT_RECALCULABLE',
      });
    }

    const collectorBase = await this.getCollectorBaseCoordinates(collectorId);

    if (!collectorBase) {
      throw new BadRequestException({
        error: 'Collector base coordinates are required to recalculate route',
        code: 'COLLECTOR_BASE_NOT_SET',
      });
    }

    const stops = await this.fetchRouteStops(routeId);
    const fixedStops = stops
      .filter(
        (stop) => stop.status === 'completed' || stop.status === 'skipped',
      )
      .sort((left, right) => left.sequence_number - right.sequence_number);
    const remainingStops = stops
      .filter((stop) => stop.status === 'pending' || stop.status === 'arrived')
      .sort((left, right) => left.sequence_number - right.sequence_number);

    if (remainingStops.length === 0) {
      throw new BadRequestException({
        error: 'Route has no remaining stops to recalculate',
        code: 'ROUTE_NO_REMAINING_STOPS',
      });
    }

    const listingMap = await this.fetchListingMap(
      stops.map((stop) => stop.listing_id),
    );
    const optimizationOrigin = this.resolveRecalculationOrigin(
      collectorBase,
      fixedStops,
      listingMap,
    );
    const remainingRouteStops = remainingStops.map((stop) =>
      this.mapListingRowToRouteStop(
        listingMap.get(stop.listing_id),
        stop.listing_id,
      ),
    );
    const optimized = optimizeRoute(optimizationOrigin, remainingRouteStops);
    const optimizedPreviewStops = this.mapOptimizedStops(
      optimized.orderedStops,
      optimized.distances,
    );
    const finalStops = this.mergeRecalculatedStops(
      fixedStops,
      remainingStops,
      optimizedPreviewStops,
    );
    const chainMetrics = this.calculateStopChainMetrics(
      collectorBase,
      finalStops,
      listingMap,
    );
    const totalWeightKg = finalStops
      .filter((stop) => stop.status !== 'skipped')
      .reduce(
        (sum, stop) =>
          sum +
          Number(listingMap.get(stop.listing_id)?.estimated_weight_kg ?? 0),
        0,
      );
    const activeStopCount = finalStops.filter(
      (stop) => stop.status !== 'skipped',
    ).length;
    const costEstimation = this.costEstimationService.estimatePickupCost({
      totalDistanceKm: chainMetrics.totalDistanceKm,
      totalWeightKg,
      stopCount: activeStopCount,
    });

    await this.persistRecalculatedRoute(routeId, finalStops, chainMetrics, {
      totalWeightKg,
      estimatedDurationMinutes: chainMetrics.estimatedDurationMinutes,
      estimatedCost: costEstimation.totalCost,
    });

    return this.getCollectorRoute(routeId, collectorId);
  }

  private async saveCostEstimate(params: {
    routeId: string | null;
    collectorId: string;
    estimateType: RouteCostEstimateType;
    totalDistanceKm: number;
    totalWeightKg: number;
    stopCount: number;
    cost: CostEstimationResult;
  }): Promise<string | null> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('route_cost_estimates')
      .insert({
        route_id: params.routeId,
        collector_id: params.collectorId,
        estimate_type: params.estimateType,
        total_distance_km: params.totalDistanceKm,
        total_weight_kg: params.totalWeightKg,
        stop_count: params.stopCount,
        base_fee: params.cost.baseFee,
        distance_cost: params.cost.distanceCost,
        handling_cost: params.cost.handlingCost,
        total_cost: params.cost.totalCost,
        config_snapshot: params.cost.configUsed,
      })
      .select('id')
      .single<{ id: string }>();

    if (error || !data) {
      this.logger.warn(
        `Failed to persist ${params.estimateType} route cost estimate: ${
          error?.message ?? 'unknown error'
        }`,
      );
      return null;
    }

    return data.id;
  }

  private async buildRoutePreview(
    collectorId: string,
    listingIds: string[],
  ): Promise<RoutePreviewResult> {
    const collectorBase = await this.getCollectorBaseCoordinates(collectorId);

    if (!collectorBase) {
      throw new BadRequestException({
        error: 'Collector base coordinates are required for route preview',
        code: 'COLLECTOR_BASE_NOT_SET',
      });
    }

    const listings = await this.fetchListings(listingIds);
    const issues = this.validateListingEligibility(
      listingIds,
      listings,
      collectorId,
    );

    if (issues.length > 0) {
      throw new BadRequestException({
        error: 'One or more listings are not eligible for route preview',
        code: 'LISTINGS_NOT_ELIGIBLE',
        details: issues,
      });
    }

    const routeStops = this.mapListingsToRouteStops(listings);
    const optimized = optimizeRoute(collectorBase, routeStops);
    const totalWeightKg = routeStops.reduce(
      (sum, stop) => sum + stop.estimated_weight_kg,
      0,
    );
    const orderedStops = this.mapOptimizedStops(
      optimized.orderedStops,
      optimized.distances,
    );
    const costEstimation = this.costEstimationService.estimatePickupCost({
      totalDistanceKm: optimized.totalDistanceKm,
      totalWeightKg,
      stopCount: orderedStops.length,
    });

    return {
      collectorBase,
      orderedStops,
      totalDistanceKm: optimized.totalDistanceKm,
      estimatedDurationMinutes: optimized.estimatedDurationMinutes,
      totalWeightKg,
      costEstimation,
      isPreview: true,
    };
  }

  private async insertRoute(
    collectorId: string,
    preview: RoutePreviewResult,
    notes?: string,
  ): Promise<string> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('pickup_routes')
      .insert({
        collector_id: collectorId,
        status: 'planned',
        total_distance_km: preview.totalDistanceKm,
        estimated_duration_minutes: preview.estimatedDurationMinutes,
        total_weight_kg: preview.totalWeightKg,
        estimated_cost: preview.costEstimation.totalCost,
        notes: notes ?? null,
      })
      .select('id')
      .single<{ id: string }>();

    if (error || !data) {
      throw new InternalServerErrorException({
        error: 'Failed to create pickup route',
        code: 'ROUTE_CREATE_FAILED',
        details: error?.message,
      });
    }

    return data.id;
  }

  private async insertRouteStops(
    routeId: string,
    orderedStops: RoutePreviewStop[],
  ): Promise<PickupRouteStopRow[]> {
    const arrivalMinutes = this.calculateStopArrivalMinutes(orderedStops);
    const rows = orderedStops.map((stop) => ({
      route_id: routeId,
      listing_id: stop.listingId,
      sequence_number: stop.sequenceNumber,
      distance_from_previous_km: stop.distanceFromPreviousKm,
      estimated_arrival_minutes:
        arrivalMinutes[stop.sequenceNumber - 1] ?? null,
      status: 'pending',
    }));

    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('pickup_route_stops')
      .insert(rows)
      .select(ROUTE_STOP_SELECT);

    if (error || !data) {
      throw new InternalServerErrorException({
        error: 'Failed to create pickup route stops',
        code: 'ROUTE_STOPS_CREATE_FAILED',
        details: error?.message,
      });
    }

    return data;
  }

  private async linkPickupClaimToRoute(
    listingId: string,
    collectorId: string,
    routeId: string,
  ): Promise<void> {
    const admin = this.supabaseService.getAdminClient();
    const transitionedAt = new Date().toISOString();
    const { data, error } = await admin
      .from('pickup_claims')
      .update({
        route_id: routeId,
        status: 'pickup_planned',
        pickup_scheduled_at: transitionedAt,
      })
      .eq('listing_id', listingId)
      .eq('collector_id', collectorId)
      .eq('status', 'claimed')
      .select('id')
      .maybeSingle<{ id: string }>();

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to link pickup claim to route',
        code: 'CLAIM_ROUTE_LINK_FAILED',
        details: error.message,
      });
    }

    if (!data) {
      throw new BadRequestException({
        error: 'Pickup claim not found for listing',
        code: 'CLAIM_NOT_FOUND',
        details: { listingId },
      });
    }

    await this.statusTransitionService.transitionListingStatus(
      listingId,
      'pickup_planned',
      collectorId,
      'collector',
    );
  }

  private async fetchRouteRow(routeId: string): Promise<PickupRouteRow | null> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('pickup_routes')
      .select(ROUTE_SELECT)
      .eq('id', routeId)
      .maybeSingle<PickupRouteRow>();

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to load pickup route',
        code: 'ROUTE_LOAD_FAILED',
        details: error.message,
      });
    }

    return data;
  }

  private async fetchRouteStops(
    routeId: string,
  ): Promise<PickupRouteStopRow[]> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('pickup_route_stops')
      .select(ROUTE_STOP_SELECT)
      .eq('route_id', routeId)
      .order('sequence_number', { ascending: true });

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to load pickup route stops',
        code: 'ROUTE_STOPS_LOAD_FAILED',
        details: error.message,
      });
    }

    return data ?? [];
  }

  private async canAccessRoute(
    route: PickupRouteRow,
    stops: PickupRouteStopRow[],
    requesterId: string,
    requesterRole: UserRole,
  ): Promise<boolean> {
    if (requesterRole === 'collector') {
      return route.collector_id === requesterId;
    }

    if (requesterRole === 'household') {
      return this.householdHasListingInRoute(requesterId, stops);
    }

    throw new ForbiddenException({
      error: 'Role is not allowed to view pickup routes',
      code: 'INSUFFICIENT_ROLE',
    });
  }

  private async householdHasListingInRoute(
    householdId: string,
    stops: PickupRouteStopRow[],
  ): Promise<boolean> {
    if (stops.length === 0) {
      return false;
    }

    const listingIds = stops.map((stop) => stop.listing_id);
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('waste_listings')
      .select('id')
      .in('id', listingIds)
      .eq('household_id', householdId);

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to validate route access',
        code: 'ROUTE_ACCESS_VALIDATION_FAILED',
        details: error.message,
      });
    }

    return (data ?? []).length > 0;
  }

  private calculateStopArrivalMinutes(
    orderedStops: RoutePreviewStop[],
  ): number[] {
    const arrivalMinutes: number[] = [];
    let cumulative = 0;

    for (const stop of orderedStops) {
      cumulative += Math.round(stop.distanceFromPreviousKm * 3) + 10;
      arrivalMinutes.push(cumulative);
    }

    return arrivalMinutes;
  }

  private async getCollectorBaseCoordinates(
    collectorId: string,
  ): Promise<CollectorBaseCoordinates | null> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('collector_profiles')
      .select('base_latitude, base_longitude')
      .eq('id', collectorId)
      .maybeSingle<{
        base_latitude: number | string | null;
        base_longitude: number | string | null;
      }>();

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to load collector base coordinates',
        code: 'COLLECTOR_BASE_LOAD_FAILED',
        details: error.message,
      });
    }

    if (
      data?.base_latitude === null ||
      data?.base_longitude === null ||
      data?.base_latitude === undefined ||
      data?.base_longitude === undefined
    ) {
      return null;
    }

    const latitude = Number(data.base_latitude);
    const longitude = Number(data.base_longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    return { latitude, longitude };
  }

  private async fetchListings(listingIds: string[]): Promise<ListingRow[]> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('waste_listings')
      .select(LISTING_SELECT)
      .in('id', listingIds);

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to load waste listings for route preview',
        code: 'LISTINGS_LOAD_FAILED',
        details: error.message,
      });
    }

    return data ?? [];
  }

  private validateListingEligibility(
    requestedIds: string[],
    listings: ListingRow[],
    collectorId: string,
  ): ListingEligibilityIssue[] {
    const listingById = new Map(
      listings.map((listing) => [listing.id, listing]),
    );
    const issues: ListingEligibilityIssue[] = [];

    for (const listingId of requestedIds) {
      const listing = listingById.get(listingId);

      if (!listing) {
        issues.push({ listingId, reason: 'not_found' });
        continue;
      }

      if (listing.status !== 'claimed') {
        issues.push({
          listingId,
          reason: 'invalid_status',
          status: listing.status,
        });
        continue;
      }

      if (listing.claimed_by !== collectorId) {
        issues.push({
          listingId,
          reason: 'not_claimed_by_collector',
        });
      }
    }

    return issues;
  }

  private mapListingsToRouteStops(listings: ListingRow[]): RouteStop[] {
    return listings.map((listing) => ({
      id: listing.id,
      latitude: Number(listing.latitude),
      longitude: Number(listing.longitude),
      estimated_weight_kg: Number(listing.estimated_weight_kg),
      address: listing.address,
    }));
  }

  private mapOptimizedStops(
    orderedStops: RouteStop[],
    distances: number[],
  ): RoutePreviewStop[] {
    return orderedStops.map((stop, index) => ({
      listingId: stop.id,
      sequenceNumber: index + 1,
      distanceFromPreviousKm: distances[index] ?? 0,
      latitude: stop.latitude,
      longitude: stop.longitude,
      estimated_weight_kg: stop.estimated_weight_kg,
      address: stop.address,
    }));
  }

  private mapPickupRoute(
    route: PickupRouteRow,
    stops: PickupRouteStopRow[],
  ): PickupRoute {
    return {
      id: route.id,
      collector_id: route.collector_id,
      status: route.status as PickupRoute['status'],
      total_distance_km: Number(route.total_distance_km),
      estimated_duration_minutes: route.estimated_duration_minutes,
      total_weight_kg: Number(route.total_weight_kg ?? 0),
      estimated_cost: route.estimated_cost ?? 0,
      actual_cost: route.actual_cost,
      started_at: route.started_at,
      completed_at: route.completed_at,
      cancelled_at: route.cancelled_at,
      cancel_reason: route.cancel_reason,
      notes: route.notes,
      created_at: route.created_at,
      updated_at: route.updated_at,
      stops: stops.map((stop) => this.mapPickupRouteStop(stop)),
    };
  }

  private mapPickupRouteStop(stop: PickupRouteStopRow): PickupRouteStop {
    return {
      id: stop.id,
      route_id: stop.route_id,
      listing_id: stop.listing_id,
      sequence_number: stop.sequence_number,
      distance_from_previous_km:
        stop.distance_from_previous_km === null
          ? null
          : Number(stop.distance_from_previous_km),
      estimated_arrival_minutes: stop.estimated_arrival_minutes,
      status: stop.status as PickupRouteStop['status'],
      arrived_at: stop.arrived_at,
      completed_at: stop.completed_at,
      notes: stop.notes,
    };
  }

  private async getCollectorRoute(
    routeId: string,
    collectorId: string,
  ): Promise<PickupRoute> {
    const route = await this.getCollectorRouteOrThrow(routeId, collectorId);
    const stops = await this.fetchRouteStops(routeId);
    return this.mapPickupRoute(route, stops);
  }

  private async getCollectorRouteOrThrow(
    routeId: string,
    collectorId: string,
  ): Promise<PickupRouteRow> {
    const route = await this.fetchRouteRow(routeId);

    if (!route || route.collector_id !== collectorId) {
      throw new NotFoundException({
        error: 'Pickup route not found',
        code: 'ROUTE_NOT_FOUND',
      });
    }

    return route;
  }

  private async fetchRouteStopOrThrow(
    routeId: string,
    stopId: string,
  ): Promise<PickupRouteStopRow> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('pickup_route_stops')
      .select(ROUTE_STOP_SELECT)
      .eq('id', stopId)
      .eq('route_id', routeId)
      .maybeSingle<PickupRouteStopRow>();

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to load pickup route stop',
        code: 'ROUTE_STOP_LOAD_FAILED',
        details: error.message,
      });
    }

    if (!data) {
      throw new NotFoundException({
        error: 'Pickup route stop not found',
        code: 'ROUTE_STOP_NOT_FOUND',
      });
    }

    return data;
  }

  private assertRouteStatusTransition(
    currentStatus: PickupRouteStatus,
    newStatus: PickupRouteStatus,
  ): void {
    if (currentStatus === newStatus) {
      throw new BadRequestException({
        error: 'Pickup route is already in the requested status',
        code: 'INVALID_ROUTE_TRANSITION',
      });
    }

    if (!ROUTE_STATUS_TRANSITIONS[currentStatus].includes(newStatus)) {
      throw new BadRequestException({
        error: `Invalid route transition from '${currentStatus}' to '${newStatus}'`,
        code: 'INVALID_ROUTE_TRANSITION',
      });
    }
  }

  private assertStopStatusTransition(
    currentStatus: PickupRouteStopStatus,
    newStatus: PickupRouteStopStatus,
  ): void {
    if (currentStatus === newStatus) {
      throw new BadRequestException({
        error: 'Pickup route stop is already in the requested status',
        code: 'INVALID_STOP_TRANSITION',
      });
    }

    if (!STOP_STATUS_TRANSITIONS[currentStatus].includes(newStatus)) {
      throw new BadRequestException({
        error: `Invalid stop transition from '${currentStatus}' to '${newStatus}'`,
        code: 'INVALID_STOP_TRANSITION',
      });
    }
  }

  private async persistRouteStatusUpdate(
    routeId: string,
    currentStatus: string,
    updatePayload: Record<string, unknown>,
  ): Promise<void> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('pickup_routes')
      .update(updatePayload)
      .eq('id', routeId)
      .eq('status', currentStatus)
      .select('id')
      .maybeSingle<{ id: string }>();

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to update pickup route status',
        code: 'ROUTE_STATUS_UPDATE_FAILED',
        details: error.message,
      });
    }

    if (!data) {
      throw new BadRequestException({
        error: 'Pickup route status changed before update could complete',
        code: 'INVALID_ROUTE_TRANSITION',
      });
    }
  }

  private async persistStopStatusUpdate(
    stopId: string,
    routeId: string,
    currentStatus: PickupRouteStopStatus,
    updatePayload: Record<string, unknown>,
  ): Promise<void> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('pickup_route_stops')
      .update(updatePayload)
      .eq('id', stopId)
      .eq('route_id', routeId)
      .eq('status', currentStatus)
      .select('id')
      .maybeSingle<{ id: string }>();

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to update pickup route stop status',
        code: 'ROUTE_STOP_STATUS_UPDATE_FAILED',
        details: error.message,
      });
    }

    if (!data) {
      throw new BadRequestException({
        error: 'Pickup route stop status changed before update could complete',
        code: 'INVALID_STOP_TRANSITION',
      });
    }
  }

  private async transitionListingToPickedUp(
    listingId: string,
    collectorId: string,
    routeId: string,
    stopId: string,
  ): Promise<void> {
    await this.statusTransitionService.transitionListingStatus(
      listingId,
      'picked_up',
      collectorId,
      'collector',
    );

    this.traceabilityService.emitEvent({
      eventType: 'picked_up',
      entityType: 'waste_listing',
      entityId: listingId,
      actorId: collectorId,
      actorRole: 'collector',
      previousStatus: 'pickup_planned',
      newStatus: 'picked_up',
      linkedEntityType: 'pickup_route',
      linkedEntityId: routeId,
      metadata: {
        stopId,
      },
    });
  }

  private async revertListingToClaimed(listingId: string): Promise<void> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('waste_listings')
      .update({ status: 'claimed' })
      .eq('id', listingId)
      .eq('status', 'pickup_planned')
      .select('id')
      .maybeSingle<{ id: string }>();

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to revert listing to claimed',
        code: 'LISTING_REVERT_FAILED',
        details: error.message,
      });
    }

    if (!data) {
      throw new BadRequestException({
        error: 'Listing is not in pickup_planned status',
        code: 'LISTING_NOT_REVERTIBLE',
        details: { listingId },
      });
    }
  }

  private async fetchListingMap(
    listingIds: string[],
  ): Promise<Map<string, ListingRow>> {
    const listings = await this.fetchListings(listingIds);
    return new Map(listings.map((listing) => [listing.id, listing]));
  }

  private mapListingRowToRouteStop(
    listing: ListingRow | undefined,
    listingId: string,
  ): RouteStop {
    if (!listing) {
      throw new InternalServerErrorException({
        error: 'Route stop listing data is missing',
        code: 'LISTING_DATA_MISSING',
        details: { listingId },
      });
    }

    return {
      id: listing.id,
      latitude: Number(listing.latitude),
      longitude: Number(listing.longitude),
      estimated_weight_kg: Number(listing.estimated_weight_kg),
      address: listing.address,
    };
  }

  private resolveRecalculationOrigin(
    collectorBase: CollectorBaseCoordinates,
    fixedStops: PickupRouteStopRow[],
    listingMap: Map<string, ListingRow>,
  ): CollectorBaseCoordinates {
    if (fixedStops.length === 0) {
      return collectorBase;
    }

    const lastFixedStop = fixedStops[fixedStops.length - 1];
    const listing = listingMap.get(lastFixedStop.listing_id);

    if (!listing) {
      return collectorBase;
    }

    return {
      latitude: Number(listing.latitude),
      longitude: Number(listing.longitude),
    };
  }

  private mergeRecalculatedStops(
    fixedStops: PickupRouteStopRow[],
    remainingStops: PickupRouteStopRow[],
    optimizedPreviewStops: RoutePreviewStop[],
  ): PickupRouteStopRow[] {
    const remainingByListingId = new Map(
      remainingStops.map((stop) => [stop.listing_id, stop]),
    );
    const reorderedRemaining = optimizedPreviewStops.map((previewStop) => {
      const existing = remainingByListingId.get(previewStop.listingId);

      if (!existing) {
        throw new InternalServerErrorException({
          error:
            'Recalculated stop could not be matched to existing route stop',
          code: 'ROUTE_RECALC_MATCH_FAILED',
        });
      }

      return existing;
    });

    return [...fixedStops, ...reorderedRemaining];
  }

  private calculateStopChainMetrics(
    collectorBase: CollectorBaseCoordinates,
    finalStops: PickupRouteStopRow[],
    listingMap: Map<string, ListingRow>,
  ): {
    totalDistanceKm: number;
    estimatedDurationMinutes: number;
    distances: number[];
    arrivalMinutes: number[];
  } {
    let current: CollectorBaseCoordinates = collectorBase;
    const distances: number[] = [];
    const arrivalMinutes: number[] = [];
    let cumulative = 0;

    for (const stop of finalStops) {
      const listing = listingMap.get(stop.listing_id);

      if (!listing) {
        throw new InternalServerErrorException({
          error: 'Route stop listing data is missing during recalculation',
          code: 'LISTING_DATA_MISSING',
          details: { listingId: stop.listing_id },
        });
      }

      const next = {
        latitude: Number(listing.latitude),
        longitude: Number(listing.longitude),
      };
      const distance = roundDistanceKm(haversineDistance(current, next));

      distances.push(distance);
      cumulative += Math.round(distance * 3) + 10;
      arrivalMinutes.push(cumulative);
      current = next;
    }

    const totalDistanceKm = roundDistanceKm(
      distances.reduce((sum, distance) => sum + distance, 0),
    );
    const activeStopCount = finalStops.filter(
      (stop) => stop.status !== 'skipped',
    ).length;

    return {
      totalDistanceKm,
      estimatedDurationMinutes: Math.round(
        totalDistanceKm * 3 + activeStopCount * 10,
      ),
      distances,
      arrivalMinutes,
    };
  }

  private async persistRecalculatedRoute(
    routeId: string,
    finalStops: PickupRouteStopRow[],
    chainMetrics: {
      totalDistanceKm: number;
      estimatedDurationMinutes: number;
      distances: number[];
      arrivalMinutes: number[];
    },
    totals: {
      totalWeightKg: number;
      estimatedDurationMinutes: number;
      estimatedCost: number;
    },
  ): Promise<void> {
    const admin = this.supabaseService.getAdminClient();
    const { error: routeError } = await admin
      .from('pickup_routes')
      .update({
        total_distance_km: chainMetrics.totalDistanceKm,
        estimated_duration_minutes: totals.estimatedDurationMinutes,
        total_weight_kg: totals.totalWeightKg,
        estimated_cost: totals.estimatedCost,
      })
      .eq('id', routeId);

    if (routeError) {
      throw new InternalServerErrorException({
        error: 'Failed to update recalculated route totals',
        code: 'ROUTE_RECALC_UPDATE_FAILED',
        details: routeError.message,
      });
    }

    for (const [index, stop] of finalStops.entries()) {
      const { error } = await admin
        .from('pickup_route_stops')
        .update({
          sequence_number: index + 1,
          distance_from_previous_km: chainMetrics.distances[index] ?? 0,
          estimated_arrival_minutes: chainMetrics.arrivalMinutes[index] ?? null,
        })
        .eq('id', stop.id)
        .eq('route_id', routeId);

      if (error) {
        throw new InternalServerErrorException({
          error: 'Failed to update recalculated route stop',
          code: 'ROUTE_STOP_RECALC_UPDATE_FAILED',
          details: error.message,
        });
      }
    }
  }
}

function roundDistanceKm(distanceKm: number): number {
  return Math.round(distanceKm * 1000) / 1000;
}
