import type { CollectorAvailableWasteListing, MaterialBatchMarketplaceItem, PickupClaim, WasteListingWithDetails } from "@/lib/api/types";
import { DEMO_WASTE_MARKETPLACE, getDemoWasteById, isDemoMarketplaceId } from "@/data/demo-marketplace";
import type { PickupMapListingView } from "@/data/demo-pickup-map";

export const DEMO_WORKFLOW_EVENT = "pacul-demo-workflow-changed";

const CLAIMS_KEY = "pacul-collector-claims-v1";
const BATCHES_KEY = "pacul-demo-published-batches-v1";
const USER_LISTINGS_KEY = "pacul-user-waste-listings-v1";

export type StoredClaim = {
  listingId: string;
  claimId?: string;
  title: string;
  latitude: number;
  longitude: number;
  district: string | null;
  city: string | null;
  estimated_weight_kg: number;
  claimedAt: string;
  status: "claimed" | "picked_up" | "sorted";
  source: "demo" | "api" | "local";
};

function readClaims(): StoredClaim[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CLAIMS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredClaim[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeClaims(claims: StoredClaim[]) {
  localStorage.setItem(CLAIMS_KEY, JSON.stringify(claims));
  window.dispatchEvent(new Event(DEMO_WORKFLOW_EVENT));
}

function readUserListings(): CollectorAvailableWasteListing[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(USER_LISTINGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CollectorAvailableWasteListing[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeUserListings(listings: CollectorAvailableWasteListing[]) {
  localStorage.setItem(USER_LISTINGS_KEY, JSON.stringify(listings));
  window.dispatchEvent(new Event(DEMO_WORKFLOW_EVENT));
}

function readPublishedBatches(): MaterialBatchMarketplaceItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BATCHES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MaterialBatchMarketplaceItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writePublishedBatches(batches: MaterialBatchMarketplaceItem[]) {
  localStorage.setItem(BATCHES_KEY, JSON.stringify(batches));
  window.dispatchEvent(new Event(DEMO_WORKFLOW_EVENT));
}

export function wasteDetailToCollectorListing(
  listing: WasteListingWithDetails,
  householdLabel = "Rumah Tangga (Anda)",
): CollectorAvailableWasteListing {
  return {
    id: listing.id,
    title: listing.title,
    description: listing.description,
    estimated_weight_kg: listing.estimated_weight_kg,
    status: "available",
    city: listing.city,
    district: listing.district,
    province: listing.province,
    latitude: listing.latitude,
    longitude: listing.longitude,
    available_from: listing.available_from,
    available_until: listing.available_until,
    pickup_fee: listing.pickup_fee ?? 0,
    created_at: listing.created_at,
    category: listing.category,
    household_display_name: householdLabel,
    images: listing.images ?? [],
    distance_km: null,
  };
}

function listingToStoredClaim(
  listing: CollectorAvailableWasteListing,
  source: StoredClaim["source"],
  claimId?: string,
): StoredClaim {
  return {
    listingId: listing.id,
    claimId,
    title: listing.title,
    latitude: listing.latitude,
    longitude: listing.longitude,
    district: listing.district,
    city: listing.city,
    estimated_weight_kg: listing.estimated_weight_kg,
    claimedAt: new Date().toISOString(),
    status: "claimed",
    source,
  };
}

export function getUserListings(): CollectorAvailableWasteListing[] {
  return readUserListings();
}

export function addUserListing(listing: CollectorAvailableWasteListing): void {
  const listings = readUserListings().filter((item) => item.id !== listing.id);
  writeUserListings([listing, ...listings]);
}

export function removeUserListing(listingId: string): void {
  writeUserListings(readUserListings().filter((item) => item.id !== listingId));
}

export function getUserListingById(id: string): CollectorAvailableWasteListing | null {
  return readUserListings().find((item) => item.id === id) ?? null;
}

export function resolveLocalWasteListing(id: string): CollectorAvailableWasteListing | null {
  return getDemoWasteById(id) ?? getUserListingById(id) ?? null;
}

export function getStoredClaims(): StoredClaim[] {
  return readClaims();
}

export function getActiveStoredClaims(): StoredClaim[] {
  return readClaims().filter((c) => c.status === "claimed" || c.status === "picked_up");
}

export function getStoredClaimByListingId(listingId: string): StoredClaim | null {
  return readClaims().find((c) => c.listingId === listingId && c.status !== "sorted") ?? null;
}

export function getDemoClaimListingIds(): string[] {
  return getActiveStoredClaims().map((c) => c.listingId);
}

export function getStoredClaimsAsMapListings(): PickupMapListingView[] {
  return getActiveStoredClaims().map((c) => ({
    id: c.listingId,
    title: c.title,
    latitude: c.latitude,
    longitude: c.longitude,
    district: c.district,
    city: c.city,
    estimated_weight_kg: c.estimated_weight_kg,
    distance_km: null,
  }));
}

export function addStoredClaimFromListing(
  listing: CollectorAvailableWasteListing,
  source: StoredClaim["source"],
  claimId?: string,
): void {
  const claims = readClaims().filter(
    (c) => !(c.listingId === listing.id && c.status !== "sorted"),
  );
  writeClaims([...claims, listingToStoredClaim(listing, source, claimId)]);
}

export function addDemoClaim(listingId: string): void {
  const listing = resolveLocalWasteListing(listingId) ?? DEMO_WASTE_MARKETPLACE.find((w) => w.id === listingId);
  if (!listing) return;
  addStoredClaimFromListing(listing, isDemoMarketplaceId(listingId) ? "demo" : "local");
}

export function removeStoredClaim(listingId: string): void {
  writeClaims(readClaims().filter((c) => c.listingId !== listingId));
}

export function markClaimsPickedUp(listingIds: string[]): void {
  const idSet = new Set(listingIds);
  writeClaims(
    readClaims().map((c) => (idSet.has(c.listingId) && c.status === "claimed" ? { ...c, status: "picked_up" as const } : c)),
  );
}

export function markClaimsSorted(listingIds: string[]): void {
  const idSet = new Set(listingIds);
  writeClaims(
    readClaims().map((c) => (idSet.has(c.listingId) ? { ...c, status: "sorted" as const } : c)),
  );
}

export function toStoredPickupClaims(): PickupClaim[] {
  return getActiveStoredClaims().map((c) => ({
    id: c.claimId ?? `stored-claim-${c.listingId}`,
    listing_id: c.listingId,
    collector_id: "local-collector",
    status: c.status === "picked_up" ? "picked_up" : "claimed",
    claimed_at: c.claimedAt,
    pickup_scheduled_at: null,
    pickup_completed_at: c.status === "picked_up" ? c.claimedAt : null,
    cancelled_at: null,
    cancel_reason: null,
    route_id: null,
    created_at: c.claimedAt,
    updated_at: c.claimedAt,
  }));
}

export function getPublishedDemoBatches(): MaterialBatchMarketplaceItem[] {
  return readPublishedBatches();
}

export function removePublishedBatch(batchId: string): void {
  writePublishedBatches(readPublishedBatches().filter((b) => b.id !== batchId));
}

export function publishDemoBatch(input: {
  name: string;
  categoryId: string;
  categoryName: string;
  categoryCode: string;
  pricePerKg: number;
  totalWeightKg: number;
  sourceListingIds: string[];
  collectorName?: string;
}): MaterialBatchMarketplaceItem {
  const ts = new Date().toISOString();
  const id = `demo-batch-${Date.now()}`;
  const batch: MaterialBatchMarketplaceItem = {
    id,
    collector_id: "demo-collector-local",
    category_id: input.categoryId,
    name: input.name,
    description: `Batch hasil pemilahan — ${input.categoryName}`,
    total_weight_kg: input.totalWeightKg,
    price_per_kg: input.pricePerKg,
    min_order_kg: Math.min(10, input.totalWeightKg),
    status: "available",
    location_address: "Surabaya, Jawa Timur",
    latitude: -7.2892,
    longitude: 112.7348,
    city: "Surabaya",
    province: "Jawa Timur",
    available_from: null,
    available_until: null,
    notes: `Sumber: ${input.sourceListingIds.length} listing`,
    published_at: ts,
    sold_at: null,
    created_at: ts,
    updated_at: ts,
    category: {
      id: input.categoryId,
      code: input.categoryCode,
      name: input.categoryName,
      unit: "kg",
    },
    collector: {
      display_name: input.collectorName ?? "Pengepul Demo (Anda)",
      rating_average: 4.8,
    },
  };

  writePublishedBatches([batch, ...readPublishedBatches()]);
  markClaimsSorted(input.sourceListingIds);
  return batch;
}

export function isDemoBatchId(id: string) {
  return id.startsWith("demo-batch-") || id.startsWith("demo-material-");
}

export function isLocalUserListingId(id: string) {
  return id.startsWith("local-listing-");
}

/** @deprecated use getStoredClaims */
export function getDemoClaimRecords() {
  return getStoredClaims();
}

/** @deprecated use toStoredPickupClaims */
export function toDemoPickupClaims() {
  return toStoredPickupClaims();
}

export function markDemoClaimsSorted(listingIds: string[]) {
  markClaimsSorted(listingIds);
}
