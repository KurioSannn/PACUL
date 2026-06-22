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
describe('Traceability flow (e2e)', () => {
  let ctx: ReturnType<typeof createTestContext>;
  let batchId: string;
  let listingId: string;
  let orderId: string;

  beforeEach(async () => {
    ctx = createTestContext();
    const ids = await runFullBusinessFlow(ctx);
    batchId = ids.batchId;
    listingId = ids.listingId;
    orderId = ids.orderId;
    await flushTraceability();
  });

  it('returns material timeline with chronological events', async () => {
    const timeline = await ctx.traceability.getMaterialTrackTimeline(
      batchId,
      INDUSTRY_ID,
      'industry',
    );

    const batchEventTimes = timeline.batchEvents.map(
      (event) => event.created_at,
    );
    const listingEventTimes = timeline.sources.flatMap((source) =>
      source.listingEvents.map((event) => event.created_at),
    );

    expect(batchEventTimes).toEqual([...batchEventTimes].sort());
    expect(listingEventTimes).toEqual([...listingEventTimes].sort());
    expect(timeline.batchEvents.length).toBeGreaterThan(0);
  });

  it('links waste sources in material timeline', async () => {
    const timeline = await ctx.traceability.getMaterialTrackTimeline(
      batchId,
      INDUSTRY_ID,
      'industry',
    );

    expect(timeline.sources).toHaveLength(1);
    expect(timeline.sources[0]?.listing.id).toBe(listingId);
    expect(
      timeline.sources[0]?.listingEvents.some(
        (event) => event.event_type === 'waste_uploaded',
      ),
    ).toBe(true);
  });

  it('includes chain_summary fields after full flow', async () => {
    const timeline = await ctx.traceability.getMaterialTrackTimeline(
      batchId,
      INDUSTRY_ID,
      'industry',
    );

    expect(timeline.chain_summary.waste_sources).toHaveLength(1);
    expect(timeline.chain_summary.processing.batchCreatedAt).toBeTruthy();
    expect(timeline.chain_summary.market.listedAt).toBeTruthy();
    expect(typeof timeline.chain_summary.transaction?.agreedPricePerKg).toBe(
      'number',
    );
    expect(typeof timeline.chain_summary.transaction?.completedAt).toBe(
      'string',
    );
  });

  it('returns order timeline with linked batch events', async () => {
    const timeline = await ctx.traceability.getOrderTrackTimeline(
      orderId,
      COLLECTOR_ID,
      'collector',
    );

    expect(timeline.order.id).toBe(orderId);
    expect(timeline.batch.id).toBe(batchId);
    expect(timeline.orderEvents.map((event) => event.event_type)).toContain(
      'order_created',
    );
  });

  it('allows household to view waste listing journey', async () => {
    const journey = await ctx.traceability.getWasteTrackJourney(
      listingId,
      HOUSEHOLD_ID,
      'household',
    );

    expect(journey.listing.id).toBe(listingId);
    expect(journey.materialBatches[0]?.batchId).toBe(batchId);
  });
});

async function runFullBusinessFlow(ctx: ReturnType<typeof createTestContext>) {
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
    name: 'Traceability Batch',
    price_per_kg: 3500,
    min_order_kg: 5,
    sourceListingIds: [published.id],
  });
  const resolvedBatchId = batch.id;

  await ctx.material.markSortingComplete(batch.id, COLLECTOR_ID);
  await ctx.material.publishBatch(batch.id, COLLECTOR_ID);

  const order = await ctx.order.createOrder(INDUSTRY_ID, {
    batchId: batch.id,
    requested_weight_kg: 5,
    offered_price_per_kg: 3400,
  });
  const resolvedOrderId = order.id;

  const thread = await ctx.negotiation.startNegotiation(order.id, INDUSTRY_ID);
  await ctx.negotiation.sendOffer(thread.id, INDUSTRY_ID, 'industry', {
    price_per_kg: 3300,
    weight_kg: 5,
  });
  await ctx.negotiation.acceptOffer(thread.id, COLLECTOR_ID);

  await ctx.order.transitionOrderStatus(
    order.id,
    COLLECTOR_ID,
    'collector',
    'completed',
    {
      final_weight_kg: 5,
      final_price_per_kg: 3300,
    },
  );

  return {
    batchId: resolvedBatchId,
    listingId: published.id,
    orderId: resolvedOrderId,
  };
}
