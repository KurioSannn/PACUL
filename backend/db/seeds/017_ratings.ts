import {
  DEMO_ORDER_IDS,
  DEMO_PICKUP_CLAIM_IDS,
  DEMO_RATING_IDS,
} from './demo-seed.constants';
import {
  assertDemoSeedEnabled,
  createSeedSupabase,
  getDemoUser,
  insertIfNotExists,
} from './demo-seed.utils';

export async function seedRatings(): Promise<void> {
  assertDemoSeedEnabled();

  const supabase = createSeedSupabase();
  const household1 = getDemoUser('household1');
  const industry1 = getDemoUser('industry1');
  const collector1 = getDemoUser('collector1');
  let inserted = 0;

  const pickupRatingResult = await insertIfNotExists(
    supabase,
    'ratings_reviews',
    { id: DEMO_RATING_IDS.householdPickup },
    {
      id: DEMO_RATING_IDS.householdPickup,
      rater_id: household1.id,
      ratee_id: collector1.id,
      rating: 5,
      review_text: 'Pickup tepat waktu dan penimbangan jelas.',
      context_type: 'pickup',
      context_id: DEMO_PICKUP_CLAIM_IDS.pet,
      created_at: '2026-06-16T10:00:00.000Z',
    },
  );

  if (pickupRatingResult === 'inserted') {
    inserted += 1;
  }

  const transactionRatingResult = await insertIfNotExists(
    supabase,
    'ratings_reviews',
    { id: DEMO_RATING_IDS.industryTransaction },
    {
      id: DEMO_RATING_IDS.industryTransaction,
      rater_id: industry1.id,
      ratee_id: collector1.id,
      rating: 4,
      review_text: 'Material sesuai spesifikasi, pengiriman sedikit terlambat.',
      context_type: 'transaction',
      context_id: DEMO_ORDER_IDS.metalCompleted,
      created_at: '2026-06-21T09:00:00.000Z',
    },
  );

  if (transactionRatingResult === 'inserted') {
    inserted += 1;
  }

  const { error: profileUpdateError } = await supabase
    .from('collector_profiles')
    .update({
      rating_average: 4.5,
      rating_count: 2,
    })
    .eq('id', collector1.id);

  if (profileUpdateError) {
    throw new Error(
      `Failed to update collector rating summary: ${profileUpdateError.message}`,
    );
  }

  console.log(`Ratings ready (inserted ${inserted} new rows).`);
}
