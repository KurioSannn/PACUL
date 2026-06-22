import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import type { WasteCategory } from './waste-categories.types';

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

@Injectable()
export class WasteCategoriesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async listActiveCategories(): Promise<WasteCategory[]> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('waste_categories')
      .select(
        'id, code, name, description, icon_key, unit, typical_price_per_kg, ai_model_class, sort_order',
      )
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to load waste categories',
        code: 'WASTE_CATEGORIES_LOAD_FAILED',
        details: error.message,
      });
    }

    return (data ?? []).map((row) => this.mapRow(row));
  }

  private mapRow(row: WasteCategoryRow): WasteCategory {
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
