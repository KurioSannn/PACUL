import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import type { WasteCategory } from '../waste-categories/waste-categories.types';
import { getTaxonomyEntry } from './ai.taxonomy';
import type { ClassificationResult } from './classifier.interface';

interface WasteCategoryRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon_key: string | null;
  unit: string;
  typical_price_per_kg: number | string | null;
  ai_model_class: string | null;
  sort_order: number;
}

export interface MappedTopKCategory {
  class: string;
  confidence: number;
  label: string;
  category: WasteCategory | null;
}

@Injectable()
export class CategoryMapperService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async mapAIClassToDBCategory(aiClass: string): Promise<WasteCategory | null> {
    const taxonomy = getTaxonomyEntry(aiClass);

    if (!taxonomy.db_category_code) {
      return null;
    }

    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('waste_categories')
      .select(
        'id, code, name, description, icon_key, unit, typical_price_per_kg, ai_model_class, sort_order',
      )
      .eq('code', taxonomy.db_category_code)
      .eq('is_active', true)
      .maybeSingle<WasteCategoryRow>();

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to map AI class to waste category',
        code: 'CATEGORY_MAP_FAILED',
        details: error.message,
      });
    }

    if (!data) {
      return null;
    }

    return this.mapCategoryRow(data);
  }

  async getTopKCategories(
    result: ClassificationResult,
  ): Promise<MappedTopKCategory[]> {
    return Promise.all(
      result.top_k.map(async (entry) => ({
        class: entry.class,
        confidence: entry.confidence,
        label: entry.label,
        category: await this.mapAIClassToDBCategory(entry.class),
      })),
    );
  }

  isBelowThreshold(result: ClassificationResult): boolean {
    const taxonomy = getTaxonomyEntry(result.top_class);

    if (taxonomy.class === 'unknown' || taxonomy.db_category_code === null) {
      return true;
    }

    return result.confidence < taxonomy.confidence_threshold;
  }

  private mapCategoryRow(row: WasteCategoryRow): WasteCategory {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
      icon_key: row.icon_key,
      unit: row.unit,
      typical_price_per_kg:
        row.typical_price_per_kg === null
          ? null
          : Number(row.typical_price_per_kg),
      ai_model_class: row.ai_model_class,
      sort_order: row.sort_order,
    };
  }
}
