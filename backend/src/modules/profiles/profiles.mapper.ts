import type {
  CollectorProfile,
  HouseholdProfile,
  IndustryProfile,
  MeResponse,
  RoleProfileResponse,
  UserRole,
} from './profiles.types';

interface UserProfileRow {
  id: string;
  role: UserRole;
  display_name: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
}

interface HouseholdProfileRow {
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  district: string | null;
  city: string | null;
  province: string | null;
  total_waste_kg: number;
  total_listings: number;
}

interface CollectorProfileRow {
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

interface IndustryProfileRow {
  company_name: string;
  industry_type: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  rating_average: number;
  rating_count: number;
  total_orders: number;
}

function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  return Number(value);
}

export function mapHouseholdProfileRow(
  row: HouseholdProfileRow,
): HouseholdProfile {
  return {
    id: '',
    address: row.address,
    latitude: toNumber(row.latitude),
    longitude: toNumber(row.longitude),
    district: row.district,
    city: row.city,
    province: row.province,
    totalWasteKg: Number(row.total_waste_kg ?? 0),
    totalListings: Number(row.total_listings ?? 0),
  };
}

export function mapCollectorProfileRow(
  row: CollectorProfileRow,
): CollectorProfile {
  return {
    id: '',
    businessName: row.business_name,
    serviceAreaDescription: row.service_area_description,
    baseLatitude: toNumber(row.base_latitude),
    baseLongitude: toNumber(row.base_longitude),
    vehicleCapacityKg: toNumber(row.vehicle_capacity_kg),
    ratingAverage: Number(row.rating_average ?? 0),
    ratingCount: Number(row.rating_count ?? 0),
    totalPickups: Number(row.total_pickups ?? 0),
    totalKgCollected: Number(row.total_kg_collected ?? 0),
  };
}

export function mapIndustryProfileRow(
  row: IndustryProfileRow,
): IndustryProfile {
  return {
    id: '',
    companyName: row.company_name,
    industryType: row.industry_type,
    address: row.address,
    latitude: toNumber(row.latitude),
    longitude: toNumber(row.longitude),
    ratingAverage: Number(row.rating_average ?? 0),
    ratingCount: Number(row.rating_count ?? 0),
    totalOrders: Number(row.total_orders ?? 0),
  };
}

export function toHouseholdProfileResponse(
  profile: HouseholdProfile,
): RoleProfileResponse {
  return {
    address: profile.address,
    latitude: profile.latitude,
    longitude: profile.longitude,
    district: profile.district,
    city: profile.city,
    province: profile.province,
    total_waste_kg: profile.totalWasteKg,
    total_listings: profile.totalListings,
  };
}

export function toCollectorProfileResponse(
  profile: CollectorProfile,
): RoleProfileResponse {
  return {
    business_name: profile.businessName,
    service_area_description: profile.serviceAreaDescription,
    base_latitude: profile.baseLatitude,
    base_longitude: profile.baseLongitude,
    vehicle_capacity_kg: profile.vehicleCapacityKg,
    rating_average: profile.ratingAverage,
    rating_count: profile.ratingCount,
    total_pickups: profile.totalPickups,
    total_kg_collected: profile.totalKgCollected,
  };
}

export function toIndustryProfileResponse(
  profile: IndustryProfile,
): RoleProfileResponse {
  return {
    company_name: profile.companyName,
    industry_type: profile.industryType,
    address: profile.address,
    latitude: profile.latitude,
    longitude: profile.longitude,
    rating_average: profile.ratingAverage,
    rating_count: profile.ratingCount,
    total_orders: profile.totalOrders,
  };
}

export function toMeResponse(
  userProfile: UserProfileRow,
  email: string,
  roleProfile: RoleProfileResponse,
): MeResponse {
  return {
    id: userProfile.id,
    email,
    role: userProfile.role,
    display_name: userProfile.display_name,
    phone: userProfile.phone,
    avatar_url: userProfile.avatar_url,
    is_active: userProfile.is_active,
    profile: roleProfile,
  };
}

export type {
  CollectorProfileRow,
  HouseholdProfileRow,
  IndustryProfileRow,
  UserProfileRow,
};
