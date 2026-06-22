import { createClient } from '@supabase/supabase-js';

export interface WasteCategorySeed {
  code: string;
  name: string;
  description: string;
  icon_key: string;
  ai_model_class: string;
  typical_price_per_kg: number;
  sort_order: number;
}

export const WASTE_CATEGORY_SEEDS: WasteCategorySeed[] = [
  {
    code: 'PLASTIC_PET',
    name: 'Botol PET',
    description: 'Botol plastik PET seperti botol minuman.',
    icon_key: 'plastic-pet',
    ai_model_class: 'plastic_pet',
    typical_price_per_kg: 2500,
    sort_order: 1,
  },
  {
    code: 'PLASTIC_OTHER',
    name: 'Plastik Lainnya',
    description: 'Plastik selain PET, seperti HDPE atau kemasan campuran.',
    icon_key: 'plastic-other',
    ai_model_class: 'plastic_other',
    typical_price_per_kg: 1500,
    sort_order: 2,
  },
  {
    code: 'PAPER',
    name: 'Kertas dan Kardus',
    description: 'Kertas, kardus, dan material serupa yang dapat didaur ulang.',
    icon_key: 'paper',
    ai_model_class: 'paper_cardboard',
    typical_price_per_kg: 2000,
    sort_order: 3,
  },
  {
    code: 'METAL_CAN',
    name: 'Kaleng Logam',
    description: 'Kaleng aluminium dan logam ringan lainnya.',
    icon_key: 'metal-can',
    ai_model_class: 'metal_can',
    typical_price_per_kg: 4000,
    sort_order: 4,
  },
  {
    code: 'GLASS',
    name: 'Kaca',
    description: 'Botol kaca dan pecahan kaca yang layak daur ulang.',
    icon_key: 'glass',
    ai_model_class: 'glass',
    typical_price_per_kg: 500,
    sort_order: 5,
  },
  {
    code: 'ELECTRONICS',
    name: 'Elektronik',
    description: 'Sampah elektronik kecil dan komponen bernilai daur ulang.',
    icon_key: 'electronics',
    ai_model_class: 'electronics',
    typical_price_per_kg: 15000,
    sort_order: 6,
  },
  {
    code: 'ORGANIC',
    name: 'Organik',
    description: 'Sampah organik seperti sisa makanan dan daun.',
    icon_key: 'organic',
    ai_model_class: 'organic',
    typical_price_per_kg: 300,
    sort_order: 7,
  },
  {
    code: 'TEXTILE',
    name: 'Tekstil',
    description: 'Kain, pakaian bekas, dan material tekstil lainnya.',
    icon_key: 'textile',
    ai_model_class: 'textile',
    typical_price_per_kg: 1000,
    sort_order: 8,
  },
];

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export async function seedWasteCategories(): Promise<void> {
  const supabase = createClient(
    requireEnv('SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );

  const rows = WASTE_CATEGORY_SEEDS.map((category) => ({
    code: category.code,
    name: category.name,
    description: category.description,
    icon_key: category.icon_key,
    unit: 'kg',
    typical_price_per_kg: category.typical_price_per_kg,
    ai_model_class: category.ai_model_class,
    is_active: true,
    sort_order: category.sort_order,
  }));

  const { error } = await supabase
    .from('waste_categories')
    .upsert(rows, { onConflict: 'code' });

  if (error) {
    throw new Error(`Failed to seed waste categories: ${error.message}`);
  }

  console.log(`Seeded ${rows.length} waste categories.`);
}
