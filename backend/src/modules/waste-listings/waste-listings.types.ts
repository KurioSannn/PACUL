import type { WasteCategory } from '../waste-categories/waste-categories.types';

export type WasteListingStatus =
  | 'draft'
  | 'available'
  | 'claimed'
  | 'pickup_planned'
  | 'picked_up'
  | 'sorting'
  | 'sorted'
  | 'converted_to_material'
  | 'cancelled';

export interface WasteListing {
  id: string;
  household_id: string;
  category_id: string;
  classification_id: string | null;
  title: string;
  description: string | null;
  estimated_weight_kg: number;
  actual_weight_kg: number | null;
  status: WasteListingStatus;
  address: string;
  latitude: number;
  longitude: number;
  district: string | null;
  city: string | null;
  province: string | null;
  available_from: string | null;
  available_until: string | null;
  notes: string | null;
  pickup_fee: number;
  claimed_by: string | null;
  claimed_at: string | null;
  picked_up_at: string | null;
  sorted_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface WasteListingImage {
  id: string;
  listing_id: string;
  image_path: string;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

export interface CreateWasteListingDto {
  category_id: string;
  classification_id?: string;
  title: string;
  description?: string;
  estimated_weight_kg: number;
  address: string;
  latitude: number;
  longitude: number;
  district?: string;
  city?: string;
  province?: string;
  available_from?: string;
  available_until?: string;
  notes?: string;
  imagePaths?: string[];
}

export interface UpdateWasteListingDto {
  category_id?: string;
  classification_id?: string | null;
  title?: string;
  description?: string | null;
  estimated_weight_kg?: number;
  address?: string;
  latitude?: number;
  longitude?: number;
  district?: string | null;
  city?: string | null;
  province?: string | null;
  available_from?: string | null;
  available_until?: string | null;
  notes?: string | null;
  imagePaths?: string[];
}

export interface WasteListingWithDetails extends WasteListing {
  category: WasteCategory;
  images: WasteListingImage[];
}

export interface PaginatedWasteListings {
  items: WasteListingWithDetails[];
  page: number;
  limit: number;
  total: number;
}

export interface CollectorListingFilters {
  city?: string;
  categoryId?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  page?: number;
  limit?: number;
}

export interface CollectorAvailableWasteListing {
  id: string;
  title: string;
  description: string | null;
  estimated_weight_kg: number;
  status: 'available';
  city: string | null;
  district: string | null;
  province: string | null;
  latitude: number;
  longitude: number;
  available_from: string | null;
  available_until: string | null;
  pickup_fee: number;
  created_at: string;
  category: WasteCategory;
  household_display_name: string;
  images: WasteListingImage[];
  distance_km: number | null;
}

export interface PaginatedCollectorAvailableWaste {
  items: CollectorAvailableWasteListing[];
  page: number;
  limit: number;
  total: number;
}
