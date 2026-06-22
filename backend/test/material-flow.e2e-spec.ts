import { BadRequestException } from '@nestjs/common';
import {
  COLLECTOR_ID,
  DEFAULT_CATEGORY,
  HOUSEHOLD_ID,
} from './helpers/fixtures';
import {
  buildDraftListingPayload,
  createTestContext,
} from './helpers/test-context';

describe('Material flow (e2e)', () => {
  let ctx: ReturnType<typeof createTestContext>;
  let pickedUpListingId: string;

  beforeEach(async () => {
    ctx = createTestContext();

    const draft = await ctx.listing.createListing(
      HOUSEHOLD_ID,
      buildDraftListingPayload(),
    );
    const published = await ctx.listing.publishListing(draft.id, HOUSEHOLD_ID);
    const claim = await ctx.pickup.claimListing(COLLECTOR_ID, published.id);
    await ctx.pickup.updateClaimStatus(
      claim.id,
      COLLECTOR_ID,
      'pickup_planned',
    );
    await ctx.pickup.updateClaimStatus(claim.id, COLLECTOR_ID, 'picked_up');

    pickedUpListingId = published.id;
  });

  it('creates a draft batch from picked_up source listings', async () => {
    const batch = await ctx.material.createBatch(COLLECTOR_ID, {
      category_id: DEFAULT_CATEGORY.id,
      name: 'PET Batch Juni',
      price_per_kg: 3500,
      min_order_kg: 5,
      sourceListingIds: [pickedUpListingId],
    });

    expect(batch.status).toBe('draft');
    expect(batch.sources).toHaveLength(1);
    expect(ctx.store.waste_listings[0]?.status).toBe('sorting');
  });

  it('adds picked_up source and transitions listing to sorting', async () => {
    const batch = await ctx.material.createBatch(COLLECTOR_ID, {
      category_id: DEFAULT_CATEGORY.id,
      name: 'PET Batch',
      price_per_kg: 3500,
      min_order_kg: 5,
      sourceListingIds: [pickedUpListingId],
    });

    expect(batch.sources[0]?.listing?.status).toBe('sorting');
    expect(batch.total_weight_kg).toBeGreaterThan(0);
  });

  it('marks sorting complete so sources become sorted', async () => {
    const batch = await ctx.material.createBatch(COLLECTOR_ID, {
      category_id: DEFAULT_CATEGORY.id,
      name: 'PET Batch',
      price_per_kg: 3500,
      min_order_kg: 5,
      sourceListingIds: [pickedUpListingId],
    });

    const sorted = await ctx.material.markSortingComplete(
      batch.id,
      COLLECTOR_ID,
    );

    expect(sorted.sources[0]?.listing?.status).toBe('sorted');
  });

  it('publishes sorted batch to available marketplace', async () => {
    const batch = await ctx.material.createBatch(COLLECTOR_ID, {
      category_id: DEFAULT_CATEGORY.id,
      name: 'PET Batch',
      price_per_kg: 3500,
      min_order_kg: 5,
      sourceListingIds: [pickedUpListingId],
    });
    await ctx.material.markSortingComplete(batch.id, COLLECTOR_ID);

    const published = await ctx.material.publishBatch(batch.id, COLLECTOR_ID);

    expect(published.status).toBe('available');
    expect(published.published_at).not.toBeNull();
  });

  it('shows published batch in industry marketplace', async () => {
    const batch = await ctx.material.createBatch(COLLECTOR_ID, {
      category_id: DEFAULT_CATEGORY.id,
      name: 'PET Batch',
      price_per_kg: 3500,
      min_order_kg: 5,
      sourceListingIds: [pickedUpListingId],
    });
    await ctx.material.markSortingComplete(batch.id, COLLECTOR_ID);
    await ctx.material.publishBatch(batch.id, COLLECTOR_ID);

    const marketplace = await ctx.material.getAvailableMaterials({});

    expect(marketplace.items).toHaveLength(1);
    expect(marketplace.items[0]?.id).toBe(batch.id);
  });

  it('rejects publish when source listings are still sorting', async () => {
    const batch = await ctx.material.createBatch(COLLECTOR_ID, {
      category_id: DEFAULT_CATEGORY.id,
      name: 'PET Batch',
      price_per_kg: 3500,
      min_order_kg: 5,
      sourceListingIds: [pickedUpListingId],
    });

    await expect(
      ctx.material.publishBatch(batch.id, COLLECTOR_ID),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
