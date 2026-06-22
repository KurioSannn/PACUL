import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables } from '../../common/config/env.validation';
import type { UserRole } from '../profiles/profiles.types';
import { assertWasteImageOwnership } from '../storage/waste-image.validation';
import type { WasteCategory } from '../waste-categories/waste-categories.types';
import { SupabaseService } from '../../supabase/supabase.service';
import type { CreateWasteListingDto } from './dto/create-waste-listing.dto';
import type { ListingFiltersDto } from './dto/listing-filters.dto';
import type { UpdateWasteListingDto } from './dto/update-waste-listing.dto';
import { haversineDistanceKm } from './geo.utils';
import { TraceabilityService } from '../traceability/traceability.service';
import { StatusTransitionService } from './status-transition.service';
import type {
  CollectorAvailableWasteListing,
  CollectorListingFilters,
  PaginatedCollectorAvailableWaste,
  PaginatedWasteListings,
  WasteListing,
  WasteListingImage,
  WasteListingStatus,
  WasteListingWithDetails,
} from './waste-listings.types';

interface WasteCategoryRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon_key: string | null;
  unit: string;
  typical_price_per_kg: number | string | null;
  ai_model_class: string | null;
  sort_order: number;
}

interface WasteListingImageRow {
  id: string;
  listing_id: string;
  image_path: string;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

interface WasteListingRow {
  id: string;
  household_id: string;
  category_id: string;
  classification_id: string | null;
  title: string;
  description: string | null;
  estimated_weight_kg: number | string;
  actual_weight_kg: number | string | null;
  status: WasteListingStatus;
  address: string;
  latitude: number | string;
  longitude: number | string;
  district: string | null;
  city: string | null;
  province: string | null;
  available_from: string | null;
  available_until: string | null;
  notes: string | null;
  pickup_fee: number | string;
  claimed_by: string | null;
  claimed_at: string | null;
  picked_up_at: string | null;
  sorted_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  created_at: string;
  updated_at: string;
}

interface WasteListingWithJoinRow extends WasteListingRow {
  category: WasteCategoryRow | WasteCategoryRow[] | null;
  images: WasteListingImageRow[] | null;
}

interface HouseholdProfileJoin {
  display_name: string;
}

interface CollectorMarketplaceRow {
  id: string;
  title: string;
  description: string | null;
  estimated_weight_kg: number | string;
  status: WasteListingStatus;
  latitude: number | string;
  longitude: number | string;
  district: string | null;
  city: string | null;
  province: string | null;
  available_from: string | null;
  available_until: string | null;
  pickup_fee: number | string;
  created_at: string;
  category: WasteCategoryRow | WasteCategoryRow[] | null;
  household: HouseholdProfileJoin | HouseholdProfileJoin[] | null;
  images: WasteListingImageRow[] | null;
}

interface CollectorBaseCoordinates {
  latitude: number;
  longitude: number;
}

const DISTANCE_FILTER_FETCH_LIMIT = 200;

const LISTING_WITH_DETAILS_SELECT = `
  id,
  household_id,
  category_id,
  classification_id,
  title,
  description,
  estimated_weight_kg,
  actual_weight_kg,
  status,
  address,
  latitude,
  longitude,
  district,
  city,
  province,
  available_from,
  available_until,
  notes,
  pickup_fee,
  claimed_by,
  claimed_at,
  picked_up_at,
  sorted_at,
  cancelled_at,
  cancel_reason,
  created_at,
  updated_at,
  category:waste_categories (
    id,
    code,
    name,
    description,
    icon_key,
    unit,
    typical_price_per_kg,
    ai_model_class,
    sort_order
  ),
  images:waste_listing_images (
    id,
    listing_id,
    image_path,
    is_primary,
    sort_order,
    created_at
  )
`;

const COLLECTOR_MARKETPLACE_SELECT = `
  id,
  title,
  description,
  estimated_weight_kg,
  status,
  latitude,
  longitude,
  district,
  city,
  province,
  available_from,
  available_until,
  pickup_fee,
  created_at,
  category:waste_categories (
    id,
    code,
    name,
    description,
    icon_key,
    unit,
    typical_price_per_kg,
    ai_model_class,
    sort_order
  ),
  household:user_profiles!household_id (
    display_name
  ),
  images:waste_listing_images (
    id,
    listing_id,
    image_path,
    is_primary,
    sort_order,
    created_at
  )
`;

@Injectable()
export class ListingService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly configService: ConfigService<EnvironmentVariables, true>,
    private readonly traceabilityService: TraceabilityService,
    private readonly statusTransitionService: StatusTransitionService,
  ) {}

  async createListing(
    householdId: string,
    dto: CreateWasteListingDto,
  ): Promise<WasteListingWithDetails> {
    await this.assertCategoryExists(dto.category_id);

    if (dto.classification_id) {
      await this.assertClassificationOwnership(
        dto.classification_id,
        householdId,
      );
    }

    const imagePaths = dto.imagePaths ?? [];
    this.assertImagePathsOwnership(imagePaths, householdId);

    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('waste_listings')
      .insert({
        household_id: householdId,
        category_id: dto.category_id,
        classification_id: dto.classification_id ?? null,
        title: dto.title,
        description: dto.description ?? null,
        estimated_weight_kg: dto.estimated_weight_kg,
        status: 'draft',
        address: dto.address,
        latitude: dto.latitude,
        longitude: dto.longitude,
        district: dto.district ?? null,
        city: dto.city ?? null,
        province: dto.province ?? null,
        available_from: dto.available_from ?? null,
        available_until: dto.available_until ?? null,
        notes: dto.notes ?? null,
      })
      .select('id')
      .single<{ id: string }>();

    if (error || !data) {
      throw new InternalServerErrorException({
        error: 'Failed to create waste listing',
        code: 'LISTING_CREATE_FAILED',
        details: error?.message,
      });
    }

    if (imagePaths.length > 0) {
      await this.replaceListingImages(data.id, imagePaths);
    }

    const listing = await this.fetchListingWithDetailsById(data.id);

    if (!listing) {
      throw new InternalServerErrorException({
        error: 'Failed to load created waste listing',
        code: 'LISTING_LOAD_FAILED',
      });
    }

    this.traceabilityService.emitEvent({
      eventType: 'waste_uploaded',
      entityType: 'waste_listing',
      entityId: listing.id,
      actorId: householdId,
      actorRole: 'household',
      newStatus: 'draft',
      metadata: {
        categoryId: listing.category_id,
        estimatedWeightKg: listing.estimated_weight_kg,
        imageCount: listing.images.length,
      },
    });

    return listing;
  }

  async getListingById(
    id: string,
    requesterId: string,
    role: UserRole,
  ): Promise<WasteListingWithDetails> {
    if (role === 'industry') {
      throw new ForbiddenException({
        error: 'Industry users cannot access waste listings',
        code: 'INSUFFICIENT_ROLE',
      });
    }

    const listing = await this.fetchListingWithDetailsById(id);

    if (!listing || !this.canAccessListing(listing, requesterId, role)) {
      throw new NotFoundException({
        error: 'Waste listing not found',
        code: 'LISTING_NOT_FOUND',
      });
    }

    return listing;
  }

  async listListings(
    filters: ListingFiltersDto,
    requesterId: string,
    role: UserRole,
  ): Promise<PaginatedWasteListings> {
    if (role === 'industry') {
      throw new ForbiddenException({
        error: 'Industry users cannot access waste listings',
        code: 'INSUFFICIENT_ROLE',
      });
    }

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const admin = this.supabaseService.getAdminClient();

    let query = admin
      .from('waste_listings')
      .select(LISTING_WITH_DETAILS_SELECT, { count: 'exact' });

    if (role === 'household') {
      query = query.eq('household_id', requesterId);

      if (filters.status) {
        query = query.eq('status', filters.status);
      }
    } else {
      const handledCategoryIds =
        await this.getActiveHandledCategoryIds(requesterId);

      if (handledCategoryIds.length === 0) {
        return { items: [], page, limit, total: 0 };
      }

      query = query
        .eq('status', 'available')
        .in('category_id', handledCategoryIds);
    }

    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to list waste listings',
        code: 'LISTING_LIST_FAILED',
        details: error.message,
      });
    }

    return {
      items: (data ?? []).map((row) =>
        this.mapListingWithDetails(row as WasteListingWithJoinRow),
      ),
      page,
      limit,
      total: count ?? 0,
    };
  }

  async getAvailableWasteForCollector(
    collectorId: string,
    filters: CollectorListingFilters,
  ): Promise<PaginatedCollectorAvailableWaste> {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 20, 50);

    const handledCategoryIds =
      await this.getActiveHandledCategoryIds(collectorId);

    if (handledCategoryIds.length === 0) {
      return { items: [], page, limit, total: 0 };
    }

    const collectorBase = await this.getCollectorBaseCoordinates(collectorId);
    const distanceFilterCenter = this.resolveDistanceFilterCenter(
      filters,
      collectorBase,
    );
    const useDistanceFilter =
      distanceFilterCenter !== null &&
      filters.radiusKm !== undefined &&
      filters.radiusKm > 0;

    if (
      filters.radiusKm !== undefined &&
      filters.radiusKm > 0 &&
      distanceFilterCenter === null
    ) {
      throw new BadRequestException({
        error:
          'Distance filter requires lat/lng query params or collector base coordinates',
        code: 'LISTING_FILTER_INVALID',
      });
    }

    const admin = this.supabaseService.getAdminClient();
    let query = admin
      .from('waste_listings')
      .select(COLLECTOR_MARKETPLACE_SELECT)
      .eq('status', 'available')
      .in('category_id', handledCategoryIds);

    if (filters.city) {
      query = query.ilike('city', filters.city);
    }

    if (filters.categoryId) {
      if (!handledCategoryIds.includes(filters.categoryId)) {
        return { items: [], page, limit, total: 0 };
      }

      query = query.eq('category_id', filters.categoryId);
    }

    if (useDistanceFilter) {
      // TODO: PostGIS ST_DWithin for scale
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(DISTANCE_FILTER_FETCH_LIMIT);

      if (error) {
        throw new InternalServerErrorException({
          error: 'Failed to load collector marketplace listings',
          code: 'COLLECTOR_MARKETPLACE_LOAD_FAILED',
          details: error.message,
        });
      }

      const mapped = (data ?? []).map((row) =>
        this.mapCollectorMarketplaceListing(
          row as CollectorMarketplaceRow,
          collectorBase,
        ),
      );

      const filtered = mapped
        .filter((listing) => {
          const distanceFromFilterCenter = haversineDistanceKm(
            distanceFilterCenter.latitude,
            distanceFilterCenter.longitude,
            listing.latitude,
            listing.longitude,
          );

          return distanceFromFilterCenter <= (filters.radiusKm ?? 0);
        })
        .sort((left, right) => {
          const leftDistance =
            left.distance_km ??
            haversineDistanceKm(
              distanceFilterCenter.latitude,
              distanceFilterCenter.longitude,
              left.latitude,
              left.longitude,
            );
          const rightDistance =
            right.distance_km ??
            haversineDistanceKm(
              distanceFilterCenter.latitude,
              distanceFilterCenter.longitude,
              right.latitude,
              right.longitude,
            );

          return leftDistance - rightDistance;
        });

      const start = (page - 1) * limit;

      return {
        items: filtered.slice(start, start + limit),
        page,
        limit,
        total: filtered.length,
      };
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to load collector marketplace listings',
        code: 'COLLECTOR_MARKETPLACE_LOAD_FAILED',
        details: error.message,
      });
    }

    return {
      items: (data ?? []).map((row) =>
        this.mapCollectorMarketplaceListing(
          row as CollectorMarketplaceRow,
          collectorBase,
        ),
      ),
      page,
      limit,
      total: count ?? 0,
    };
  }

  async updateListing(
    id: string,
    householdId: string,
    dto: UpdateWasteListingDto,
  ): Promise<WasteListingWithDetails> {
    const existing = await this.fetchListingRow(id);

    if (!existing || existing.household_id !== householdId) {
      throw new NotFoundException({
        error: 'Waste listing not found',
        code: 'LISTING_NOT_FOUND',
      });
    }

    if (existing.status !== 'draft') {
      throw new BadRequestException({
        error: 'Only draft listings can be updated',
        code: 'LISTING_NOT_EDITABLE',
      });
    }

    if (dto.category_id) {
      await this.assertCategoryExists(dto.category_id);
    }

    if (dto.classification_id) {
      await this.assertClassificationOwnership(
        dto.classification_id,
        householdId,
      );
    }

    if (dto.imagePaths) {
      this.assertImagePathsOwnership(dto.imagePaths, householdId);
    }

    const updatePayload = this.buildUpdatePayload(dto);

    if (Object.keys(updatePayload).length > 0) {
      const admin = this.supabaseService.getAdminClient();
      const { error } = await admin
        .from('waste_listings')
        .update(updatePayload)
        .eq('id', id)
        .eq('household_id', householdId)
        .eq('status', 'draft');

      if (error) {
        throw new InternalServerErrorException({
          error: 'Failed to update waste listing',
          code: 'LISTING_UPDATE_FAILED',
          details: error.message,
        });
      }
    }

    if (dto.imagePaths) {
      await this.replaceListingImages(id, dto.imagePaths);
    }

    const listing = await this.fetchListingWithDetailsById(id);

    if (!listing) {
      throw new InternalServerErrorException({
        error: 'Failed to load updated waste listing',
        code: 'LISTING_LOAD_FAILED',
      });
    }

    return listing;
  }

  validatePublishReadiness(listing: WasteListingWithDetails): string[] {
    const issues: string[] = [];

    if (!listing.images || listing.images.length === 0) {
      issues.push('At least one image is required before publishing');
    }

    if (listing.estimated_weight_kg <= 0) {
      issues.push('Estimated weight must be greater than 0');
    }

    if (
      !Number.isFinite(listing.latitude) ||
      !Number.isFinite(listing.longitude)
    ) {
      issues.push('Pickup coordinates are required before publishing');
    }

    return issues;
  }

  async publishListing(
    id: string,
    householdId: string,
  ): Promise<WasteListingWithDetails> {
    const listing = await this.fetchListingWithDetailsById(id);

    if (!listing || listing.household_id !== householdId) {
      throw new NotFoundException({
        error: 'Waste listing not found',
        code: 'LISTING_NOT_FOUND',
      });
    }

    if (listing.status !== 'draft') {
      throw new ConflictException({
        error: 'Waste listing has already been published',
        code: 'ALREADY_PUBLISHED',
      });
    }

    const readinessIssues = this.validatePublishReadiness(listing);

    if (readinessIssues.length > 0) {
      throw new BadRequestException({
        error: 'Listing is not ready to publish',
        code: 'LISTING_NOT_READY',
        issues: readinessIssues,
      });
    }

    await this.statusTransitionService.transitionListingStatus(
      id,
      'available',
      householdId,
      'household',
    );

    this.traceabilityService.emitEvent({
      eventType: 'listing_published',
      entityType: 'waste_listing',
      entityId: id,
      actorId: householdId,
      actorRole: 'household',
      previousStatus: 'draft',
      newStatus: 'available',
    });

    const published = await this.fetchListingWithDetailsById(id);

    if (!published) {
      throw new InternalServerErrorException({
        error: 'Failed to load published waste listing',
        code: 'LISTING_LOAD_FAILED',
      });
    }

    return published;
  }

  async cancelListing(
    id: string,
    actorId: string,
    role: UserRole,
    reason?: string,
  ): Promise<WasteListingWithDetails> {
    const listing = await this.fetchListingWithDetailsById(id);

    if (!listing) {
      throw new NotFoundException({
        error: 'Waste listing not found',
        code: 'LISTING_NOT_FOUND',
      });
    }

    if (role === 'household') {
      if (listing.household_id !== actorId) {
        throw new NotFoundException({
          error: 'Waste listing not found',
          code: 'LISTING_NOT_FOUND',
        });
      }

      if (listing.status !== 'draft' && listing.status !== 'available') {
        throw new BadRequestException({
          error: 'Household can only cancel draft or available listings',
          code: 'CANNOT_CANCEL',
        });
      }
    } else if (role === 'collector') {
      if (listing.status !== 'claimed' && listing.status !== 'pickup_planned') {
        throw new BadRequestException({
          error: 'Collector can only cancel claimed or pickup_planned listings',
          code: 'CANNOT_CANCEL',
        });
      }

      if (listing.claimed_by !== actorId) {
        throw new NotFoundException({
          error: 'Waste listing not found',
          code: 'LISTING_NOT_FOUND',
        });
      }
    } else {
      throw new ForbiddenException({
        error: 'Role is not allowed to cancel waste listings',
        code: 'INSUFFICIENT_ROLE',
      });
    }

    await this.statusTransitionService.transitionListingStatus(
      id,
      'cancelled',
      actorId,
      role,
      { cancel_reason: reason },
    );

    this.traceabilityService.emitEvent({
      eventType: 'listing_cancelled',
      entityType: 'waste_listing',
      entityId: id,
      actorId,
      actorRole: role,
      previousStatus: listing.status,
      newStatus: 'cancelled',
      metadata: {
        cancelReason: reason ?? null,
      },
    });

    const cancelled = await this.fetchListingWithDetailsById(id);

    if (!cancelled) {
      throw new InternalServerErrorException({
        error: 'Failed to load cancelled waste listing',
        code: 'LISTING_LOAD_FAILED',
      });
    }

    return cancelled;
  }

  private canAccessListing(
    listing: WasteListing,
    requesterId: string,
    role: UserRole,
  ): boolean {
    if (role === 'household') {
      return (
        listing.household_id === requesterId || listing.status === 'available'
      );
    }

    if (role === 'collector') {
      return (
        listing.status === 'available' || listing.claimed_by === requesterId
      );
    }

    return false;
  }

  private async getActiveHandledCategoryIds(
    collectorId: string,
  ): Promise<string[]> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('collector_handled_categories')
      .select('category_id')
      .eq('collector_id', collectorId)
      .eq('is_active', true);

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to load collector handled categories',
        code: 'HANDLED_CATEGORIES_LOAD_FAILED',
        details: error.message,
      });
    }

    return (data ?? []).map((row) => row.category_id as string);
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

  private resolveDistanceFilterCenter(
    filters: CollectorListingFilters,
    collectorBase: CollectorBaseCoordinates | null,
  ): CollectorBaseCoordinates | null {
    if (
      filters.latitude !== undefined &&
      filters.longitude !== undefined &&
      Number.isFinite(filters.latitude) &&
      Number.isFinite(filters.longitude)
    ) {
      return {
        latitude: filters.latitude,
        longitude: filters.longitude,
      };
    }

    return collectorBase;
  }

  private mapCollectorMarketplaceListing(
    row: CollectorMarketplaceRow,
    collectorBase: CollectorBaseCoordinates | null,
  ): CollectorAvailableWasteListing {
    const categoryRow = Array.isArray(row.category)
      ? row.category[0]
      : row.category;
    const householdRow = Array.isArray(row.household)
      ? row.household[0]
      : row.household;

    if (!categoryRow) {
      throw new InternalServerErrorException({
        error: 'Marketplace listing is missing linked category',
        code: 'LISTING_CATEGORY_MISSING',
      });
    }

    if (!householdRow?.display_name) {
      throw new InternalServerErrorException({
        error: 'Marketplace listing is missing household display name',
        code: 'LISTING_HOUSEHOLD_MISSING',
      });
    }

    const latitude = Number(row.latitude);
    const longitude = Number(row.longitude);
    const images = [...(row.images ?? [])].sort(
      (left, right) => left.sort_order - right.sort_order,
    );

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      estimated_weight_kg: Number(row.estimated_weight_kg),
      status: 'available',
      city: row.city,
      district: row.district,
      province: row.province,
      latitude,
      longitude,
      available_from: row.available_from,
      available_until: row.available_until,
      pickup_fee: Number(row.pickup_fee ?? 0),
      created_at: row.created_at,
      category: this.mapCategory(categoryRow),
      household_display_name: householdRow.display_name,
      images: images.map((image) => this.mapImage(image)),
      distance_km: collectorBase
        ? Number(
            haversineDistanceKm(
              collectorBase.latitude,
              collectorBase.longitude,
              latitude,
              longitude,
            ).toFixed(2),
          )
        : null,
    };
  }

  private async assertCategoryExists(categoryId: string): Promise<void> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('waste_categories')
      .select('id')
      .eq('id', categoryId)
      .eq('is_active', true)
      .maybeSingle<{ id: string }>();

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to validate waste category',
        code: 'CATEGORY_VALIDATION_FAILED',
        details: error.message,
      });
    }

    if (!data) {
      throw new NotFoundException({
        error: 'Waste category not found',
        code: 'CATEGORY_NOT_FOUND',
      });
    }
  }

  private async assertClassificationOwnership(
    classificationId: string,
    householdId: string,
  ): Promise<void> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('ai_classifications')
      .select('id, user_id')
      .eq('id', classificationId)
      .maybeSingle<{ id: string; user_id: string }>();

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to validate classification ownership',
        code: 'CLASSIFICATION_VALIDATION_FAILED',
        details: error.message,
      });
    }

    if (!data || data.user_id !== householdId) {
      throw new NotFoundException({
        error: 'Classification not found',
        code: 'CLASSIFICATION_NOT_FOUND',
      });
    }
  }

  private assertImagePathsOwnership(
    imagePaths: string[],
    householdId: string,
  ): void {
    const bucketName = this.getWasteImagesBucket();

    for (const imagePath of imagePaths) {
      assertWasteImageOwnership(imagePath, householdId, bucketName);
    }
  }

  private async replaceListingImages(
    listingId: string,
    imagePaths: string[],
  ): Promise<void> {
    const admin = this.supabaseService.getAdminClient();
    const { error: deleteError } = await admin
      .from('waste_listing_images')
      .delete()
      .eq('listing_id', listingId);

    if (deleteError) {
      throw new InternalServerErrorException({
        error: 'Failed to replace listing images',
        code: 'LISTING_IMAGES_REPLACE_FAILED',
        details: deleteError.message,
      });
    }

    if (imagePaths.length === 0) {
      return;
    }

    const rows = imagePaths.map((imagePath, index) => ({
      listing_id: listingId,
      image_path: imagePath,
      is_primary: index === 0,
      sort_order: index,
    }));

    const { error: insertError } = await admin
      .from('waste_listing_images')
      .insert(rows);

    if (insertError) {
      throw new InternalServerErrorException({
        error: 'Failed to attach listing images',
        code: 'LISTING_IMAGES_INSERT_FAILED',
        details: insertError.message,
      });
    }
  }

  private async fetchListingRow(id: string): Promise<WasteListing | null> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('waste_listings')
      .select(
        'id, household_id, category_id, classification_id, title, description, estimated_weight_kg, actual_weight_kg, status, address, latitude, longitude, district, city, province, available_from, available_until, notes, pickup_fee, claimed_by, claimed_at, picked_up_at, sorted_at, cancelled_at, cancel_reason, created_at, updated_at',
      )
      .eq('id', id)
      .maybeSingle<WasteListingRow>();

    if (error || !data) {
      return null;
    }

    return this.mapListing(data);
  }

  private async fetchListingWithDetailsById(
    id: string,
  ): Promise<WasteListingWithDetails | null> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('waste_listings')
      .select(LISTING_WITH_DETAILS_SELECT)
      .eq('id', id)
      .maybeSingle<WasteListingWithJoinRow>();

    if (error || !data) {
      return null;
    }

    return this.mapListingWithDetails(data);
  }

  private buildUpdatePayload(
    dto: UpdateWasteListingDto,
  ): Record<string, unknown> {
    const payload: Record<string, unknown> = {};

    if (dto.category_id !== undefined) {
      payload.category_id = dto.category_id;
    }

    if (dto.classification_id !== undefined) {
      payload.classification_id = dto.classification_id;
    }

    if (dto.title !== undefined) {
      payload.title = dto.title;
    }

    if (dto.description !== undefined) {
      payload.description = dto.description;
    }

    if (dto.estimated_weight_kg !== undefined) {
      payload.estimated_weight_kg = dto.estimated_weight_kg;
    }

    if (dto.address !== undefined) {
      payload.address = dto.address;
    }

    if (dto.latitude !== undefined) {
      payload.latitude = dto.latitude;
    }

    if (dto.longitude !== undefined) {
      payload.longitude = dto.longitude;
    }

    if (dto.district !== undefined) {
      payload.district = dto.district;
    }

    if (dto.city !== undefined) {
      payload.city = dto.city;
    }

    if (dto.province !== undefined) {
      payload.province = dto.province;
    }

    if (dto.available_from !== undefined) {
      payload.available_from = dto.available_from;
    }

    if (dto.available_until !== undefined) {
      payload.available_until = dto.available_until;
    }

    if (dto.notes !== undefined) {
      payload.notes = dto.notes;
    }

    return payload;
  }

  private getWasteImagesBucket(): string {
    return (
      this.configService.get('SUPABASE_STORAGE_BUCKET_WASTE_IMAGES', {
        infer: true,
      }) ?? 'waste-images'
    );
  }

  private mapListing(row: WasteListingRow): WasteListing {
    return {
      id: row.id,
      household_id: row.household_id,
      category_id: row.category_id,
      classification_id: row.classification_id,
      title: row.title,
      description: row.description,
      estimated_weight_kg: Number(row.estimated_weight_kg),
      actual_weight_kg:
        row.actual_weight_kg === null ? null : Number(row.actual_weight_kg),
      status: row.status,
      address: row.address,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      district: row.district,
      city: row.city,
      province: row.province,
      available_from: row.available_from,
      available_until: row.available_until,
      notes: row.notes,
      pickup_fee: Number(row.pickup_fee ?? 0),
      claimed_by: row.claimed_by,
      claimed_at: row.claimed_at,
      picked_up_at: row.picked_up_at,
      sorted_at: row.sorted_at,
      cancelled_at: row.cancelled_at,
      cancel_reason: row.cancel_reason,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  private mapListingWithDetails(
    row: WasteListingWithJoinRow,
  ): WasteListingWithDetails {
    const categoryRow = Array.isArray(row.category)
      ? row.category[0]
      : row.category;

    if (!categoryRow) {
      throw new InternalServerErrorException({
        error: 'Waste listing is missing linked category',
        code: 'LISTING_CATEGORY_MISSING',
      });
    }

    const images = [...(row.images ?? [])].sort(
      (left, right) => left.sort_order - right.sort_order,
    );

    return {
      ...this.mapListing(row),
      category: this.mapCategory(categoryRow),
      images: images.map((image) => this.mapImage(image)),
    };
  }

  private mapCategory(row: WasteCategoryRow): WasteCategory {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
      icon_key: row.icon_key,
      unit: row.unit,
      typical_price_per_kg:
        row.typical_price_per_kg === null
          ? null
          : Number(row.typical_price_per_kg),
      ai_model_class: row.ai_model_class,
      sort_order: row.sort_order,
    };
  }

  private mapImage(row: WasteListingImageRow): WasteListingImage {
    return {
      id: row.id,
      listing_id: row.listing_id,
      image_path: row.image_path,
      is_primary: row.is_primary,
      sort_order: row.sort_order,
      created_at: row.created_at,
    };
  }
}
