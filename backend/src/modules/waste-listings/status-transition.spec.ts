import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { StatusTransitionService } from './status-transition.service';
import type { WasteListingStatus } from './waste-listings.types';

describe('StatusTransitionService', () => {
  let service: StatusTransitionService;
  let maybeSingleMock: jest.Mock;
  let updateMaybeSingleMock: jest.Mock;

  const listingId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const householdId = '11111111-1111-1111-1111-111111111111';
  const collectorId = '22222222-2222-2222-2222-222222222222';

  const baseRow = {
    id: listingId,
    household_id: householdId,
    category_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    classification_id: null,
    title: 'Botol PET',
    description: null,
    estimated_weight_kg: 3,
    actual_weight_kg: null,
    status: 'draft' as WasteListingStatus,
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
  };

  beforeEach(() => {
    maybeSingleMock = jest.fn();
    updateMaybeSingleMock = jest.fn();

    const supabaseService = {
      getAdminClient: jest.fn(() => ({
        from: jest.fn((table: string) => {
          if (table !== 'waste_listings') {
            return { select: jest.fn() };
          }

          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                maybeSingle: maybeSingleMock,
              })),
            })),
            update: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => ({
                  select: jest.fn(() => ({
                    maybeSingle: updateMaybeSingleMock,
                  })),
                })),
              })),
            })),
          };
        }),
      })),
    } as unknown as SupabaseService;

    service = new StatusTransitionService(supabaseService);
  });

  function mockCurrentListing(
    status: WasteListingStatus,
    overrides: Record<string, unknown> = {},
  ) {
    maybeSingleMock.mockResolvedValue({
      data: { ...baseRow, status, ...overrides },
      error: null,
    });
  }

  function mockSuccessfulUpdate(
    status: WasteListingStatus,
    overrides: Record<string, unknown> = {},
  ) {
    updateMaybeSingleMock.mockResolvedValue({
      data: { ...baseRow, status, ...overrides },
      error: null,
    });
  }

  it('transitions draft to available for household', async () => {
    mockCurrentListing('draft');
    mockSuccessfulUpdate('available');

    const result = await service.transitionListingStatus(
      listingId,
      'available',
      householdId,
      'household',
    );

    expect(result.status).toBe('available');
  });

  it('transitions available to claimed for collector and sets claimed_by', async () => {
    mockCurrentListing('available');
    mockSuccessfulUpdate('claimed', {
      claimed_by: collectorId,
      claimed_at: '2026-06-22T01:00:00.000Z',
    });

    const result = await service.transitionListingStatus(
      listingId,
      'claimed',
      collectorId,
      'collector',
    );

    expect(result.status).toBe('claimed');
    expect(result.claimed_by).toBe(collectorId);
  });

  it('transitions sorted to converted_to_material for collector', async () => {
    mockCurrentListing('sorted', { claimed_by: collectorId });
    mockSuccessfulUpdate('converted_to_material', { claimed_by: collectorId });

    const result = await service.transitionListingStatus(
      listingId,
      'converted_to_material',
      collectorId,
      'collector',
    );

    expect(result.status).toBe('converted_to_material');
  });

  it('rejects invalid transition draft to picked_up', async () => {
    mockCurrentListing('draft');

    await expect(
      service.transitionListingStatus(
        listingId,
        'picked_up',
        householdId,
        'household',
      ),
    ).rejects.toMatchObject({
      response: { code: 'INVALID_TRANSITION' },
    });
    await expect(
      service.transitionListingStatus(
        listingId,
        'picked_up',
        householdId,
        'household',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects invalid transition cancelled to available', async () => {
    mockCurrentListing('cancelled');

    await expect(
      service.transitionListingStatus(
        listingId,
        'available',
        householdId,
        'household',
      ),
    ).rejects.toMatchObject({
      response: { code: 'INVALID_TRANSITION' },
    });
  });

  it('rejects household actor for picked_up transition', async () => {
    mockCurrentListing('pickup_planned', { claimed_by: collectorId });

    await expect(
      service.transitionListingStatus(
        listingId,
        'picked_up',
        householdId,
        'household',
      ),
    ).rejects.toMatchObject({
      response: { code: 'INSUFFICIENT_ROLE' },
    });
    await expect(
      service.transitionListingStatus(
        listingId,
        'picked_up',
        householdId,
        'household',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects collector actor for draft to available', async () => {
    mockCurrentListing('draft');

    await expect(
      service.transitionListingStatus(
        listingId,
        'available',
        collectorId,
        'collector',
      ),
    ).rejects.toMatchObject({
      response: { code: 'INSUFFICIENT_ROLE' },
    });
  });

  it('allows household to cancel draft listing', async () => {
    mockCurrentListing('draft');
    mockSuccessfulUpdate('cancelled', {
      cancelled_at: '2026-06-22T01:00:00.000Z',
      cancel_reason: 'Tidak jadi',
    });

    const result = await service.transitionListingStatus(
      listingId,
      'cancelled',
      householdId,
      'household',
      { cancel_reason: 'Tidak jadi' },
    );

    expect(result.status).toBe('cancelled');
    expect(result.cancel_reason).toBe('Tidak jadi');
  });

  it('allows household to cancel available listing', async () => {
    mockCurrentListing('available');
    mockSuccessfulUpdate('cancelled', {
      cancelled_at: '2026-06-22T01:00:00.000Z',
    });

    const result = await service.transitionListingStatus(
      listingId,
      'cancelled',
      householdId,
      'household',
    );

    expect(result.status).toBe('cancelled');
  });

  it('allows system actor for valid non-household transition', async () => {
    mockCurrentListing('claimed', { claimed_by: collectorId });
    mockSuccessfulUpdate('pickup_planned', { claimed_by: collectorId });

    const result = await service.transitionListingStatus(
      listingId,
      'pickup_planned',
      collectorId,
      'system',
    );

    expect(result.status).toBe('pickup_planned');
  });

  it('rejects industry actor for any transition', async () => {
    mockCurrentListing('draft');

    await expect(
      service.transitionListingStatus(
        listingId,
        'available',
        '33333333-3333-3333-3333-333333333333',
        'industry',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws LISTING_NOT_FOUND when listing is missing', async () => {
    maybeSingleMock.mockResolvedValue({ data: null, error: null });

    await expect(
      service.transitionListingStatus(
        listingId,
        'available',
        householdId,
        'household',
      ),
    ).rejects.toMatchObject({
      response: { code: 'LISTING_NOT_FOUND' },
    });
    await expect(
      service.transitionListingStatus(
        listingId,
        'available',
        householdId,
        'household',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
