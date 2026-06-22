export type MaterialBatchStatus =
  | 'draft'
  | 'available'
  | 'ordered'
  | 'negotiating'
  | 'sold'
  | 'unavailable';

export interface MaterialBatch {
  id: string;
  collector_id: string;
  category_id: string;
  name: string;
  description: string | null;
  total_weight_kg: number;
  price_per_kg: number;
  min_order_kg: number;
  status: MaterialBatchStatus;
  location_address: string | null;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  province: string | null;
  available_from: string | null;
  available_until: string | null;
  notes: string | null;
  published_at: string | null;
  sold_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MaterialBatchSource {
  id: string;
  batch_id: string;
  listing_id: string;
  actual_weight_kg: number;
  notes: string | null;
  created_at: string;
}

export interface MaterialBatchSourceSummary {
  source_count: number;
  total_source_weight_kg: number;
}

export interface MaterialBatchMarketplaceSourceSummary {
  source_count: number;
  cities: string[];
}

export interface MaterialBatchCategorySummary {
  id: string;
  code: string;
  name: string;
  unit: string;
}

export interface MaterialBatchCollectorSummary {
  display_name: string;
  rating_average: number;
}

export interface MaterialBatchMarketplaceItem extends MaterialBatch {
  category: MaterialBatchCategorySummary;
  collector: MaterialBatchCollectorSummary;
}

export interface MaterialBatchMarketplaceDetail extends MaterialBatch {
  category: MaterialBatchCategorySummary;
  collector: MaterialBatchCollectorSummary;
  source_summary: MaterialBatchMarketplaceSourceSummary;
}

export interface PaginatedMaterialMarketplace {
  items: MaterialBatchMarketplaceItem[];
  page: number;
  limit: number;
  total: number;
}

export interface MaterialMarketplaceFilters {
  category_id?: string;
  city?: string;
  min_weight_kg?: number;
  max_price_per_kg?: number;
  province?: string;
  sort?: 'published_at' | 'price_per_kg';
  page?: number;
  limit?: number;
}

export interface MaterialBatchSourceListingDetails {
  id: string;
  title: string;
  status: string;
  estimated_weight_kg: number;
  actual_weight_kg: number | null;
  address: string;
  city: string | null;
}

export interface MaterialBatchSourceWithListing extends MaterialBatchSource {
  listing: MaterialBatchSourceListingDetails;
}

export interface MaterialBatchWithDetails extends MaterialBatch {
  sources: MaterialBatchSourceWithListing[];
  source_summary: MaterialBatchSourceSummary;
  category?: MaterialBatchCategorySummary;
  collector?: MaterialBatchCollectorSummary;
}

export interface UpdateMaterialBatchDto {
  name?: string;
  description?: string | null;
  price_per_kg?: number;
  min_order_kg?: number;
  location_address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  city?: string | null;
  province?: string | null;
  available_from?: string | null;
  available_until?: string | null;
  notes?: string | null;
}

export interface CreateMaterialBatchDto {
  category_id: string;
  name: string;
  description?: string;
  price_per_kg: number;
  min_order_kg?: number;
  location_address?: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  province?: string;
  available_from?: string;
  available_until?: string;
  notes?: string;
  sourceListingIds?: string[];
}
