import type { CollectorAvailableWasteListing, MaterialBatchMarketplaceItem, WasteListingWithDetails } from "@/lib/api/types";
import {
  createPickupClaim,
  getWasteListing,
  listPickupClaims,
  updatePickupClaimStatus,
} from "@/lib/api/services";
import { DEMO_MATERIALS_MARKETPLACE, DEMO_WASTE_MARKETPLACE, isDemoMarketplaceId, mergeCatalog } from "@/data/demo-marketplace";
import {
  addDemoClaim,
  addStoredClaimFromListing,
  addUserListing,
  getActiveStoredClaims,
  getDemoClaimListingIds,
  getPublishedDemoBatches,
  getStoredClaimByListingId,
  getUserListings,
  publishDemoBatch,
  removePublishedBatch,
  removeStoredClaim,
  removeUserListing,
  resolveLocalWasteListing,
  wasteDetailToCollectorListing,
} from "@/lib/demo-workflow-store";

export type ClaimResult = { mode: "api" | "demo" | "local"; listingTitle?: string };

export async function resolveWasteListing(
  accessToken: string | null,
  listingId: string,
): Promise<CollectorAvailableWasteListing | null> {
  const local = resolveLocalWasteListing(listingId);
  if (local) return local;

  if (!accessToken || isDemoMarketplaceId(listingId)) return null;

  try {
    const detail = await getWasteListing(accessToken, listingId);
    const mapped = wasteDetailToCollectorListing(detail);
    addUserListing(mapped);
    return mapped;
  } catch {
    return null;
  }
}

export function mergePublicWasteCatalog(apiItems: CollectorAvailableWasteListing[] | undefined) {
  const { items } = mergeCatalog(apiItems, [...DEMO_WASTE_MARKETPLACE, ...getUserListings()]);
  return items;
}

export function mergeCollectorWasteCatalog(apiItems: CollectorAvailableWasteListing[] | undefined) {
  const userListings = getUserListings();
  const claimedIds = new Set(getDemoClaimListingIds());
  const { items } = mergeCatalog(apiItems, [...DEMO_WASTE_MARKETPLACE, ...userListings]);
  return items.filter((item) => !claimedIds.has(item.id));
}

export function registerUserListingFromApi(listing: WasteListingWithDetails) {
  addUserListing(wasteDetailToCollectorListing(listing));
}

export async function syncApiClaimsToStore(accessToken: string) {
  const apiClaims = await listPickupClaims(accessToken).catch(() => []);
  const active = apiClaims.filter((c) => c.status === "claimed" || c.status === "picked_up");

  for (const claim of active) {
    const existing = getStoredClaimByListingId(claim.listing_id);
    if (existing) continue;

    const listing = await resolveWasteListing(accessToken, claim.listing_id);
    if (listing) {
      addStoredClaimFromListing(listing, "api", claim.id);
    }
  }
}

export async function claimWasteListing(
  accessToken: string,
  listingId: string,
  listing?: CollectorAvailableWasteListing,
): Promise<ClaimResult> {
  const snapshot = listing ?? (await resolveWasteListing(accessToken, listingId)) ?? undefined;

  if (isDemoMarketplaceId(listingId) || !accessToken) {
    if (snapshot) {
      addStoredClaimFromListing(snapshot, isDemoMarketplaceId(listingId) ? "demo" : "local");
    } else {
      addDemoClaim(listingId);
    }
    return { mode: isDemoMarketplaceId(listingId) ? "demo" : "local", listingTitle: snapshot?.title };
  }

  try {
    const claim = await createPickupClaim(accessToken, listingId);
    if (snapshot) {
      addStoredClaimFromListing(snapshot, "api", claim.id);
    }
    return { mode: "api", listingTitle: snapshot?.title };
  } catch (err) {
    if (snapshot) {
      addStoredClaimFromListing(snapshot, "local");
      return { mode: "local", listingTitle: snapshot.title };
    }
    throw err;
  }
}

export async function cancelPickupClaim(accessToken: string | null, listingId: string) {
  const stored = getStoredClaimByListingId(listingId);
  removeStoredClaim(listingId);

  if (stored?.source === "api" && stored.claimId && accessToken) {
    try {
      await updatePickupClaimStatus(accessToken, stored.claimId, "cancelled", {
        cancel_reason: "Dibatalkan pengepul",
      });
    } catch {
      // Local state already cleared; backend may be unavailable in demo.
    }
  }
}

export async function deleteUserWasteListing(accessToken: string | null, listingId: string) {
  removeUserListing(listingId);
  removeStoredClaim(listingId);

  if (accessToken && !isDemoMarketplaceId(listingId)) {
    try {
      const { cancelWasteListing } = await import("@/lib/api/services");
      await cancelWasteListing(accessToken, listingId, "Dihapus pengguna");
    } catch {
      // Listing may only exist locally during offline demo.
    }
  }
}

export function deletePublishedBatch(batchId: string) {
  removePublishedBatch(batchId);
}

export function mergeMaterialsWithDemo(apiItems: MaterialBatchMarketplaceItem[] | undefined) {
  const published = getPublishedDemoBatches();
  const { items } = mergeCatalog(apiItems, [...published, ...DEMO_MATERIALS_MARKETPLACE]);
  return items;
}

export function createDemoBatchFromClaims(input: {
  name: string;
  categoryId: string;
  categoryName: string;
  categoryCode: string;
  pricePerKg: number;
  sourceListingIds: string[];
  collectorName?: string;
}) {
  const totalWeightKg = input.sourceListingIds.reduce((sum, id) => {
    const stored = getActiveStoredClaims().find((c) => c.listingId === id);
    if (stored) return sum + stored.estimated_weight_kg;
    const waste = resolveLocalWasteListing(id);
    return sum + (waste?.estimated_weight_kg ?? 0);
  }, 0);

  return publishDemoBatch({
    ...input,
    totalWeightKg: totalWeightKg || 25,
  });
}

export const DEMO_WASTE_CATEGORIES = Array.from(
  new Map(DEMO_MATERIALS_MARKETPLACE.map((m) => [m.category.id, m.category])).values(),
);
