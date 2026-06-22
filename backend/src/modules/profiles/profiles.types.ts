export type UserRole = 'household' | 'collector' | 'industry';

export interface UserProfile {
  id: string; // UUID from auth.users
  role: UserRole;
  displayName: string;
  phone: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export interface HouseholdProfile {
  id: string; // FK to user_profiles.id
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  district: string | null;
  city: string | null;
  province: string | null;
  totalWasteKg: number;
  totalListings: number;
}

export interface CollectorProfile {
  id: string; // FK to user_profiles.id
  businessName: string | null;
  serviceAreaDescription: string | null;
  baseLatitude: number | null;
  baseLongitude: number | null;
  vehicleCapacityKg: number | null;
  ratingAverage: number;
  ratingCount: number;
  totalPickups: number;
  totalKgCollected: number;
}

export interface IndustryProfile {
  id: string; // FK to user_profiles.id
  companyName: string;
  industryType: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  ratingAverage: number;
  ratingCount: number;
  totalOrders: number;
}

export interface UserWithProfile {
  profile: UserProfile;
  householdProfile?: HouseholdProfile | null;
  collectorProfile?: CollectorProfile | null;
  industryProfile?: IndustryProfile | null;
}

export interface HouseholdProfileResponse {
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  district: string | null;
  city: string | null;
  province: string | null;
  total_waste_kg: number;
  total_listings: number;
}

export interface CollectorProfileResponse {
  business_name: string | null;
  service_area_description: string | null;
  base_latitude: number | null;
  base_longitude: number | null;
  vehicle_capacity_kg: number | null;
  rating_average: number;
  rating_count: number;
  total_pickups: number;
  total_kg_collected: number;
}

export interface IndustryProfileResponse {
  company_name: string;
  industry_type: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  rating_average: number;
  rating_count: number;
  total_orders: number;
}

export type RoleProfileResponse =
  | HouseholdProfileResponse
  | CollectorProfileResponse
  | IndustryProfileResponse;

export interface MeResponse {
  id: string;
  email: string;
  role: UserRole;
  display_name: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  profile: RoleProfileResponse;
}
