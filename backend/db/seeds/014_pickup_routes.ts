import {
  DEMO_LISTING_IDS,
  DEMO_PICKUP_CLAIM_IDS,
  DEMO_ROUTE_ID,
  DEMO_ROUTE_STOP_IDS,
} from './demo-seed.constants';
import {
  assertDemoSeedEnabled,
  createSeedSupabase,
  getDemoUser,
  insertIfNotExists,
} from './demo-seed.utils';

export async function seedPickupRoutes(): Promise<void> {
  assertDemoSeedEnabled();

  const supabase = createSeedSupabase();
  const collector1 = getDemoUser('collector1');
  let inserted = 0;

  const routeResult = await insertIfNotExists(
    supabase,
    'pickup_routes',
    { id: DEMO_ROUTE_ID },
    {
      id: DEMO_ROUTE_ID,
      collector_id: collector1.id,
      status: 'completed',
      total_distance_km: 14.6,
      estimated_duration_minutes: 55,
      total_weight_kg: 26.3,
      estimated_cost: 42790,
      actual_cost: 42790,
      started_at: '2026-06-15T07:00:00.000Z',
      completed_at: '2026-06-15T10:30:00.000Z',
      cancelled_at: null,
      cancel_reason: null,
      notes: 'Rute demo Surabaya–Sidoarjo untuk 2 titik pickup.',
    },
  );

  if (routeResult === 'inserted') {
    inserted += 1;
  }

  const claims = [
    {
      id: DEMO_PICKUP_CLAIM_IDS.plasticOther,
      listingId: DEMO_LISTING_IDS.plasticOtherClaimed,
      status: 'claimed',
      claimedAt: '2026-06-18T08:30:00.000Z',
      routeId: null,
    },
    {
      id: DEMO_PICKUP_CLAIM_IDS.metal,
      listingId: DEMO_LISTING_IDS.metalSorted,
      status: 'picked_up',
      claimedAt: '2026-06-15T06:00:00.000Z',
      pickupCompletedAt: '2026-06-15T09:15:00.000Z',
      routeId: DEMO_ROUTE_ID,
    },
    {
      id: DEMO_PICKUP_CLAIM_IDS.pet,
      listingId: DEMO_LISTING_IDS.petSorted,
      status: 'picked_up',
      claimedAt: '2026-06-15T05:30:00.000Z',
      pickupCompletedAt: '2026-06-15T08:45:00.000Z',
      routeId: DEMO_ROUTE_ID,
    },
  ] as const;

  for (const claim of claims) {
    const result = await insertIfNotExists(
      supabase,
      'pickup_claims',
      { id: claim.id },
      {
        id: claim.id,
        listing_id: claim.listingId,
        collector_id: collector1.id,
        status: claim.status,
        claimed_at: claim.claimedAt,
        pickup_scheduled_at:
          claim.status === 'picked_up' ? '2026-06-15T07:00:00.000Z' : null,
        pickup_completed_at:
          'pickupCompletedAt' in claim ? claim.pickupCompletedAt : null,
        cancelled_at: null,
        cancel_reason: null,
        route_id: claim.routeId,
        notes: null,
      },
    );

    if (result === 'inserted') {
      inserted += 1;
    }
  }

  const stops = [
    {
      id: DEMO_ROUTE_STOP_IDS.pet,
      listingId: DEMO_LISTING_IDS.petSorted,
      sequence: 1,
      distanceFromPreviousKm: 0,
      status: 'completed',
      completedAt: '2026-06-15T08:45:00.000Z',
    },
    {
      id: DEMO_ROUTE_STOP_IDS.metal,
      listingId: DEMO_LISTING_IDS.metalSorted,
      sequence: 2,
      distanceFromPreviousKm: 14.6,
      status: 'completed',
      completedAt: '2026-06-15T09:15:00.000Z',
    },
  ] as const;

  for (const stop of stops) {
    const result = await insertIfNotExists(
      supabase,
      'pickup_route_stops',
      { id: stop.id },
      {
        id: stop.id,
        route_id: DEMO_ROUTE_ID,
        listing_id: stop.listingId,
        sequence_number: stop.sequence,
        distance_from_previous_km: stop.distanceFromPreviousKm,
        estimated_arrival_minutes: stop.sequence === 1 ? 25 : 55,
        status: stop.status,
        arrived_at: stop.completedAt,
        completed_at: stop.completedAt,
        notes: null,
      },
    );

    if (result === 'inserted') {
      inserted += 1;
    }
  }

  console.log(`Pickup routes ready (inserted ${inserted} new rows).`);
}
