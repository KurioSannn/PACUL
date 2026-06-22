import {
  DEMO_BATCH_IDS,
  DEMO_LISTING_IDS,
  DEMO_LOCATIONS,
} from './demo-seed.constants';
import {
  assertDemoSeedEnabled,
  createSeedSupabase,
  fetchCategoryIdMap,
  getDemoUser,
  insertIfNotExists,
} from './demo-seed.utils';

export async function seedMaterialBatches(): Promise<void> {
  assertDemoSeedEnabled();

  const supabase = createSeedSupabase();
  const categoryMap = await fetchCategoryIdMap(supabase);
  const collector1 = getDemoUser('collector1');
  const petCategoryId = categoryMap.get('PLASTIC_PET');
  const metalCategoryId = categoryMap.get('METAL_CAN');

  if (!petCategoryId || !metalCategoryId) {
    throw new Error('Missing PLASTIC_PET or METAL_CAN category for demo batches.');
  }

  let inserted = 0;

  const batches = [
    {
      id: DEMO_BATCH_IDS.petAvailable,
      categoryId: petCategoryId,
      name: 'Batch PET Surabaya Juni',
      description: 'Botol PET hasil sortir dari pickup rumah tangga Surabaya.',
      totalWeightKg: 11.8,
      pricePerKg: 2600,
      status: 'available',
      listingId: DEMO_LISTING_IDS.petSorted,
      sourceWeightKg: 11.8,
      publishedAt: '2026-06-16T08:00:00.000Z',
      soldAt: null,
    },
    {
      id: DEMO_BATCH_IDS.metalSold,
      categoryId: metalCategoryId,
      name: 'Batch Kaleng Aluminium Sidoarjo',
      description: 'Kaleng aluminium bersih siap olah ulang.',
      totalWeightKg: 14.5,
      pricePerKg: 4100,
      status: 'sold',
      listingId: DEMO_LISTING_IDS.metalSorted,
      sourceWeightKg: 14.5,
      publishedAt: '2026-06-16T09:00:00.000Z',
      soldAt: '2026-06-20T15:00:00.000Z',
    },
  ] as const;

  for (const batch of batches) {
    const batchResult = await insertIfNotExists(
      supabase,
      'material_batches',
      { id: batch.id },
      {
        id: batch.id,
        collector_id: collector1.id,
        category_id: batch.categoryId,
        name: batch.name,
        description: batch.description,
        total_weight_kg: batch.totalWeightKg,
        price_per_kg: batch.pricePerKg,
        min_order_kg: 5,
        status: batch.status,
        location_address: DEMO_LOCATIONS.surabayaCollector.serviceArea,
        latitude: DEMO_LOCATIONS.surabayaCollector.latitude,
        longitude: DEMO_LOCATIONS.surabayaCollector.longitude,
        city: 'Surabaya',
        province: 'Jawa Timur',
        available_from: '2026-06-16T00:00:00.000Z',
        available_until: '2026-07-16T23:59:59.000Z',
        notes: null,
        published_at: batch.publishedAt,
        sold_at: batch.soldAt,
      },
    );

    if (batchResult === 'inserted') {
      inserted += 1;
    }

    const sourceResult = await insertIfNotExists(
      supabase,
      'material_batch_sources',
      { batch_id: batch.id, listing_id: batch.listingId },
      {
        batch_id: batch.id,
        listing_id: batch.listingId,
        actual_weight_kg: batch.sourceWeightKg,
        notes: 'Sumber demo dari waste listing hasil pickup.',
      },
    );

    if (sourceResult === 'inserted') {
      inserted += 1;
    }
  }

  console.log(`Material batches ready (inserted ${inserted} new rows).`);
}
