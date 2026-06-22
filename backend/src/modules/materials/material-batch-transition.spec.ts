import { BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { TraceabilityService } from '../traceability/traceability.service';
import { StatusTransitionService } from '../waste-listings/status-transition.service';
import { MaterialBatchService } from './material-batch.service';
import type { MaterialBatchWithDetails } from './materials.types';

describe('MaterialBatchService transitions', () => {
  let service: MaterialBatchService;
  let transitionMock: jest.Mock;
  let fromMock: jest.Mock;
  let batchMaybeSingleMock: jest.Mock;
  let batchUpdateMaybeSingleMock: jest.Mock;
  let sourcesOrderMock: jest.Mock;
  let listingsInMock: jest.Mock;

  const batchId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const collectorId = '22222222-2222-2222-2222-222222222222';
  const listingId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const categoryId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

  const draftBatchRow = {
    id: batchId,
    collector_id: collectorId,
    category_id: categoryId,
    name: 'PET Batch',
    description: null,
    total_weight_kg: 12,
    price_per_kg: 3500,
    min_order_kg: 0,
    status: 'draft',
    location_address: null,
    latitude: null,
    longitude: null,
    city: null,
    province: null,
    available_from: null,
    available_until: null,
    notes: null,
    published_at: null,
    sold_at: null,
    created_at: '2026-06-22T00:00:00.000Z',
    updated_at: '2026-06-22T00:00:00.000Z',
  };

  const sourceRow = {
    id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    batch_id: batchId,
    listing_id: listingId,
    actual_weight_kg: 12,
    notes: null,
    created_at: '2026-06-22T00:00:00.000Z',
  };

  const sortedListingRow = {
    id: listingId,
    title: 'Botol PET',
    status: 'sorted',
    category_id: categoryId,
    claimed_by: collectorId,
    estimated_weight_kg: 12,
    actual_weight_kg: 12,
    address: 'Jl. Contoh',
    city: 'Surabaya',
  };

  const batchWithDetails: MaterialBatchWithDetails = {
    id: batchId,
    collector_id: collectorId,
    category_id: categoryId,
    name: 'PET Batch',
    description: null,
    total_weight_kg: 12,
    price_per_kg: 3500,
    min_order_kg: 0,
    status: 'available',
    location_address: null,
    latitude: null,
    longitude: null,
    city: null,
    province: null,
    available_from: null,
    available_until: null,
    notes: null,
    published_at: '2026-06-22T01:00:00.000Z',
    sold_at: null,
    created_at: '2026-06-22T00:00:00.000Z',
    updated_at: '2026-06-22T01:00:00.000Z',
    sources: [
      {
        ...sourceRow,
        actual_weight_kg: 12,
        listing: {
          id: listingId,
          title: 'Botol PET',
          status: 'sorted',
          estimated_weight_kg: 12,
          actual_weight_kg: 12,
          address: 'Jl. Contoh',
          city: 'Surabaya',
        },
      },
    ],
    source_summary: {
      source_count: 1,
      total_source_weight_kg: 12,
    },
  };

  beforeEach(() => {
    batchMaybeSingleMock = jest.fn();
    batchUpdateMaybeSingleMock = jest.fn();
    sourcesOrderMock = jest.fn();
    listingsInMock = jest.fn();

    fromMock = jest.fn((table: string) => {
      if (table === 'material_batches') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                maybeSingle: batchMaybeSingleMock,
              })),
              maybeSingle: batchMaybeSingleMock,
            })),
          })),
          update: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                select: jest.fn(() => ({
                  maybeSingle: batchUpdateMaybeSingleMock,
                })),
              })),
            })),
          })),
        };
      }

      if (table === 'material_batch_sources') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              order: sourcesOrderMock,
            })),
          })),
        };
      }

      if (table === 'waste_listings') {
        return {
          select: jest.fn(() => ({
            in: listingsInMock,
          })),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    const supabaseService = {
      getAdminClient: jest.fn(() => ({
        from: fromMock,
      })),
    } as unknown as SupabaseService;

    transitionMock = jest.fn();
    const statusTransitionService = {
      transitionListingStatus: transitionMock,
    } as unknown as StatusTransitionService;

    service = new MaterialBatchService(
      supabaseService,
      statusTransitionService,
      { emitEvent: jest.fn() } as unknown as TraceabilityService,
    );
    jest.spyOn(service, 'getBatch').mockResolvedValue(batchWithDetails);
  });

  it('cannot publish an empty material batch', async () => {
    batchMaybeSingleMock.mockResolvedValue({
      data: draftBatchRow,
      error: null,
    });
    sourcesOrderMock.mockResolvedValue({ data: [], error: null });

    await expect(
      service.publishBatch(batchId, collectorId),
    ).rejects.toMatchObject({
      response: { code: 'BATCH_CANNOT_PUBLISH_EMPTY' },
    });
    await expect(
      service.publishBatch(batchId, collectorId),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(batchUpdateMaybeSingleMock).not.toHaveBeenCalled();
  });

  it('publishes a draft batch to available when sources are sorted', async () => {
    batchMaybeSingleMock.mockResolvedValue({
      data: draftBatchRow,
      error: null,
    });
    sourcesOrderMock.mockResolvedValue({ data: [sourceRow], error: null });
    listingsInMock.mockResolvedValue({ data: [sortedListingRow], error: null });
    batchUpdateMaybeSingleMock.mockResolvedValue({
      data: { id: batchId },
      error: null,
    });

    const result = await service.publishBatch(batchId, collectorId);

    expect(result.status).toBe('available');
    expect(batchUpdateMaybeSingleMock).toHaveBeenCalled();
    expect(transitionMock).not.toHaveBeenCalled();
  });

  it('transitions sorted source listings when batch is sold', async () => {
    const orderedBatch = {
      ...draftBatchRow,
      status: 'ordered',
    };

    batchMaybeSingleMock.mockResolvedValue({ data: orderedBatch, error: null });
    sourcesOrderMock.mockResolvedValue({ data: [sourceRow], error: null });
    listingsInMock.mockResolvedValue({ data: [sortedListingRow], error: null });
    batchUpdateMaybeSingleMock.mockResolvedValue({
      data: { id: batchId },
      error: null,
    });
    transitionMock.mockResolvedValue({
      ...sortedListingRow,
      status: 'converted_to_material',
    });

    await service.transitionBatchStatus(batchId, collectorId, 'sold');

    expect(transitionMock).toHaveBeenCalledWith(
      listingId,
      'converted_to_material',
      collectorId,
      'collector',
    );
    expect(batchUpdateMaybeSingleMock).toHaveBeenCalled();
  });

  it('rejects publish when a source listing is still sorting', async () => {
    batchMaybeSingleMock.mockResolvedValue({
      data: draftBatchRow,
      error: null,
    });
    sourcesOrderMock.mockResolvedValue({ data: [sourceRow], error: null });
    listingsInMock.mockResolvedValue({
      data: [{ ...sortedListingRow, status: 'sorting' }],
      error: null,
    });

    await expect(
      service.publishBatch(batchId, collectorId),
    ).rejects.toMatchObject({
      response: { code: 'BATCH_SOURCES_NOT_SORTED' },
    });
  });
});
