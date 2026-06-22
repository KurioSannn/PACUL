import type { CollectorAvailableWasteListing, PickupMapApiResponse } from "@/lib/api/types";

/** Surabaya area — dipakai jika API pickup map kosong (demo hackathon). */
export const DEMO_COLLECTOR_BASE = {
  latitude: -7.2892,
  longitude: 112.7348,
  label: "Gudang Pengepul Surabaya Timur",
};

export type PickupMapListingView = {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  district: string | null;
  city: string | null;
  estimated_weight_kg: number;
  distance_km: number | null;
};

export type MergedPickupMapData = {
  collector_base: { latitude: number; longitude: number; label: string };
  listings: PickupMapListingView[];
  isDemoFallback: boolean;
};

const demoCategory = (code: string, name: string) => ({
  id: `demo-cat-${code}`,
  code,
  name,
  description: null,
  icon_key: null,
  unit: "kg",
  typical_price_per_kg: null,
  ai_model_class: code,
  sort_order: 0,
});

export const DEMO_PICKUP_LISTINGS: CollectorAvailableWasteListing[] = [
  {
    id: "demo-listing-001",
    title: "Plastik PET botol bekas",
    description: "±15 kg botol PET bersih, sudah dicuci",
    estimated_weight_kg: 15,
    status: "available",
    city: "Surabaya",
    district: "Rungkut",
    province: "Jawa Timur",
    latitude: -7.3312,
    longitude: 112.7511,
    available_from: null,
    available_until: null,
    pickup_fee: 0,
    created_at: new Date().toISOString(),
    category: demoCategory("plastic_pet", "Plastik PET"),
    household_display_name: "Bu Siti (RT)",
    images: [],
    distance_km: 4.2,
  },
  {
    id: "demo-listing-002",
    title: "Kardus & kertas koran",
    description: "Kardus flatten ±20 kg",
    estimated_weight_kg: 20,
    status: "available",
    city: "Surabaya",
    district: "Gubeng",
    province: "Jawa Timur",
    latitude: -7.2725,
    longitude: 112.7528,
    available_from: null,
    available_until: null,
    pickup_fee: 0,
    created_at: new Date().toISOString(),
    category: demoCategory("paper_cardboard", "Kertas/Kardus"),
    household_display_name: "Pak Budi (RT)",
    images: [],
    distance_km: 2.1,
  },
  {
    id: "demo-listing-003",
    title: "Kaleng aluminium",
    description: "Kaleng minuman ±8 kg",
    estimated_weight_kg: 8,
    status: "available",
    city: "Surabaya",
    district: "Sukolilo",
    province: "Jawa Timur",
    latitude: -7.2945,
    longitude: 112.7932,
    available_from: null,
    available_until: null,
    pickup_fee: 0,
    created_at: new Date().toISOString(),
    category: demoCategory("metal_aluminum", "Logam/Kaleng"),
    household_display_name: "Ibu Rina (RT)",
    images: [],
    distance_km: 5.8,
  },
  {
    id: "demo-listing-004",
    title: "Botol kaca bening",
    description: "Botol saus & minuman ±12 kg",
    estimated_weight_kg: 12,
    status: "available",
    city: "Surabaya",
    district: "Wonokromo",
    province: "Jawa Timur",
    latitude: -7.3038,
    longitude: 112.7341,
    available_from: null,
    available_until: null,
    pickup_fee: 0,
    created_at: new Date().toISOString(),
    category: demoCategory("glass", "Kaca"),
    household_display_name: "Pak Agus (RT)",
    images: [],
    distance_km: 3.4,
  },
  {
    id: "demo-listing-005",
    title: "HDPE tutup & wadah plastik",
    description: "Plastik keras ±10 kg",
    estimated_weight_kg: 10,
    status: "available",
    city: "Surabaya",
    district: "Tenggilis Mejoyo",
    province: "Jawa Timur",
    latitude: -7.3189,
    longitude: 112.7684,
    available_from: null,
    available_until: null,
    pickup_fee: 0,
    created_at: new Date().toISOString(),
    category: demoCategory("plastic_hdpe", "Plastik HDPE"),
    household_display_name: "Bu Dewi (RT)",
    images: [],
    distance_km: 3.9,
  },
];

export type DemoRoutePreview = {
  total_distance_km: number;
  estimated_duration_minutes: number;
  estimated_cost_idr: number;
  stops: Array<{ title: string; address: string; latitude: number; longitude: number; order: number }>;
  polyline: Array<[number, number]>;
};

function parseAreaSummary(area: string): { district: string | null; city: string | null } {
  const parts = area.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return { district: null, city: null };
  if (parts.length === 1) return { district: parts[0], city: null };
  return { district: parts[0], city: parts.slice(1).join(", ") };
}

function normalizeBase(base: { latitude?: number; longitude?: number; label?: string }) {
  const lat = Number(base.latitude);
  const lng = Number(base.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) {
    return DEMO_COLLECTOR_BASE;
  }
  return {
    latitude: lat,
    longitude: lng,
    label: base.label?.trim() || DEMO_COLLECTOR_BASE.label,
  };
}

function fromAvailableListing(item: CollectorAvailableWasteListing): PickupMapListingView {
  return {
    id: item.id,
    title: item.title,
    latitude: item.latitude,
    longitude: item.longitude,
    district: item.district,
    city: item.city,
    estimated_weight_kg: item.estimated_weight_kg,
    distance_km: item.distance_km,
  };
}

function fromApiPoint(point: NonNullable<PickupMapApiResponse["points"]>[number]): PickupMapListingView {
  const { district, city } = parseAreaSummary(point.area_summary);
  const title = point.category_name
    ? `${point.category_name} · ${district ?? city ?? "Pickup"}`
    : `Pickup ${point.listing_id.slice(0, 8)}`;

  return {
    id: point.listing_id,
    title,
    latitude: point.latitude,
    longitude: point.longitude,
    district,
    city,
    estimated_weight_kg: point.estimated_weight_kg,
    distance_km: point.distance_km,
  };
}

function demoListingsView(): PickupMapListingView[] {
  return DEMO_PICKUP_LISTINGS.map(fromAvailableListing);
}

/** Nearest-neighbor fallback jika endpoint preview gagal (demo). */
export function buildDemoRoutePreview(
  listingIds: string[],
  listings: PickupMapListingView[],
): DemoRoutePreview {
  const base = DEMO_COLLECTOR_BASE;
  const picked = listingIds
    .map((id) => listings.find((l) => l.id === id))
    .filter(Boolean) as PickupMapListingView[];

  const remaining = [...picked];
  const ordered: PickupMapListingView[] = [];
  let current = { lat: base.latitude, lng: base.longitude };

  while (remaining.length > 0) {
    let nearestIdx = 0;
    let nearestDist = Infinity;
    remaining.forEach((item, idx) => {
      const d = haversineKm(current.lat, current.lng, item.latitude, item.longitude);
      if (d < nearestDist) {
        nearestDist = d;
        nearestIdx = idx;
      }
    });
    const next = remaining.splice(nearestIdx, 1)[0];
    ordered.push(next);
    current = { lat: next.latitude, lng: next.longitude };
  }

  let totalKm = 0;
  let prev = { lat: base.latitude, lng: base.longitude };
  const polyline: Array<[number, number]> = [[prev.lat, prev.lng]];

  for (const stop of ordered) {
    totalKm += haversineKm(prev.lat, prev.lng, stop.latitude, stop.longitude);
    polyline.push([stop.latitude, stop.longitude]);
    prev = { lat: stop.latitude, lng: stop.longitude };
  }
  totalKm += haversineKm(prev.lat, prev.lng, base.latitude, base.longitude);
  polyline.push([base.latitude, base.longitude]);

  const durationMin = Math.round(totalKm * 4 + ordered.length * 8);
  const costIdr = Math.round(totalKm * 4500 + ordered.length * 15000);

  return {
    total_distance_km: Math.round(totalKm * 10) / 10,
    estimated_duration_minutes: durationMin,
    estimated_cost_idr: costIdr,
    stops: ordered.map((s, i) => ({
      title: s.title,
      address: `${s.district ?? ""}, ${s.city ?? "Surabaya"}`.trim(),
      latitude: s.latitude,
      longitude: s.longitude,
      order: i + 1,
    })),
    polyline,
  };
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function mergePickupMapData(apiData: PickupMapApiResponse | null): MergedPickupMapData {
  if (apiData) {
    const collector_base = normalizeBase(apiData.collector_base);

    if (Array.isArray(apiData.points) && apiData.points.length > 0) {
      return {
        collector_base,
        listings: apiData.points.map(fromApiPoint),
        isDemoFallback: false,
      };
    }

    if (Array.isArray(apiData.listings) && apiData.listings.length > 0) {
      return {
        collector_base,
        listings: apiData.listings.map(fromAvailableListing),
        isDemoFallback: false,
      };
    }
  }

  return {
    collector_base: DEMO_COLLECTOR_BASE,
    listings: demoListingsView(),
    isDemoFallback: true,
  };
}
