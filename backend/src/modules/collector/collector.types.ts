import type { WasteCategory } from '../waste-categories/waste-categories.types';

export interface CollectorHandledCategory {
  id: string;
  collector_id: string;
  category_id: string;
  min_weight_kg: number;
  max_weight_kg: number | null;
  price_offered_per_kg: number | null;
  is_active: boolean;
  created_at: string;
}

export interface HandledCategoryWithDetails extends CollectorHandledCategory {
  category: WasteCategory;
}
