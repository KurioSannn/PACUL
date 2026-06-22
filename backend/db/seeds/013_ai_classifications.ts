import { DEMO_CLASSIFICATION_IDS } from './demo-seed.constants';
import {
  assertDemoSeedEnabled,
  createSeedSupabase,
  fetchCategoryIdMap,
  getDemoUser,
  insertIfNotExists,
} from './demo-seed.utils';

const DEMO_CLASSIFICATIONS = [
  {
    id: DEMO_CLASSIFICATION_IDS.household1Pet,
    userKey: 'household1' as const,
    imagePath: 'waste-images/demo/household1/pet-bottles.jpg',
    topClass: 'plastic_pet',
    confidence: 0.9234,
    categoryCode: 'PLASTIC_PET',
    topK: [
      { class: 'plastic_pet', confidence: 0.9234 },
      { class: 'plastic_other', confidence: 0.0512 },
      { class: 'glass', confidence: 0.0121 },
    ],
    createdAt: '2026-06-12T10:00:00.000Z',
  },
  {
    id: DEMO_CLASSIFICATION_IDS.household1Plastic,
    userKey: 'household1' as const,
    imagePath: 'waste-images/demo/household1/mixed-plastic.jpg',
    topClass: 'plastic_other',
    confidence: 0.8871,
    categoryCode: 'PLASTIC_OTHER',
    topK: [
      { class: 'plastic_other', confidence: 0.8871 },
      { class: 'plastic_pet', confidence: 0.0788 },
      { class: 'textile', confidence: 0.0189 },
    ],
    createdAt: '2026-06-13T11:30:00.000Z',
  },
  {
    id: DEMO_CLASSIFICATION_IDS.household2Paper,
    userKey: 'household2' as const,
    imagePath: 'waste-images/demo/household2/cardboard.jpg',
    topClass: 'paper_cardboard',
    confidence: 0.9512,
    categoryCode: 'PAPER',
    topK: [
      { class: 'paper_cardboard', confidence: 0.9512 },
      { class: 'textile', confidence: 0.0288 },
      { class: 'organic', confidence: 0.0095 },
    ],
    createdAt: '2026-06-14T09:15:00.000Z',
  },
] as const;

export async function seedAiClassifications(): Promise<void> {
  assertDemoSeedEnabled();

  const supabase = createSeedSupabase();
  const categoryMap = await fetchCategoryIdMap(supabase);
  let inserted = 0;

  for (const record of DEMO_CLASSIFICATIONS) {
    const categoryId = categoryMap.get(record.categoryCode);

    if (!categoryId) {
      throw new Error(`Missing waste category code: ${record.categoryCode}`);
    }

    const user = getDemoUser(record.userKey);

    const result = await insertIfNotExists(
      supabase,
      'ai_classifications',
      { id: record.id },
      {
        id: record.id,
        user_id: user.id,
        image_path: record.imagePath,
        top_class: record.topClass,
        confidence: record.confidence,
        top_k_results: record.topK,
        db_category_id: categoryId,
        is_mock: true,
        model_version: 'mock-1.0.0',
        inference_time_ms: 42,
        is_overridden: false,
        override_category_id: null,
        override_reason: null,
        overridden_at: null,
        overridden_by: null,
        created_at: record.createdAt,
      },
    );

    if (result === 'inserted') {
      inserted += 1;
    }
  }

  console.log(`AI classifications ready (inserted ${inserted} new rows).`);
}
