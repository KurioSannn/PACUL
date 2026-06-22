export type AIWasteClass =
  | 'plastic_pet'
  | 'plastic_other'
  | 'paper_cardboard'
  | 'metal_can'
  | 'glass'
  | 'electronics'
  | 'organic'
  | 'textile'
  | 'unknown';

export interface WasteTaxonomyEntry {
  class: AIWasteClass;
  label: string;
  description: string;
  db_category_code: string | null;
  confidence_threshold: number;
}

export const WASTE_AI_TAXONOMY: Record<AIWasteClass, WasteTaxonomyEntry> = {
  plastic_pet: {
    class: 'plastic_pet',
    label: 'Botol PET',
    description: 'Botol plastik PET seperti botol minuman.',
    db_category_code: 'PLASTIC_PET',
    confidence_threshold: 0.5,
  },
  plastic_other: {
    class: 'plastic_other',
    label: 'Plastik Lainnya',
    description: 'Plastik selain PET, seperti HDPE atau kemasan campuran.',
    db_category_code: 'PLASTIC_OTHER',
    confidence_threshold: 0.5,
  },
  paper_cardboard: {
    class: 'paper_cardboard',
    label: 'Kertas dan Kardus',
    description: 'Kertas, kardus, dan material serupa yang dapat didaur ulang.',
    db_category_code: 'PAPER',
    confidence_threshold: 0.5,
  },
  metal_can: {
    class: 'metal_can',
    label: 'Kaleng Logam',
    description: 'Kaleng aluminium dan logam ringan lainnya.',
    db_category_code: 'METAL_CAN',
    confidence_threshold: 0.5,
  },
  glass: {
    class: 'glass',
    label: 'Kaca',
    description: 'Botol kaca dan pecahan kaca yang layak daur ulang.',
    db_category_code: 'GLASS',
    confidence_threshold: 0.5,
  },
  electronics: {
    class: 'electronics',
    label: 'Elektronik',
    description: 'Sampah elektronik kecil dan komponen bernilai daur ulang.',
    db_category_code: 'ELECTRONICS',
    confidence_threshold: 0.5,
  },
  organic: {
    class: 'organic',
    label: 'Organik',
    description: 'Sampah organik seperti sisa makanan dan daun.',
    db_category_code: 'ORGANIC',
    confidence_threshold: 0.5,
  },
  textile: {
    class: 'textile',
    label: 'Tekstil',
    description: 'Kain, pakaian bekas, dan material tekstil lainnya.',
    db_category_code: 'TEXTILE',
    confidence_threshold: 0.5,
  },
  unknown: {
    class: 'unknown',
    label: 'Tidak dikenali',
    description: 'Kelas sampah tidak dikenali atau di luar taksonomi model.',
    db_category_code: null,
    confidence_threshold: 0,
  },
};

export function getTaxonomyEntry(aiClass: string): WasteTaxonomyEntry {
  if (aiClass in WASTE_AI_TAXONOMY) {
    return WASTE_AI_TAXONOMY[aiClass as AIWasteClass];
  }

  return WASTE_AI_TAXONOMY.unknown;
}

export function getTaxonomyLabel(aiClass: string): string {
  return getTaxonomyEntry(aiClass).label;
}
