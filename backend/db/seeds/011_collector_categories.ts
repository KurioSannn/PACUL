import {
  assertDemoSeedEnabled,
  createSeedSupabase,
  fetchCategoryIdMap,
  getDemoUser,
  insertIfNotExists,
} from './demo-seed.utils';

const COLLECTOR1_CATEGORIES = [
  { code: 'PLASTIC_PET', price: 2600, min: 1, max: 200 },
  { code: 'PLASTIC_OTHER', price: 1800, min: 1, max: 150 },
  { code: 'METAL_CAN', price: 4200, min: 0.5, max: 100 },
  { code: 'GLASS', price: 600, min: 2, max: 80 },
] as const;

const COLLECTOR2_CATEGORIES = [
  { code: 'PAPER', price: 2100, min: 2, max: 300 },
  { code: 'TEXTILE', price: 1100, min: 1, max: 120 },
] as const;

export async function seedCollectorCategories(): Promise<void> {
  assertDemoSeedEnabled();

  const supabase = createSeedSupabase();
  const categoryMap = await fetchCategoryIdMap(supabase);
  const collector1 = getDemoUser('collector1');
  const collector2 = getDemoUser('collector2');

  let inserted = 0;

  for (const entry of COLLECTOR1_CATEGORIES) {
    const categoryId = categoryMap.get(entry.code);

    if (!categoryId) {
      throw new Error(`Missing waste category code: ${entry.code}`);
    }

    const result = await insertIfNotExists(
      supabase,
      'collector_handled_categories',
      { collector_id: collector1.id, category_id: categoryId },
      {
        collector_id: collector1.id,
        category_id: categoryId,
        min_weight_kg: entry.min,
        max_weight_kg: entry.max,
        price_offered_per_kg: entry.price,
        is_active: true,
      },
    );

    if (result === 'inserted') {
      inserted += 1;
    }
  }

  for (const entry of COLLECTOR2_CATEGORIES) {
    const categoryId = categoryMap.get(entry.code);

    if (!categoryId) {
      throw new Error(`Missing waste category code: ${entry.code}`);
    }

    const result = await insertIfNotExists(
      supabase,
      'collector_handled_categories',
      { collector_id: collector2.id, category_id: categoryId },
      {
        collector_id: collector2.id,
        category_id: categoryId,
        min_weight_kg: entry.min,
        max_weight_kg: entry.max,
        price_offered_per_kg: entry.price,
        is_active: true,
      },
    );

    if (result === 'inserted') {
      inserted += 1;
    }
  }

  console.log(
    `Collector handled categories ready (inserted ${inserted} new rows).`,
  );
}
