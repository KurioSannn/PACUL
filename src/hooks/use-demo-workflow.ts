"use client";

import { useCallback, useEffect, useState } from "react";

import {
  DEMO_WORKFLOW_EVENT,
  getDemoClaimListingIds,
  getPublishedDemoBatches,
  getStoredClaims,
  getStoredClaimsAsMapListings,
  getUserListings,
} from "@/lib/demo-workflow-store";

export function useDemoWorkflow() {
  const [claimedListingIds, setClaimedListingIds] = useState<string[]>([]);
  const [storedClaimListings, setStoredClaimListings] = useState<ReturnType<typeof getStoredClaimsAsMapListings>>([]);
  const [publishedBatches, setPublishedBatches] = useState<ReturnType<typeof getPublishedDemoBatches>>([]);
  const [claimRecords, setClaimRecords] = useState<ReturnType<typeof getStoredClaims>>([]);
  const [userListings, setUserListings] = useState<ReturnType<typeof getUserListings>>([]);

  const refresh = useCallback(() => {
    setClaimedListingIds(getDemoClaimListingIds());
    setStoredClaimListings(getStoredClaimsAsMapListings());
    setPublishedBatches(getPublishedDemoBatches());
    setClaimRecords(getStoredClaims());
    setUserListings(getUserListings());
  }, []);

  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    window.addEventListener(DEMO_WORKFLOW_EVENT, onChange);
    return () => window.removeEventListener(DEMO_WORKFLOW_EVENT, onChange);
  }, [refresh]);

  return {
    claimedListingIds,
    storedClaimListings,
    publishedBatches,
    claimRecords,
    userListings,
    refresh,
  };
}
