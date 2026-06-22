import type { ClassificationTopKEntry } from './classifier.interface';
import type { WasteCategory } from '../waste-categories/waste-categories.types';

export interface AiClassification {
  id: string;
  user_id: string;
  image_path: string;
  top_class: string;
  confidence: number;
  top_k_results: ClassificationTopKEntry[];
  db_category_id: string | null;
  is_mock: boolean;
  model_version: string | null;
  inference_time_ms: number | null;
  is_overridden: boolean;
  override_category_id: string | null;
  override_reason: string | null;
  overridden_at: string | null;
  overridden_by: string | null;
  created_at: string;
}

export interface ClassificationResponse {
  id: string;
  image_path: string;
  top_class: string;
  confidence: number;
  top_k_results: ClassificationTopKEntry[];
  category: WasteCategory | null;
  is_mock: boolean;
  model_version: string | null;
  inference_time_ms: number | null;
  is_overridden: boolean;
  override_category_id?: string | null;
  override_reason?: string | null;
  overridden_at?: string | null;
  overridden_by?: string | null;
  created_at: string;
  lowConfidence?: boolean;
  suggestion?: string;
}
