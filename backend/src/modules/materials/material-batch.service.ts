import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { validateMaterialBatchStatusTransition } from '../../common/config/status-transitions';
import { SupabaseService } from '../../supabase/supabase.service';
import { TraceabilityService } from '../traceability/traceability.service';
import { StatusTransitionService } from '../waste-listings/status-transition.service';
import type { WasteListingStatus } from '../waste-listings/waste-listings.types';
import type { AddSourceListingsDto } from './dto/add-source-listings.dto';
import type { CreateMaterialBatchDto } from './dto/create-material-batch.dto';
import type { UpdateMaterialBatchDto } from './dto/update-material-batch.dto';
import type {
  MaterialBatch,
  MaterialBatchCategorySummary,
  MaterialBatchCollectorSummary,
  MaterialBatchMarketplaceDetail,
  MaterialBatchMarketplaceItem,
  MaterialBatchMarketplaceSourceSummary,
  MaterialBatchSourceListingDetails,
  MaterialBatchSourceWithListing,
  MaterialBatchStatus,
  MaterialBatchWithDetails,
  MaterialMarketListing,
  MaterialMarketListingStatus,
  MaterialQualityGrade,
  MaterialMarketplaceFilters,
  PaginatedMaterialMarketplace,
  PublishToMarketInput,
  UpdateMarketListingInput,
} from './materials.types';

interface MaterialBatchRow {
  id: string;
  collector_id: string;
  category_id: string;
  name: string;
  description: string | null;
  total_weight_kg: number | string;
  price_per_kg: number | string;
  min_order_kg: number | string;
  status: string;
  location_address: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
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

interface MaterialBatchSourceRow {
  id: string;
  batch_id: string;
  listing_id: string;
  actual_weight_kg: number | string;
  notes: string | null;
  created_at: string;
}

interface ListingSourceRow {
  id: string;
  title: string;
  status: WasteListingStatus;
  category_id: string;
  claimed_by: string | null;
  estimated_weight_kg: number | string;
  actual_weight_kg: number | string | null;
  address: string;
  city: string | null;
}

interface MarketplaceCategoryRow {
  id: string;
  code: string;
  name: string;
  unit: string;
}

interface MarketplaceCollectorProfileRow {
  id: string;
  display_name: string;
}

interface MarketplaceCollectorRatingRow {
  rating_average: number | string | null;
}

interface MarketplaceBatchJoinRow extends MaterialBatchRow {
  category: MarketplaceCategoryRow | MarketplaceCategoryRow[] | null;
  collector:
    | MarketplaceCollectorProfileRow
    | MarketplaceCollectorProfileRow[]
    | null;
  collector_profile:
    | MarketplaceCollectorRatingRow
    | MarketplaceCollectorRatingRow[]
    | null;
}

interface ListingCityRow {
  city: string | null;
}

interface MaterialMarketListingRow {
  id: string;
  batch_id: string;
  collector_id: string;
  category_id: string;
  title: string;
  quality_grade: string;
  specifications: Record<string, unknown> | null;
  photos: string[] | null;
  asking_price_per_kg: number | string;
  available_weight_kg: number | string;
  status: string;
  view_count: number;
  created_at: string;
  updated_at: string;
}

const BATCH_SELECT = `
  id,
  collector_id,
  category_id,
  name,
  description,
  total_weight_kg,
  price_per_kg,
  min_order_kg,
  status,
  location_address,
  latitude,
  longitude,
  city,
  province,
  available_from,
  available_until,
  notes,
  published_at,
  sold_at,
  created_at,
  updated_at
`;

const SOURCE_SELECT = `
  id,
  batch_id,
  listing_id,
  actual_weight_kg,
  notes,
  created_at
`;

const LISTING_SOURCE_SELECT = `
  id,
  title,
  status,
  category_id,
  claimed_by,
  estimated_weight_kg,
  actual_weight_kg,
  address,
  city
`;

const MARKETPLACE_BATCH_SELECT = `
  id,
  collector_id,
  category_id,
  name,
  description,
  total_weight_kg,
  price_per_kg,
  min_order_kg,
  status,
  location_address,
  latitude,
  longitude,
  city,
  province,
  available_from,
  available_until,
  notes,
  published_at,
  sold_at,
  created_at,
  updated_at,
  category:waste_categories (
    id,
    code,
    name,
    unit
  ),
  collector:user_profiles!collector_id (
    display_name
  ),
  collector_profile:collector_profiles!collector_id (
    rating_average
  )
`;

const MARKET_LISTING_SELECT = `
  id,
  batch_id,
  collector_id,
  category_id,
  title,
  quality_grade,
  specifications,
  photos,
  asking_price_per_kg,
  available_weight_kg,
  status,
  view_count,
  created_at,
  updated_at
`;

const ELIGIBLE_SOURCE_STATUSES: readonly WasteListingStatus[] = [
  'picked_up',
  'sorting',
  'sorted',
];

const PUBLISHABLE_SOURCE_STATUSES: readonly WasteListingStatus[] = [
  'sorted',
  'converted_to_material',
];

@Injectable()
export class MaterialBatchService {
  private readonly logger = new Logger('MaterialBatchService');

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly statusTransitionService: StatusTransitionService,
    private readonly traceabilityService: TraceabilityService,
  ) {}

  async createBatch(
    collectorId: string,
    dto: CreateMaterialBatchDto,
  ): Promise<MaterialBatchWithDetails> {
    await this.validateCategory(dto.category_id);

    if (!dto.sourceListingIds || dto.sourceListingIds.length === 0) {
      throw new BadRequestException({
        error:
          'At least one source listing is required to create a material batch',
        code: 'BATCH_REQUIRES_SOURCES',
      });
    }

    const listingWeights = await this.resolveListingWeights(
      dto.sourceListingIds,
    );
    const initialWeight = listingWeights.reduce(
      (sum, source) => sum + source.weightKg,
      0,
    );

    const batchId = await this.insertBatch(collectorId, dto, initialWeight);

    await this.addSourceListings(batchId, collectorId, {
      sources: listingWeights,
    });

    this.traceabilityService.emitEvent({
      eventType: 'material_batch_created',
      entityType: 'material_batch',
      entityId: batchId,
      actorId: collectorId,
      actorRole: 'collector',
      newStatus: 'draft',
      metadata: {
        categoryId: dto.category_id,
        sourceListingIds: dto.sourceListingIds,
        totalWeightKg: initialWeight,
      },
    });

    return this.getBatch(batchId, collectorId);
  }

  async addSourceListings(
    batchId: string,
    collectorId: string,
    dto: AddSourceListingsDto,
  ): Promise<MaterialBatchWithDetails> {
    const batch = await this.getCollectorBatchOrThrow(batchId, collectorId);

    for (const source of dto.sources) {
      const listing = await this.fetchListingForSource(source.listingId);

      if (!listing) {
        throw new NotFoundException({
          error: 'Waste listing not found',
          code: 'LISTING_NOT_FOUND',
          details: { listingId: source.listingId },
        });
      }

      this.validateSourceListing(listing, batch.category_id, collectorId);

      const admin = this.supabaseService.getAdminClient();
      const { error } = await admin.from('material_batch_sources').insert({
        batch_id: batchId,
        listing_id: source.listingId,
        actual_weight_kg: source.weightKg,
        notes: source.notes ?? null,
      });

      if (error) {
        if (error.code === '23505') {
          throw new ConflictException({
            error: 'Listing is already linked to this material batch',
            code: 'BATCH_SOURCE_ALREADY_EXISTS',
            details: { listingId: source.listingId },
          });
        }

        throw new InternalServerErrorException({
          error: 'Failed to add material batch source',
          code: 'BATCH_SOURCE_CREATE_FAILED',
          details: error.message,
        });
      }

      if (listing.status === 'picked_up') {
        await this.statusTransitionService.transitionListingStatus(
          source.listingId,
          'sorting',
          collectorId,
          'collector',
        );
      }
    }

    await this.recomputeBatchWeight(batchId);

    return this.getBatch(batchId, collectorId);
  }

  async getBatch(
    batchId: string,
    collectorId: string,
  ): Promise<MaterialBatchWithDetails> {
    const batch = await this.getCollectorBatchOrThrow(batchId, collectorId);
    return this.buildBatchWithDetails(batch);
  }

  async listCollectorBatches(
    collectorId: string,
    status?: MaterialBatchStatus,
  ): Promise<MaterialBatch[]> {
    const admin = this.supabaseService.getAdminClient();
    let query = admin
      .from('material_batches')
      .select(BATCH_SELECT)
      .eq('collector_id', collectorId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to load material batches',
        code: 'MATERIAL_BATCH_LIST_FAILED',
        details: error.message,
      });
    }

    return (data ?? []).map((row) => this.mapBatch(row));
  }

  async updateBatch(
    batchId: string,
    collectorId: string,
    dto: UpdateMaterialBatchDto,
  ): Promise<MaterialBatchWithDetails> {
    const batch = await this.getCollectorBatchOrThrow(batchId, collectorId);

    if (batch.status !== 'draft') {
      throw new BadRequestException({
        error: 'Only draft material batches can be updated',
        code: 'BATCH_NOT_EDITABLE',
      });
    }

    const updatePayload = this.buildBatchUpdatePayload(dto);

    if (Object.keys(updatePayload).length === 0) {
      return this.getBatch(batchId, collectorId);
    }

    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('material_batches')
      .update(updatePayload)
      .eq('id', batchId)
      .eq('collector_id', collectorId)
      .eq('status', 'draft')
      .select(BATCH_SELECT)
      .maybeSingle<MaterialBatchRow>();

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to update material batch',
        code: 'MATERIAL_BATCH_UPDATE_FAILED',
        details: error.message,
      });
    }

    if (!data) {
      throw new BadRequestException({
        error: 'Material batch is no longer editable',
        code: 'BATCH_NOT_EDITABLE',
      });
    }

    return this.getBatch(batchId, collectorId);
  }

  async markSortingComplete(
    batchId: string,
    collectorId: string,
  ): Promise<MaterialBatchWithDetails> {
    await this.getCollectorBatchOrThrow(batchId, collectorId);
    const sources = await this.fetchBatchSources(batchId);
    const listingMap = await this.fetchListingMap(
      sources.map((source) => source.listing_id),
    );

    for (const source of sources) {
      const listing = listingMap.get(source.listing_id);

      if (listing?.status === 'sorting') {
        await this.statusTransitionService.transitionListingStatus(
          source.listing_id,
          'sorted',
          collectorId,
          'collector',
        );
      }
    }

    return this.getBatch(batchId, collectorId);
  }

  async publishBatch(
    batchId: string,
    collectorId: string,
  ): Promise<MaterialBatchWithDetails> {
    return this.transitionBatchStatus(batchId, collectorId, 'available');
  }

  async markBatchUnavailable(
    batchId: string,
    collectorId: string,
  ): Promise<MaterialBatchWithDetails> {
    const batch = await this.getCollectorBatchOrThrow(batchId, collectorId);

    if (batch.status !== 'draft' && batch.status !== 'available') {
      throw new BadRequestException({
        error:
          'Only draft or available material batches can be marked unavailable',
        code: 'BATCH_CANNOT_MARK_UNAVAILABLE',
      });
    }

    return this.transitionBatchStatus(batchId, collectorId, 'unavailable');
  }

  async transitionBatchStatus(
    batchId: string,
    collectorId: string,
    toStatus: MaterialBatchStatus,
  ): Promise<MaterialBatchWithDetails> {
    const batch = await this.getCollectorBatchOrThrow(batchId, collectorId);
    const currentStatus = batch.status as MaterialBatchStatus;

    if (!validateMaterialBatchStatusTransition(currentStatus, toStatus)) {
      throw new BadRequestException({
        error: `Invalid material batch transition from '${currentStatus}' to '${toStatus}'`,
        code: 'INVALID_BATCH_TRANSITION',
      });
    }

    const sources = await this.fetchBatchSources(batchId);
    const listingMap = await this.fetchListingMap(
      sources.map((source) => source.listing_id),
    );

    if (toStatus === 'available') {
      this.validatePublishReadiness(batch, sources, listingMap);
    }

    const transitionedAt = new Date().toISOString();
    const updatePayload: Record<string, unknown> = {
      status: toStatus,
    };

    if (toStatus === 'available') {
      updatePayload.published_at = transitionedAt;
    }

    if (toStatus === 'sold') {
      updatePayload.sold_at = transitionedAt;
    }

    await this.persistBatchStatusUpdate(batchId, currentStatus, updatePayload);

    if (toStatus === 'available') {
      this.traceabilityService.emitEvent({
        eventType: 'material_listed',
        entityType: 'material_batch',
        entityId: batchId,
        actorId: collectorId,
        actorRole: 'collector',
        previousStatus: currentStatus,
        newStatus: 'available',
        metadata: {
          totalWeightKg: Number(batch.total_weight_kg),
          pricePerKg: Number(batch.price_per_kg),
        },
      });
    }

    if (toStatus === 'sold') {
      for (const source of sources) {
        const listing = listingMap.get(source.listing_id);

        if (listing?.status === 'sorted') {
          await this.statusTransitionService.transitionListingStatus(
            source.listing_id,
            'converted_to_material',
            collectorId,
            'collector',
          );
        }
      }
    }

    return this.getBatch(batchId, collectorId);
  }

  async getAvailableMaterials(
    filters: MaterialMarketplaceFilters,
  ): Promise<PaginatedMaterialMarketplace> {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 20, 50);
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const admin = this.supabaseService.getAdminClient();

    let query = admin
      .from('material_batches')
      .select(MARKETPLACE_BATCH_SELECT, { count: 'exact' })
      .eq('status', 'available');

    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id);
    }

    if (filters.city) {
      query = query.ilike('city', `%${filters.city}%`);
    }

    if (filters.province) {
      query = query.ilike('province', `%${filters.province}%`);
    }

    if (filters.min_weight_kg !== undefined) {
      query = query.gte('total_weight_kg', filters.min_weight_kg);
    }

    if (filters.max_price_per_kg !== undefined) {
      query = query.lte('price_per_kg', filters.max_price_per_kg);
    }

    if (filters.sort === 'price_per_kg') {
      query = query
        .order('price_per_kg', { ascending: true })
        .order('published_at', { ascending: false });
    } else {
      query = query
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });
    }

    const { data, error, count } = await query.range(from, to);

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to load available materials',
        code: 'MATERIAL_MARKETPLACE_LOAD_FAILED',
        details: error.message,
      });
    }

    return {
      items: (data ?? []).map((row) =>
        this.mapMarketplaceItem(row as MarketplaceBatchJoinRow),
      ),
      page,
      limit,
      total: count ?? 0,
    };
  }

  async getAvailableMaterialById(
    batchId: string,
  ): Promise<MaterialBatchMarketplaceDetail> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('material_batches')
      .select(MARKETPLACE_BATCH_SELECT)
      .eq('id', batchId)
      .eq('status', 'available')
      .maybeSingle<MarketplaceBatchJoinRow>();

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to load material marketplace listing',
        code: 'MATERIAL_MARKETPLACE_LOAD_FAILED',
        details: error.message,
      });
    }

    if (!data) {
      throw new NotFoundException({
        error: 'Material batch not found',
        code: 'MATERIAL_BATCH_NOT_FOUND',
      });
    }

    const sourceSummary = await this.buildMarketplaceSourceSummary(batchId);

    this.incrementMarketViewCount(batchId);

    return {
      ...this.mapBatch(data),
      category: this.mapMarketplaceCategory(data.category),
      collector: this.mapMarketplaceCollector(
        data.collector,
        data.collector_profile,
      ),
      source_summary: sourceSummary,
    };
  }

  async publishToMarketplace(
    batchId: string,
    collectorId: string,
    input: PublishToMarketInput,
  ): Promise<MaterialMarketListing> {
    const batch = await this.getCollectorBatchOrThrow(batchId, collectorId);

    if (batch.status !== 'available') {
      throw new BadRequestException({
        error: 'Only available material batches can be published to the market',
        code: 'BATCH_NOT_AVAILABLE_FOR_MARKET',
      });
    }

    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('material_market_listings')
      .insert({
        batch_id: batchId,
        collector_id: collectorId,
        category_id: batch.category_id,
        title: input.title ?? batch.name,
        quality_grade: input.quality_grade,
        specifications: input.specifications ?? {},
        photos: input.photos ?? [],
        asking_price_per_kg:
          input.asking_price_per_kg ?? Number(batch.price_per_kg),
        available_weight_kg:
          input.available_weight_kg ?? Number(batch.total_weight_kg),
        status: 'active',
      })
      .select(MARKET_LISTING_SELECT)
      .single<MaterialMarketListingRow>();

    if (error || !data) {
      if (error?.code === '23505') {
        throw new ConflictException({
          error: 'Material batch is already published to the market',
          code: 'MARKET_LISTING_ALREADY_EXISTS',
        });
      }

      throw new InternalServerErrorException({
        error: 'Failed to publish material batch to the market',
        code: 'MARKET_LISTING_CREATE_FAILED',
        details: error?.message,
      });
    }

    return this.mapMarketListing(data);
  }

  async updateMarketListing(
    listingId: string,
    collectorId: string,
    input: UpdateMarketListingInput,
  ): Promise<MaterialMarketListing> {
    const listing = await this.getCollectorMarketListingOrThrow(
      listingId,
      collectorId,
    );

    if (listing.status !== 'active') {
      throw new BadRequestException({
        error: 'Only active market listings can be updated',
        code: 'MARKET_LISTING_NOT_EDITABLE',
      });
    }

    const updatePayload = this.buildMarketListingUpdatePayload(input);

    if (Object.keys(updatePayload).length === 0) {
      return this.mapMarketListing(listing);
    }

    updatePayload.updated_at = new Date().toISOString();

    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('material_market_listings')
      .update(updatePayload)
      .eq('id', listingId)
      .eq('collector_id', collectorId)
      .eq('status', 'active')
      .select(MARKET_LISTING_SELECT)
      .maybeSingle<MaterialMarketListingRow>();

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to update market listing',
        code: 'MARKET_LISTING_UPDATE_FAILED',
        details: error.message,
      });
    }

    if (!data) {
      throw new BadRequestException({
        error: 'Market listing is no longer editable',
        code: 'MARKET_LISTING_NOT_EDITABLE',
      });
    }

    return this.mapMarketListing(data);
  }

  async withdrawMarketListing(
    listingId: string,
    collectorId: string,
  ): Promise<MaterialMarketListing> {
    const listing = await this.getCollectorMarketListingOrThrow(
      listingId,
      collectorId,
    );

    if (listing.status === 'withdrawn') {
      return this.mapMarketListing(listing);
    }

    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('material_market_listings')
      .update({ status: 'withdrawn', updated_at: new Date().toISOString() })
      .eq('id', listingId)
      .eq('collector_id', collectorId)
      .select(MARKET_LISTING_SELECT)
      .maybeSingle<MaterialMarketListingRow>();

    if (error || !data) {
      throw new InternalServerErrorException({
        error: 'Failed to withdraw market listing',
        code: 'MARKET_LISTING_WITHDRAW_FAILED',
        details: error?.message,
      });
    }

    return this.mapMarketListing(data);
  }

  private incrementMarketViewCount(batchId: string): void {
    void this.applyMarketViewIncrement(batchId).catch((viewError: unknown) => {
      const message =
        viewError instanceof Error ? viewError.message : String(viewError);
      this.logger.warn(`Failed to increment market view count: ${message}`);
    });
  }

  private async applyMarketViewIncrement(batchId: string): Promise<void> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('material_market_listings')
      .select('id, view_count')
      .eq('batch_id', batchId)
      .eq('status', 'active')
      .maybeSingle<{ id: string; view_count: number }>();

    if (error || !data) {
      return;
    }

    await admin
      .from('material_market_listings')
      .update({ view_count: data.view_count + 1 })
      .eq('id', data.id);
  }

  private async getCollectorMarketListingOrThrow(
    listingId: string,
    collectorId: string,
  ): Promise<MaterialMarketListingRow> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('material_market_listings')
      .select(MARKET_LISTING_SELECT)
      .eq('id', listingId)
      .eq('collector_id', collectorId)
      .maybeSingle<MaterialMarketListingRow>();

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to load market listing',
        code: 'MARKET_LISTING_LOAD_FAILED',
        details: error.message,
      });
    }

    if (!data) {
      throw new NotFoundException({
        error: 'Market listing not found',
        code: 'MARKET_LISTING_NOT_FOUND',
      });
    }

    return data;
  }

  private buildMarketListingUpdatePayload(
    input: UpdateMarketListingInput,
  ): Record<string, unknown> {
    const payload: Record<string, unknown> = {};

    if (input.title !== undefined) {
      payload.title = input.title;
    }
    if (input.quality_grade !== undefined) {
      payload.quality_grade = input.quality_grade;
    }
    if (input.specifications !== undefined) {
      payload.specifications = input.specifications;
    }
    if (input.photos !== undefined) {
      payload.photos = input.photos;
    }
    if (input.asking_price_per_kg !== undefined) {
      payload.asking_price_per_kg = input.asking_price_per_kg;
    }
    if (input.available_weight_kg !== undefined) {
      payload.available_weight_kg = input.available_weight_kg;
    }

    return payload;
  }

  private mapMarketListing(
    row: MaterialMarketListingRow,
  ): MaterialMarketListing {
    return {
      id: row.id,
      batch_id: row.batch_id,
      collector_id: row.collector_id,
      category_id: row.category_id,
      title: row.title,
      quality_grade: row.quality_grade as MaterialQualityGrade,
      specifications: row.specifications ?? {},
      photos: row.photos ?? [],
      asking_price_per_kg: Number(row.asking_price_per_kg),
      available_weight_kg: Number(row.available_weight_kg),
      status: row.status as MaterialMarketListingStatus,
      view_count: row.view_count,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  private async insertBatch(
    collectorId: string,
    dto: CreateMaterialBatchDto,
    totalWeightKg: number,
  ): Promise<string> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('material_batches')
      .insert({
        collector_id: collectorId,
        category_id: dto.category_id,
        name: dto.name,
        description: dto.description ?? null,
        total_weight_kg: totalWeightKg,
        price_per_kg: dto.price_per_kg,
        min_order_kg: dto.min_order_kg ?? 0,
        status: 'draft',
        location_address: dto.location_address ?? null,
        latitude: dto.latitude ?? null,
        longitude: dto.longitude ?? null,
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
        error: 'Failed to create material batch',
        code: 'MATERIAL_BATCH_CREATE_FAILED',
        details: error?.message,
      });
    }

    return data.id;
  }

  private async validateCategory(categoryId: string): Promise<void> {
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
      throw new BadRequestException({
        error: 'Waste category not found or inactive',
        code: 'CATEGORY_NOT_FOUND',
      });
    }
  }

  private async resolveListingWeights(
    listingIds: string[],
  ): Promise<Array<{ listingId: string; weightKg: number }>> {
    const listingMap = await this.fetchListingMap(listingIds);

    return listingIds.map((listingId) => {
      const listing = listingMap.get(listingId);

      if (!listing) {
        throw new NotFoundException({
          error: 'Waste listing not found',
          code: 'LISTING_NOT_FOUND',
          details: { listingId },
        });
      }

      const weightKg = this.resolveListingWeight(listing);

      return { listingId, weightKg };
    });
  }

  private resolveListingWeight(listing: ListingSourceRow): number {
    const actualWeight =
      listing.actual_weight_kg === null
        ? null
        : Number(listing.actual_weight_kg);
    const estimatedWeight = Number(listing.estimated_weight_kg);
    const weightKg = actualWeight ?? estimatedWeight;

    if (!Number.isFinite(weightKg) || weightKg <= 0) {
      throw new BadRequestException({
        error: 'Listing does not have a valid weight for batch sourcing',
        code: 'LISTING_WEIGHT_INVALID',
        details: { listingId: listing.id },
      });
    }

    return weightKg;
  }

  private validateSourceListing(
    listing: ListingSourceRow,
    batchCategoryId: string,
    collectorId: string,
  ): void {
    if (!ELIGIBLE_SOURCE_STATUSES.includes(listing.status)) {
      throw new BadRequestException({
        error: 'Listing is not eligible for material batch sourcing',
        code: 'LISTING_NOT_ELIGIBLE',
        details: {
          listingId: listing.id,
          status: listing.status,
        },
      });
    }

    if (listing.claimed_by !== collectorId) {
      throw new BadRequestException({
        error: 'Listing is not claimed by the collector',
        code: 'LISTING_NOT_OWNED',
        details: { listingId: listing.id },
      });
    }

    if (listing.category_id !== batchCategoryId) {
      throw new BadRequestException({
        error: 'Listing category does not match material batch category',
        code: 'LISTING_CATEGORY_MISMATCH',
        details: {
          listingId: listing.id,
          listingCategoryId: listing.category_id,
          batchCategoryId,
        },
      });
    }
  }

  private async recomputeBatchWeight(batchId: string): Promise<void> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('material_batch_sources')
      .select('actual_weight_kg')
      .eq('batch_id', batchId);

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to load material batch sources for weight update',
        code: 'BATCH_WEIGHT_RECOMPUTE_FAILED',
        details: error.message,
      });
    }

    const totalWeightKg = (data ?? []).reduce(
      (sum, row) => sum + Number(row.actual_weight_kg),
      0,
    );

    if (totalWeightKg <= 0) {
      throw new BadRequestException({
        error: 'Material batch must have a total weight greater than zero',
        code: 'BATCH_WEIGHT_INVALID',
      });
    }

    const { error: updateError } = await admin
      .from('material_batches')
      .update({ total_weight_kg: totalWeightKg })
      .eq('id', batchId);

    if (updateError) {
      throw new InternalServerErrorException({
        error: 'Failed to update material batch total weight',
        code: 'BATCH_WEIGHT_RECOMPUTE_FAILED',
        details: updateError.message,
      });
    }
  }

  private validatePublishReadiness(
    batch: MaterialBatchRow,
    sources: MaterialBatchSourceRow[],
    listingMap: Map<string, ListingSourceRow>,
  ): void {
    if (sources.length === 0) {
      throw new BadRequestException({
        error: 'Material batch must have at least one source before publishing',
        code: 'BATCH_CANNOT_PUBLISH_EMPTY',
      });
    }

    if (Number(batch.total_weight_kg) <= 0) {
      throw new BadRequestException({
        error: 'Material batch total weight must be greater than zero',
        code: 'BATCH_CANNOT_PUBLISH',
      });
    }

    if (Number(batch.price_per_kg) <= 0) {
      throw new BadRequestException({
        error: 'Material batch price per kg must be greater than zero',
        code: 'BATCH_CANNOT_PUBLISH',
      });
    }

    const unsortedSources = sources.filter((source) => {
      const listing = listingMap.get(source.listing_id);
      return !listing || !PUBLISHABLE_SOURCE_STATUSES.includes(listing.status);
    });

    if (unsortedSources.length > 0) {
      throw new BadRequestException({
        error:
          'All source listings must be sorted before the batch can be published',
        code: 'BATCH_SOURCES_NOT_SORTED',
        details: unsortedSources.map((source) => ({
          listingId: source.listing_id,
          status: listingMap.get(source.listing_id)?.status ?? 'unknown',
        })),
      });
    }
  }

  private async persistBatchStatusUpdate(
    batchId: string,
    currentStatus: MaterialBatchStatus,
    updatePayload: Record<string, unknown>,
  ): Promise<void> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('material_batches')
      .update(updatePayload)
      .eq('id', batchId)
      .eq('status', currentStatus)
      .select('id')
      .maybeSingle<{ id: string }>();

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to update material batch status',
        code: 'BATCH_STATUS_UPDATE_FAILED',
        details: error.message,
      });
    }

    if (!data) {
      throw new BadRequestException({
        error: 'Material batch status changed before update could complete',
        code: 'INVALID_BATCH_TRANSITION',
      });
    }
  }

  private async getCollectorBatchOrThrow(
    batchId: string,
    collectorId: string,
  ): Promise<MaterialBatchRow> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('material_batches')
      .select(BATCH_SELECT)
      .eq('id', batchId)
      .eq('collector_id', collectorId)
      .maybeSingle<MaterialBatchRow>();

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to load material batch',
        code: 'MATERIAL_BATCH_LOAD_FAILED',
        details: error.message,
      });
    }

    if (!data) {
      throw new NotFoundException({
        error: 'Material batch not found',
        code: 'MATERIAL_BATCH_NOT_FOUND',
      });
    }

    return data;
  }

  private async fetchBatchSources(
    batchId: string,
  ): Promise<MaterialBatchSourceRow[]> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('material_batch_sources')
      .select(SOURCE_SELECT)
      .eq('batch_id', batchId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to load material batch sources',
        code: 'BATCH_SOURCES_LOAD_FAILED',
        details: error.message,
      });
    }

    return data ?? [];
  }

  private async fetchListingForSource(
    listingId: string,
  ): Promise<ListingSourceRow | null> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('waste_listings')
      .select(LISTING_SOURCE_SELECT)
      .eq('id', listingId)
      .maybeSingle<ListingSourceRow>();

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to load waste listing for batch source',
        code: 'LISTING_LOAD_FAILED',
        details: error.message,
      });
    }

    return data;
  }

  private async fetchListingMap(
    listingIds: string[],
  ): Promise<Map<string, ListingSourceRow>> {
    if (listingIds.length === 0) {
      return new Map();
    }

    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('waste_listings')
      .select(LISTING_SOURCE_SELECT)
      .in('id', listingIds);

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to load waste listings for batch sources',
        code: 'LISTING_LOAD_FAILED',
        details: error.message,
      });
    }

    return new Map((data ?? []).map((listing) => [listing.id, listing]));
  }

  private async buildBatchWithDetails(
    batch: MaterialBatchRow,
  ): Promise<MaterialBatchWithDetails> {
    const sources = await this.fetchBatchSources(batch.id);
    const listingMap = await this.fetchListingMap(
      sources.map((source) => source.listing_id),
    );
    const mappedSources = sources.map((source) =>
      this.mapSourceWithListing(source, listingMap.get(source.listing_id)),
    );
    const totalSourceWeightKg = mappedSources.reduce(
      (sum, source) => sum + source.actual_weight_kg,
      0,
    );

    return {
      ...this.mapBatch(batch),
      sources: mappedSources,
      source_summary: {
        source_count: mappedSources.length,
        total_source_weight_kg: totalSourceWeightKg,
      },
    };
  }

  private buildBatchUpdatePayload(
    dto: UpdateMaterialBatchDto,
  ): Record<string, unknown> {
    const payload: Record<string, unknown> = {};

    if (dto.name !== undefined) {
      payload.name = dto.name;
    }
    if (dto.description !== undefined) {
      payload.description = dto.description;
    }
    if (dto.price_per_kg !== undefined) {
      payload.price_per_kg = dto.price_per_kg;
    }
    if (dto.min_order_kg !== undefined) {
      payload.min_order_kg = dto.min_order_kg;
    }
    if (dto.location_address !== undefined) {
      payload.location_address = dto.location_address;
    }
    if (dto.latitude !== undefined) {
      payload.latitude = dto.latitude;
    }
    if (dto.longitude !== undefined) {
      payload.longitude = dto.longitude;
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

  private mapBatch(row: MaterialBatchRow): MaterialBatch {
    return {
      id: row.id,
      collector_id: row.collector_id,
      category_id: row.category_id,
      name: row.name,
      description: row.description,
      total_weight_kg: Number(row.total_weight_kg),
      price_per_kg: Number(row.price_per_kg),
      min_order_kg: Number(row.min_order_kg),
      status: row.status as MaterialBatchStatus,
      location_address: row.location_address,
      latitude: row.latitude === null ? null : Number(row.latitude),
      longitude: row.longitude === null ? null : Number(row.longitude),
      city: row.city,
      province: row.province,
      available_from: row.available_from,
      available_until: row.available_until,
      notes: row.notes,
      published_at: row.published_at,
      sold_at: row.sold_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  private mapSourceWithListing(
    source: MaterialBatchSourceRow,
    listing: ListingSourceRow | undefined,
  ): MaterialBatchSourceWithListing {
    if (!listing) {
      throw new InternalServerErrorException({
        error: 'Material batch source is missing linked listing',
        code: 'BATCH_SOURCE_LISTING_MISSING',
        details: { listingId: source.listing_id },
      });
    }

    const listingDetails: MaterialBatchSourceListingDetails = {
      id: listing.id,
      title: listing.title,
      status: listing.status,
      estimated_weight_kg: Number(listing.estimated_weight_kg),
      actual_weight_kg:
        listing.actual_weight_kg === null
          ? null
          : Number(listing.actual_weight_kg),
      address: listing.address,
      city: listing.city,
    };

    return {
      id: source.id,
      batch_id: source.batch_id,
      listing_id: source.listing_id,
      actual_weight_kg: Number(source.actual_weight_kg),
      notes: source.notes,
      created_at: source.created_at,
      listing: listingDetails,
    };
  }

  private async buildMarketplaceSourceSummary(
    batchId: string,
  ): Promise<MaterialBatchMarketplaceSourceSummary> {
    const sources = await this.fetchBatchSources(batchId);

    if (sources.length === 0) {
      return {
        source_count: 0,
        cities: [],
      };
    }

    const listingIds = sources.map((source) => source.listing_id);
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('waste_listings')
      .select('city')
      .in('id', listingIds);

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to load source city summary',
        code: 'MATERIAL_SOURCE_SUMMARY_FAILED',
        details: error.message,
      });
    }

    const cities = [
      ...new Set(
        (data ?? [])
          .map((row: ListingCityRow) => row.city?.trim())
          .filter((city): city is string => Boolean(city)),
      ),
    ].sort((left, right) => left.localeCompare(right));

    return {
      source_count: sources.length,
      cities,
    };
  }

  private mapMarketplaceItem(
    row: MarketplaceBatchJoinRow,
  ): MaterialBatchMarketplaceItem {
    return {
      ...this.mapBatch(row),
      category: this.mapMarketplaceCategory(row.category),
      collector: this.mapMarketplaceCollector(
        row.collector,
        row.collector_profile,
      ),
    };
  }

  private mapMarketplaceCategory(
    category: MarketplaceCategoryRow | MarketplaceCategoryRow[] | null,
  ): MaterialBatchCategorySummary {
    const categoryRow = Array.isArray(category) ? category[0] : category;

    if (!categoryRow) {
      throw new InternalServerErrorException({
        error: 'Material batch is missing linked category',
        code: 'BATCH_CATEGORY_MISSING',
      });
    }

    return {
      id: categoryRow.id,
      code: categoryRow.code,
      name: categoryRow.name,
      unit: categoryRow.unit,
    };
  }

  private mapMarketplaceCollector(
    collector:
      | MarketplaceCollectorProfileRow
      | MarketplaceCollectorProfileRow[]
      | null,
    collectorProfile:
      | MarketplaceCollectorRatingRow
      | MarketplaceCollectorRatingRow[]
      | null,
  ): MaterialBatchCollectorSummary {
    const collectorRow = Array.isArray(collector) ? collector[0] : collector;
    const ratingRow = Array.isArray(collectorProfile)
      ? collectorProfile[0]
      : collectorProfile;

    if (!collectorRow?.display_name) {
      throw new InternalServerErrorException({
        error: 'Material batch is missing collector profile',
        code: 'BATCH_COLLECTOR_MISSING',
      });
    }

    return {
      display_name: collectorRow.display_name,
      rating_average: Number(ratingRow?.rating_average ?? 0),
    };
  }
}
