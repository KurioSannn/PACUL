import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import type { WasteCategory } from '../waste-categories/waste-categories.types';
import type { SetHandledCategoryDto } from './dto/set-handled-category.dto';
import type {
  CollectorHandledCategory,
  HandledCategoryWithDetails,
} from './collector.types';

interface HandledCategoryRow {
  id: string;
  collector_id: string;
  category_id: string;
  min_weight_kg: number | string;
  max_weight_kg: number | string | null;
  price_offered_per_kg: number | string | null;
  is_active: boolean;
  created_at: string;
}

interface HandledCategoryWithJoinRow extends HandledCategoryRow {
  category: WasteCategoryRow | WasteCategoryRow[] | null;
}

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
export class CollectorService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getHandledCategories(
    collectorId: string,
  ): Promise<HandledCategoryWithDetails[]> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('collector_handled_categories')
      .select(
        `
        id,
        collector_id,
        category_id,
        min_weight_kg,
        max_weight_kg,
        price_offered_per_kg,
        is_active,
        created_at,
        category:waste_categories (
          id,
          code,
          name,
          description,
          icon_key,
          unit,
          typical_price_per_kg,
          ai_model_class,
          sort_order
        )
      `,
      )
      .eq('collector_id', collectorId)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to load handled categories',
        code: 'HANDLED_CATEGORIES_LOAD_FAILED',
        details: error.message,
      });
    }

    return (data ?? []).map((row) =>
      this.mapHandledCategoryWithDetails(row as HandledCategoryWithJoinRow),
    );
  }

  async setHandledCategories(
    collectorId: string,
    items: SetHandledCategoryDto[],
  ): Promise<HandledCategoryWithDetails[]> {
    if (items.length === 0) {
      return this.getHandledCategories(collectorId);
    }

    const admin = this.supabaseService.getAdminClient();
    const rows = items.map((item) => ({
      collector_id: collectorId,
      category_id: item.categoryId,
      min_weight_kg: item.minWeightKg ?? 0,
      max_weight_kg: item.maxWeightKg ?? null,
      price_offered_per_kg: item.priceOfferedPerKg ?? null,
      is_active: true,
    }));

    const { error } = await admin
      .from('collector_handled_categories')
      .upsert(rows, { onConflict: 'collector_id,category_id' });

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to save handled categories',
        code: 'HANDLED_CATEGORIES_UPSERT_FAILED',
        details: error.message,
      });
    }

    return this.getHandledCategories(collectorId);
  }

  async removeHandledCategory(
    collectorId: string,
    categoryId: string,
  ): Promise<void> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('collector_handled_categories')
      .delete()
      .eq('collector_id', collectorId)
      .eq('category_id', categoryId)
      .select('id')
      .maybeSingle<{ id: string }>();

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to remove handled category',
        code: 'HANDLED_CATEGORY_DELETE_FAILED',
        details: error.message,
      });
    }

    if (!data) {
      throw new NotFoundException({
        error: 'Handled category not found for this collector',
        code: 'HANDLED_CATEGORY_NOT_FOUND',
      });
    }
  }

  async getCollectorsForCategory(
    categoryId: string,
  ): Promise<CollectorHandledCategory[]> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('collector_handled_categories')
      .select(
        'id, collector_id, category_id, min_weight_kg, max_weight_kg, price_offered_per_kg, is_active, created_at',
      )
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to load collectors for category',
        code: 'HANDLED_CATEGORIES_LOAD_FAILED',
        details: error.message,
      });
    }

    return (data ?? []).map((row) => this.mapHandledCategory(row));
  }

  private mapHandledCategory(
    row: HandledCategoryRow,
  ): CollectorHandledCategory {
    return {
      id: row.id,
      collector_id: row.collector_id,
      category_id: row.category_id,
      min_weight_kg: Number(row.min_weight_kg ?? 0),
      max_weight_kg:
        row.max_weight_kg === null ? null : Number(row.max_weight_kg),
      price_offered_per_kg:
        row.price_offered_per_kg === null
          ? null
          : Number(row.price_offered_per_kg),
      is_active: row.is_active,
      created_at: row.created_at,
    };
  }

  private mapHandledCategoryWithDetails(
    row: HandledCategoryWithJoinRow,
  ): HandledCategoryWithDetails {
    const categoryRow = Array.isArray(row.category)
      ? row.category[0]
      : row.category;

    if (!categoryRow) {
      throw new InternalServerErrorException({
        error: 'Handled category is missing linked waste category',
        code: 'HANDLED_CATEGORY_CATEGORY_MISSING',
      });
    }

    return {
      ...this.mapHandledCategory(row),
      category: this.mapCategory(categoryRow),
    };
  }

  private mapCategory(row: WasteCategoryRow): WasteCategory {
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
