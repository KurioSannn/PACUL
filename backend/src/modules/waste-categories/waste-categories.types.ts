export interface WasteCategory {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon_key: string | null;
  unit: string;
  typical_price_per_kg: number | null;
  ai_model_class: string | null;
  sort_order: number;
}
