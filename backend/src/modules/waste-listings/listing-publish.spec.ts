import { BadRequestException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables } from '../../common/config/env.validation';
import { SupabaseService } from '../../supabase/supabase.service';
import { ListingService } from './listing.service';
import { StatusTransitionService } from './status-transition.service';
import { TraceabilityService } from '../traceability/traceability.service';
import type { WasteListingWithDetails } from './waste-listings.types';

describe('ListingService publish and cancel', () => {
  let service: ListingService;
  let transitionMock: jest.Mock;
  let statusTransitionService: StatusTransitionService;
  let maybeSingleMock: jest.Mock;

  const listingId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const householdId = '11111111-1111-1111-1111-111111111111';
  const collectorId = '22222222-2222-2222-2222-222222222222';

  const category = {
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    code: 'PLASTIC_PET',
    name: 'Botol PET',
    description: null,
    icon_key: 'plastic-pet',
    unit: 'kg',
    typical_price_per_kg: 2500,
    ai_model_class: 'plastic_pet',
    sort_order: 1,
  };

  function buildListing(
    overrides: Partial<WasteListingWithDetails> = {},
  ): WasteListingWithDetails {
    return {
      id: listingId,
      household_id: householdId,
      category_id: category.id,
      classification_id: null,
      title: 'Botol PET',
      description: null,
      estimated_weight_kg: 3,
      actual_weight_kg: null,
      status: 'draft',
      address: 'Jl. Contoh',
      latitude: -6.2,
      longitude: 106.8,
      district: null,
      city: 'Jakarta',
      province: 'DKI',
      available_from: null,
      available_until: null,
      notes: null,
      pickup_fee: 0,
      claimed_by: null,
      claimed_at: null,
      picked_up_at: null,
      sorted_at: null,
      cancelled_at: null,
      cancel_reason: null,
      created_at: '2026-06-22T00:00:00.000Z',
      updated_at: '2026-06-22T00:00:00.000Z',
      category,
      images: [
        {
          id: 'img-1',
          listing_id: listingId,
          image_path:
            'waste-images/11111111-1111-1111-1111-111111111111/temp/a.jpg',
          is_primary: true,
          sort_order: 0,
          created_at: '2026-06-22T00:00:00.000Z',
        },
      ],
      ...overrides,
    };
  }

  beforeEach(() => {
    maybeSingleMock = jest.fn();

    const supabaseService = {
      getAdminClient: jest.fn(() => ({
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              maybeSingle: maybeSingleMock,
            })),
          })),
        })),
      })),
    } as unknown as SupabaseService;

    transitionMock = jest.fn();
    statusTransitionService = {
      transitionListingStatus: transitionMock,
    } as unknown as StatusTransitionService;

    const configService = {
      get: jest.fn(),
    } as unknown as ConfigService<EnvironmentVariables, true>;

    service = new ListingService(
      supabaseService,
      configService,
      { emitEvent: jest.fn() } as unknown as TraceabilityService,
      statusTransitionService,
    );
  });

  it('fails publish when listing has no images', async () => {
    const listing = buildListing({ images: [] });
    maybeSingleMock.mockResolvedValue({ data: listing, error: null });

    await expect(
      service.publishListing(listingId, householdId),
    ).rejects.toMatchObject({
      response: { code: 'LISTING_NOT_READY' },
    });
    await expect(
      service.publishListing(listingId, householdId),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(transitionMock).not.toHaveBeenCalled();
  });

  it('fails publish when coordinates are missing', async () => {
    const listing = buildListing({ latitude: Number.NaN, longitude: 106.8 });
    maybeSingleMock.mockResolvedValue({ data: listing, error: null });

    const issues = service.validatePublishReadiness(listing);

    expect(issues).toContain(
      'Pickup coordinates are required before publishing',
    );

    await expect(
      service.publishListing(listingId, householdId),
    ).rejects.toMatchObject({
      response: { code: 'LISTING_NOT_READY' },
    });
  });

  it('publishes a ready draft listing', async () => {
    const draftListing = buildListing({ status: 'draft' });
    const publishedListing = buildListing({ status: 'available' });

    maybeSingleMock
      .mockResolvedValueOnce({ data: draftListing, error: null })
      .mockResolvedValueOnce({ data: publishedListing, error: null });

    transitionMock.mockResolvedValue({
      ...publishedListing,
      category: undefined,
      images: undefined,
    });

    const result = await service.publishListing(listingId, householdId);

    expect(result.status).toBe('available');
    expect(transitionMock).toHaveBeenCalledWith(
      listingId,
      'available',
      householdId,
      'household',
    );
  });

  it('allows household to cancel a draft listing', async () => {
    const draftListing = buildListing({ status: 'draft' });
    const cancelledListing = buildListing({
      status: 'cancelled',
      cancel_reason: 'Tidak jadi',
    });

    maybeSingleMock
      .mockResolvedValueOnce({ data: draftListing, error: null })
      .mockResolvedValueOnce({ data: cancelledListing, error: null });

    transitionMock.mockResolvedValue({
      ...cancelledListing,
      category: undefined,
      images: undefined,
    });

    const result = await service.cancelListing(
      listingId,
      householdId,
      'household',
      'Tidak jadi',
    );

    expect(result.status).toBe('cancelled');
    expect(transitionMock).toHaveBeenCalledWith(
      listingId,
      'cancelled',
      householdId,
      'household',
      {
        cancel_reason: 'Tidak jadi',
      },
    );
  });

  it('rejects household cancel for claimed listing', async () => {
    const claimedListing = buildListing({
      status: 'claimed',
      claimed_by: collectorId,
    });
    maybeSingleMock.mockResolvedValue({ data: claimedListing, error: null });

    await expect(
      service.cancelListing(listingId, householdId, 'household'),
    ).rejects.toMatchObject({
      response: { code: 'CANNOT_CANCEL' },
    });
    expect(transitionMock).not.toHaveBeenCalled();
  });

  it('rejects publish when listing is already published', async () => {
    const availableListing = buildListing({ status: 'available' });
    maybeSingleMock.mockResolvedValue({ data: availableListing, error: null });

    await expect(
      service.publishListing(listingId, householdId),
    ).rejects.toMatchObject({
      response: { code: 'ALREADY_PUBLISHED' },
    });
    await expect(
      service.publishListing(listingId, householdId),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
