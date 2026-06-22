import { BadRequestException } from '@nestjs/common';
import {
  COLLECTOR_ID,
  COLLECTOR_OTHER_ID,
  HOUSEHOLD_ID,
} from './helpers/fixtures';
import {
  buildDraftListingPayload,
  createTestContext,
  flushTraceability,
} from './helpers/test-context';
import { seedCollectorCategories } from './helpers/supabase-mock';
import { GLASS_CATEGORY } from './helpers/fixtures';

describe('Pickup flow (e2e)', () => {
  let ctx: ReturnType<typeof createTestContext>;

  beforeEach(() => {
    ctx = createTestContext();
    seedCollectorCategories(ctx.store, COLLECTOR_OTHER_ID, [GLASS_CATEGORY.id]);
  });

  async function publishListing() {
    const draft = await ctx.listing.createListing(
      HOUSEHOLD_ID,
      buildDraftListingPayload(),
    );
    return ctx.listing.publishListing(draft.id, HOUSEHOLD_ID);
  }

  it('claims an available listing for a matching collector', async () => {
    const listing = await publishListing();

    const claim = await ctx.pickup.claimListing(COLLECTOR_ID, listing.id);
    await flushTraceability();

    expect(claim.status).toBe('claimed');
    expect(ctx.store.waste_listings[0]?.status).toBe('claimed');
    expect(ctx.store.waste_listings[0]?.claimed_by).toBe(COLLECTOR_ID);
  });

  it('rejects claim when listing is not available', async () => {
    const listing = await publishListing();
    await ctx.pickup.claimListing(COLLECTOR_ID, listing.id);

    await expect(
      ctx.pickup.claimListing(COLLECTOR_OTHER_ID, listing.id),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects claim when collector does not handle category', async () => {
    const listing = await publishListing();

    await expect(
      ctx.pickup.claimListing(COLLECTOR_OTHER_ID, listing.id),
    ).rejects.toMatchObject({
      response: { code: 'CATEGORY_NOT_HANDLED' },
    });
  });

  it('rejects duplicate claim on the same listing', async () => {
    const listing = await publishListing();
    await ctx.pickup.claimListing(COLLECTOR_ID, listing.id);

    await expect(
      ctx.pickup.claimListing(COLLECTOR_ID, listing.id),
    ).rejects.toMatchObject({
      response: { code: 'LISTING_NOT_AVAILABLE' },
    });
    await expect(
      ctx.pickup.claimListing(COLLECTOR_ID, listing.id),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('transitions claim to pickup_planned and syncs listing status', async () => {
    const listing = await publishListing();
    const claim = await ctx.pickup.claimListing(COLLECTOR_ID, listing.id);

    const planned = await ctx.pickup.updateClaimStatus(
      claim.id,
      COLLECTOR_ID,
      'pickup_planned',
    );

    expect(planned.status).toBe('pickup_planned');
    expect(ctx.store.waste_listings[0]?.status).toBe('pickup_planned');
  });

  it('completes pickup so household can see picked_up listing status', async () => {
    const listing = await publishListing();
    const claim = await ctx.pickup.claimListing(COLLECTOR_ID, listing.id);
    await ctx.pickup.updateClaimStatus(
      claim.id,
      COLLECTOR_ID,
      'pickup_planned',
    );

    await ctx.pickup.updateClaimStatus(claim.id, COLLECTOR_ID, 'picked_up');

    const householdView = await ctx.listing.getListingById(
      listing.id,
      HOUSEHOLD_ID,
      'household',
    );

    expect(householdView.status).toBe('picked_up');
    expect(householdView.picked_up_at).not.toBeNull();
  });
});
