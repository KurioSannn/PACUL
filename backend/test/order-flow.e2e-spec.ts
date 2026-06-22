import {
  COLLECTOR_ID,
  DEFAULT_CATEGORY,
  HOUSEHOLD_ID,
  INDUSTRY_ID,
} from './helpers/fixtures';
import {
  buildDraftListingPayload,
  createTestContext,
  flushTraceability,
} from './helpers/test-context';

describe('Order flow (e2e)', () => {
  let ctx: ReturnType<typeof createTestContext>;
  let batchId: string;

  beforeEach(async () => {
    ctx = createTestContext();
    batchId = await seedAvailableBatch(ctx);
  });

  it('creates order and marks batch as ordered', async () => {
    const order = await ctx.order.createOrder(INDUSTRY_ID, {
      batchId,
      requested_weight_kg: 5,
      offered_price_per_kg: 3400,
    });
    await flushTraceability();

    expect(order.status).toBe('created');
    expect(ctx.store.material_batches[0]?.status).toBe('ordered');
  });

  it('starts negotiation and moves order to negotiating', async () => {
    const order = await ctx.order.createOrder(INDUSTRY_ID, {
      batchId,
      requested_weight_kg: 5,
      offered_price_per_kg: 3400,
    });

    const thread = await ctx.negotiation.startNegotiation(
      order.id,
      INDUSTRY_ID,
    );

    expect(thread.status).toBe('open');
    expect(ctx.store.orders[0]?.status).toBe('negotiating');
  });

  it('records industry offer in negotiation thread', async () => {
    const order = await ctx.order.createOrder(INDUSTRY_ID, {
      batchId,
      requested_weight_kg: 5,
      offered_price_per_kg: 3400,
    });
    const thread = await ctx.negotiation.startNegotiation(
      order.id,
      INDUSTRY_ID,
    );

    const afterOffer = await ctx.negotiation.sendOffer(
      thread.id,
      INDUSTRY_ID,
      'industry',
      { price_per_kg: 3300, weight_kg: 5 },
    );

    expect(afterOffer.offers).toHaveLength(1);
    expect(afterOffer.offers[0]?.price_per_kg).toBe(3300);
  });

  it('accepts counter offer and sets order to accepted', async () => {
    const order = await ctx.order.createOrder(INDUSTRY_ID, {
      batchId,
      requested_weight_kg: 5,
      offered_price_per_kg: 3400,
    });
    const thread = await ctx.negotiation.startNegotiation(
      order.id,
      INDUSTRY_ID,
    );
    await ctx.negotiation.sendOffer(thread.id, INDUSTRY_ID, 'industry', {
      price_per_kg: 3300,
      weight_kg: 5,
    });
    await ctx.negotiation.sendOffer(thread.id, COLLECTOR_ID, 'collector', {
      price_per_kg: 3350,
      weight_kg: 5,
    });

    const accepted = await ctx.negotiation.acceptOffer(thread.id, INDUSTRY_ID);

    expect(accepted.status).toBe('accepted');
    expect(ctx.store.orders[0]?.status).toBe('accepted');
    expect(ctx.store.orders[0]?.final_price_per_kg).toBe(3350);
  });

  it('completes order and marks batch as sold', async () => {
    const order = await ctx.order.createOrder(INDUSTRY_ID, {
      batchId,
      requested_weight_kg: 5,
      offered_price_per_kg: 3400,
    });
    const thread = await ctx.negotiation.startNegotiation(
      order.id,
      INDUSTRY_ID,
    );
    await ctx.negotiation.sendOffer(thread.id, INDUSTRY_ID, 'industry', {
      price_per_kg: 3300,
      weight_kg: 5,
    });
    await ctx.negotiation.acceptOffer(thread.id, COLLECTOR_ID);

    const completed = await ctx.order.transitionOrderStatus(
      order.id,
      COLLECTOR_ID,
      'collector',
      'completed',
      {
        final_weight_kg: 5,
        final_price_per_kg: 3300,
      },
    );

    expect(completed.status).toBe('completed');
    expect(ctx.store.material_batches[0]?.status).toBe('sold');
  });

  it('cancels negotiation and restores batch to available', async () => {
    const order = await ctx.order.createOrder(INDUSTRY_ID, {
      batchId,
      requested_weight_kg: 5,
      offered_price_per_kg: 3400,
    });
    const thread = await ctx.negotiation.startNegotiation(
      order.id,
      INDUSTRY_ID,
    );

    await ctx.negotiation.cancelNegotiation(thread.id, INDUSTRY_ID, {
      reason: 'Jadwal bentrok',
    });

    expect(ctx.store.orders[0]?.status).toBe('cancelled');
    expect(ctx.store.material_batches[0]?.status).toBe('available');
  });
});

async function seedAvailableBatch(
  ctx: ReturnType<typeof createTestContext>,
): Promise<string> {
  const draft = await ctx.listing.createListing(
    HOUSEHOLD_ID,
    buildDraftListingPayload(),
  );
  const published = await ctx.listing.publishListing(draft.id, HOUSEHOLD_ID);
  const claim = await ctx.pickup.claimListing(COLLECTOR_ID, published.id);
  await ctx.pickup.updateClaimStatus(claim.id, COLLECTOR_ID, 'pickup_planned');
  await ctx.pickup.updateClaimStatus(claim.id, COLLECTOR_ID, 'picked_up');

  const batch = await ctx.material.createBatch(COLLECTOR_ID, {
    category_id: DEFAULT_CATEGORY.id,
    name: 'PET Batch Order',
    price_per_kg: 3500,
    min_order_kg: 5,
    sourceListingIds: [published.id],
  });
  await ctx.material.markSortingComplete(batch.id, COLLECTOR_ID);
  const available = await ctx.material.publishBatch(batch.id, COLLECTOR_ID);
  return available.id;
}
