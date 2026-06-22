export const HOUSEHOLD_ID = '11111111-1111-1111-1111-111111111111';
export const COLLECTOR_ID = '22222222-2222-2222-2222-222222222222';
export const COLLECTOR_OTHER_ID = '33333333-3333-3333-3333-333333333333';
export const INDUSTRY_ID = '44444444-4444-4444-4444-444444444444';

export const CATEGORY_PET_ID = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
export const CATEGORY_GLASS_ID = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

export const DEFAULT_CATEGORY = {
  id: CATEGORY_PET_ID,
  code: 'PLASTIC_PET',
  name: 'Botol PET',
  description: null,
  icon_key: 'plastic-pet',
  unit: 'kg',
  typical_price_per_kg: 2500,
  ai_model_class: 'plastic_pet',
  sort_order: 1,
  is_active: true,
};

export const GLASS_CATEGORY = {
  id: CATEGORY_GLASS_ID,
  code: 'GLASS',
  name: 'Kaca',
  description: null,
  icon_key: 'glass',
  unit: 'kg',
  typical_price_per_kg: 800,
  ai_model_class: 'glass',
  sort_order: 2,
  is_active: true,
};

export const DEFAULT_IMAGE_PATH = `waste-images/${HOUSEHOLD_ID}/temp/photo.jpg`;

export async function flushAsync(): Promise<void> {
  await new Promise<void>((resolve) => setImmediate(resolve));
}
