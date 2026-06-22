import {
  COLLECTOR_ID,
  COLLECTOR_OTHER_ID,
  HOUSEHOLD_ID,
} from './helpers/fixtures';
import {
  buildDraftListingPayload,
  createTestContext,
} from './helpers/test-context';
import { seedCollectorCategories } from './helpers/supabase-mock';
import { GLASS_CATEGORY } from './helpers/fixtures';

describe('Listing flow (e2e)', () => {
  let ctx: ReturnType<typeof createTestContext>;

  beforeEach(() => {
    ctx = createTestContext();
    seedCollectorCategories(ctx.store, COLLECTOR_OTHER_ID, [GLASS_CATEGORY.id]);
  });

  it('creates a draft listing with images attached', async () => {
    const listing = await ctx.listing.createListing(
      HOUSEHOLD_ID,
      buildDraftListingPayload(),
    );

    expect(listing.status).toBe('draft');
    expect(listing.images).toHaveLength(1);
    expect(listing.category?.code).toBe('PLASTIC_PET');
  });

  it('publishes a ready draft listing to available', async () => {
    const draft = await ctx.listing.createListing(
      HOUSEHOLD_ID,
      buildDraftListingPayload(),
    );

    const published = await ctx.listing.publishListing(draft.id, HOUSEHOLD_ID);

    expect(published.status).toBe('available');
    expect(ctx.store.waste_listings[0]?.status).toBe('available');
  });

  it('shows published listing to matching collector marketplace', async () => {
    await createPublishedListing(ctx);

    const marketplace = await ctx.listing.getAvailableWasteForCollector(
      COLLECTOR_ID,
      {},
    );

    expect(marketplace.items).toHaveLength(1);
    expect(marketplace.items[0]?.title).toBe('Botol PET bekas');
  });

  it('hides listing from collector who does not handle the category', async () => {
    await createPublishedListing(ctx);

    const marketplace = await ctx.listing.getAvailableWasteForCollector(
      COLLECTOR_OTHER_ID,
      {},
    );

    expect(marketplace.items).toHaveLength(0);
  });

  it('removes cancelled listing from collector marketplace', async () => {
    const published = await createPublishedListing(ctx);

    await ctx.listing.cancelListing(
      published.id,
      HOUSEHOLD_ID,
      'household',
      'Tidak jadi',
    );

    const marketplace = await ctx.listing.getAvailableWasteForCollector(
      COLLECTOR_ID,
      {},
    );

    expect(marketplace.items).toHaveLength(0);
    expect(
      ctx.store.waste_listings.find((row) => row.id === published.id)?.status,
    ).toBe('cancelled');
  });

  it('rejects publish when listing has no images', async () => {
    const draft = await ctx.listing.createListing(HOUSEHOLD_ID, {
      ...buildDraftListingPayload(),
      imagePaths: [],
    });

    await expect(
      ctx.listing.publishListing(draft.id, HOUSEHOLD_ID),
    ).rejects.toMatchObject({
      response: { code: 'LISTING_NOT_READY' },
    });
  });
});

async function createPublishedListing(
  ctx: ReturnType<typeof createTestContext>,
) {
  const draft = await ctx.listing.createListing(
    HOUSEHOLD_ID,
    buildDraftListingPayload(),
  );
  return ctx.listing.publishListing(draft.id, HOUSEHOLD_ID);
}
