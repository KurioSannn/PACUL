import { apiRequest } from "@/lib/api/client";
import type {
  AiClassificationResult,
  CollectorAvailableWasteListing,
  DashboardSummary,
  LocalImpact,
  MaterialBatch,
  MaterialBatchMarketplaceItem,
  MaterialMarketListing,
  MeResponse,
  NegotiationMessage,
  NegotiationThread,
  NegotiationThreadWithDetails,
  NotificationItem,
  NotificationListResult,
  OrderRecord,
  OrderWithDetails,
  PaginatedCollectorAvailableWaste,
  PaginatedMaterialMarketplace,
  PaginatedWasteListings,
  PickupClaim,
  PickupMapApiResponse,
  PickupRoute,
  PlatformImpact,
  PointsSummary,
  RatingSummary,
  ReportExportRecord,
  TransactionRecord,
  TraceabilityEvent,
  UserRole,
  WasteCategory,
  WasteListingWithDetails,
} from "@/lib/api/types";

type Token = string | null | undefined;

// --- Auth & profile ---

export function getCapabilities(token?: Token) {
  return apiRequest<Record<UserRole, string[]>>("/roles/capabilities", { token });
}

export function getMe(token: Token) {
  return apiRequest<MeResponse>("/me", { token });
}

export function completeProfile(
  token: Token,
  body: {
    role: UserRole;
    displayName: string;
    phone?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    district?: string;
    city?: string;
    province?: string;
    businessName?: string;
    serviceAreaDescription?: string;
    baseLatitude?: number;
    baseLongitude?: number;
    vehicleCapacityKg?: number;
    companyName?: string;
    industryType?: string;
  },
) {
  return apiRequest<MeResponse>("/auth/complete-profile", {
    method: "POST",
    token,
    body,
  });
}

export function updateProfile(token: Token, body: Record<string, unknown>) {
  return apiRequest<MeResponse>("/me/profile", { method: "PATCH", token, body });
}

// --- Waste categories ---

export function listWasteCategories() {
  return apiRequest<WasteCategory[]>("/waste-categories");
}

// --- Waste listings ---

export function listWasteListings(
  token: Token,
  query?: { status?: string; category_id?: string; page?: number; limit?: number },
) {
  return apiRequest<PaginatedWasteListings>("/waste-listings", { token, query });
}

export function getWasteListing(token: Token, id: string) {
  return apiRequest<WasteListingWithDetails>(`/waste-listings/${id}`, { token });
}

export function createWasteListing(
  token: Token,
  body: {
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
    notes?: string;
    imagePaths?: string[];
  },
) {
  return apiRequest<WasteListingWithDetails>("/waste-listings", {
    method: "POST",
    token,
    body,
  });
}

export function updateWasteListing(
  token: Token,
  id: string,
  body: Record<string, unknown>,
) {
  return apiRequest<WasteListingWithDetails>(`/waste-listings/${id}`, {
    method: "PATCH",
    token,
    body,
  });
}

export function publishWasteListing(token: Token, id: string) {
  return apiRequest<WasteListingWithDetails>(`/waste-listings/${id}/publish`, {
    method: "POST",
    token,
  });
}

export function cancelWasteListing(token: Token, id: string, reason?: string) {
  return apiRequest<WasteListingWithDetails>(`/waste-listings/${id}/cancel`, {
    method: "POST",
    token,
    body: reason ? { reason } : {},
  });
}

// --- Collector ---

export function getCollectorAvailableWaste(
  token: Token,
  query?: {
    city?: string;
    category_id?: string;
    lat?: number;
    lng?: number;
    radius_km?: number;
    page?: number;
    limit?: number;
  },
) {
  return apiRequest<PaginatedCollectorAvailableWaste>("/collector/available-waste", {
    token,
    query,
  });
}

export function getPickupMapData(token: Token) {
  return apiRequest<PickupMapApiResponse>("/collector/pickup-map-data", { token });
}

export function getHandledCategories(token: Token) {
  return apiRequest<WasteCategory[]>("/collector/handled-categories", { token });
}

export function setHandledCategories(token: Token, categories: string[]) {
  return apiRequest<WasteCategory[]>("/collector/handled-categories", {
    method: "POST",
    token,
    body: { categories },
  });
}

// --- Pickup claims ---

export function createPickupClaim(token: Token, listingId: string) {
  return apiRequest<PickupClaim>("/collector/pickup-claims", {
    method: "POST",
    token,
    body: { listingId },
  });
}

export function listPickupClaims(token: Token) {
  return apiRequest<PickupClaim[]>("/collector/pickup-claims", { token });
}

export function updatePickupClaimStatus(
  token: Token,
  id: string,
  status: string,
) {
  return apiRequest<PickupClaim>(`/collector/pickup-claims/${id}/status`, {
    method: "PATCH",
    token,
    body: { status },
  });
}

// --- Routes ---

export function previewRoute(token: Token, listingIds: string[]) {
  return apiRequest<Record<string, unknown>>("/routes/preview", {
    method: "POST",
    token,
    body: { listingIds },
  });
}

export function commitRoute(token: Token, listingIds: string[], notes?: string) {
  return apiRequest<PickupRoute>("/routes", {
    method: "POST",
    token,
    body: notes ? { listingIds, notes } : { listingIds },
  });
}

export function getRoute(token: Token, id: string) {
  return apiRequest<PickupRoute & { stops?: unknown[] }>(`/routes/${id}`, { token });
}

export function updateRouteStatus(token: Token, id: string, status: string) {
  return apiRequest<PickupRoute>(`/routes/${id}/status`, {
    method: "PATCH",
    token,
    body: { status },
  });
}

// --- Material batches (collector) ---

export function listCollectorBatches(token: Token, status?: string) {
  return apiRequest<MaterialBatch[]>("/collector/material-batches", {
    token,
    query: status ? { status } : undefined,
  });
}

export function createMaterialBatch(token: Token, body: Record<string, unknown>) {
  return apiRequest<MaterialBatch>("/collector/material-batches", {
    method: "POST",
    token,
    body,
  });
}

export function getMaterialBatch(token: Token, id: string) {
  return apiRequest<MaterialBatch>(`/collector/material-batches/${id}`, { token });
}

export function publishMaterialBatch(token: Token, id: string) {
  return apiRequest<MaterialBatch>(`/collector/material-batches/${id}/publish`, {
    method: "POST",
    token,
  });
}

export function markSortingComplete(token: Token, id: string) {
  return apiRequest<MaterialBatch>(
    `/collector/material-batches/${id}/sorting-complete`,
    { method: "POST", token },
  );
}

export function addBatchSources(
  token: Token,
  id: string,
  sources: Array<{ listingId: string; weightKg: number; notes?: string }>,
) {
  return apiRequest<MaterialBatch>(`/collector/material-batches/${id}/sources`, {
    method: "POST",
    token,
    body: { sources },
  });
}

// --- Materials marketplace ---

export function listMaterials(
  token: Token,
  query?: Record<string, string | number | undefined>,
) {
  return apiRequest<PaginatedMaterialMarketplace>("/materials", { token, query });
}

export function getMaterial(token: Token, id: string) {
  return apiRequest<MaterialBatchMarketplaceItem>(`/materials/${id}`, { token });
}

export function publishToMarket(
  token: Token,
  batchId: string,
  body: Record<string, unknown>,
) {
  return apiRequest<MaterialMarketListing>(
    `/materials/${batchId}/publish-to-market`,
    { method: "POST", token, body },
  );
}

// --- Orders ---

export function listOrders(token: Token, status?: string) {
  return apiRequest<OrderWithDetails[]>("/orders", {
    token,
    query: status ? { status } : undefined,
  });
}

export function getOrder(token: Token, id: string) {
  return apiRequest<OrderWithDetails>(`/orders/${id}`, { token });
}

export function createOrder(
  token: Token,
  body: {
    batchId: string;
    requested_weight_kg: number;
    offered_price_per_kg: number;
    notes?: string;
  },
) {
  return apiRequest<OrderRecord>("/orders", { method: "POST", token, body });
}

export function updateOrderStatus(
  token: Token,
  id: string,
  body: Record<string, unknown>,
) {
  return apiRequest<OrderRecord>(`/orders/${id}/status`, {
    method: "PATCH",
    token,
    body,
  });
}

// --- Negotiations ---

export function startOrderNegotiation(token: Token, orderId: string) {
  return apiRequest<NegotiationThreadWithDetails>(`/orders/${orderId}/negotiation`, {
    method: "POST",
    token,
  });
}

export function getOrderNegotiationHistory(token: Token, orderId: string) {
  return apiRequest<NegotiationThreadWithDetails>(`/orders/${orderId}/negotiation/history`, {
    token,
  });
}

export function getNegotiation(token: Token, id: string) {
  return apiRequest<NegotiationThreadWithDetails>(`/negotiations/${id}`, { token });
}

export function getNegotiationMessages(token: Token, id: string, limit = 50) {
  return apiRequest<NegotiationMessage[]>(`/negotiations/${id}/messages`, {
    token,
    query: { limit },
  });
}

export function sendNegotiationMessage(
  token: Token,
  id: string,
  content: string,
) {
  return apiRequest<NegotiationMessage>(`/negotiations/${id}/messages`, {
    method: "POST",
    token,
    body: { content },
  });
}

export function sendNegotiationOffer(
  token: Token,
  id: string,
  body: { price_per_kg: number; weight_kg: number; message?: string },
) {
  return apiRequest<NegotiationThreadWithDetails>(`/negotiations/${id}/offers`, {
    method: "POST",
    token,
    body,
  });
}

export function acceptNegotiationOffer(token: Token, id: string) {
  return apiRequest<NegotiationThreadWithDetails>(`/negotiations/${id}/accept`, {
    method: "POST",
    token,
  });
}

// --- Transactions ---

export function listTransactions(token: Token) {
  return apiRequest<TransactionRecord[]>("/transactions", { token });
}

export function completeTransaction(token: Token, id: string) {
  return apiRequest<unknown>(`/transactions/${id}/complete`, {
    method: "POST",
    token,
  });
}

export function simulateOrderTransaction(token: Token, orderId: string) {
  return apiRequest<unknown>(`/orders/${orderId}/transactions/simulate`, {
    method: "POST",
    token,
  });
}

// --- Dashboard & impact ---

export function getDashboardSummary(token: Token) {
  return apiRequest<DashboardSummary>("/dashboard/summary", { token });
}

export function getPlatformImpact(
  token: Token,
  query?: { from?: string; to?: string; city?: string; province?: string },
) {
  return apiRequest<PlatformImpact>("/dashboard/impact", { token, query });
}

export function getLocalImpact(
  token: Token,
  query?: { from?: string; to?: string; city?: string; province?: string },
) {
  return apiRequest<LocalImpact>("/dashboard/local-impact", { token, query });
}

export function getRouteStats(token: Token) {
  return apiRequest<Record<string, unknown>>("/dashboard/routes", { token });
}

// --- AI ---

export function getModelVersion() {
  return apiRequest<{ version_string: string; model_type: string }>(
    "/ai/model-version",
  );
}

export function classifyWaste(token: Token, imagePath: string) {
  return apiRequest<AiClassificationResult>("/ai/classify-waste", {
    method: "POST",
    token,
    body: { imagePath },
  });
}

export function classifyWasteClient(
  token: Token,
  body: {
    imagePath: string;
    top_class: string;
    confidence: number;
    model_version: string;
    inference_time_ms: number;
    top_k: Array<{ class: string; confidence: number; label?: string }>;
  },
) {
  return apiRequest<AiClassificationResult>("/ai/classify-waste/client", {
    method: "POST",
    token,
    body,
  });
}

export function getClassification(token: Token, id: string) {
  return apiRequest<AiClassificationResult>(`/ai/classifications/${id}`, { token });
}

export function overrideClassification(
  token: Token,
  id: string,
  body: { override_category_id: string; reason?: string },
) {
  return apiRequest<AiClassificationResult>(`/ai/classifications/${id}/override`, {
    method: "POST",
    token,
    body,
  });
}

// --- Storage ---

export function uploadWasteImage(token: Token, file: File) {
  const formData = new FormData();
  formData.append("image", file);
  return apiRequest<{ path: string; signed_url?: string }>("/waste-images/upload", {
    method: "POST",
    token,
    formData,
  });
}

// --- Notifications ---

export function listNotifications(token: Token, isRead?: boolean) {
  return apiRequest<NotificationListResult>("/notifications", {
    token,
    query: isRead === undefined ? undefined : { is_read: isRead },
  });
}

export function markNotificationRead(token: Token, id: string) {
  return apiRequest<NotificationItem>(`/notifications/${id}/read`, {
    method: "PATCH",
    token,
  });
}

export function markAllNotificationsRead(token: Token) {
  return apiRequest<{ updated_count: number }>("/notifications/read-all", {
    method: "PATCH",
    token,
  });
}

// --- Eco points ---

export function getMyPoints(token: Token) {
  return apiRequest<PointsSummary>("/points/me", { token });
}

// --- Traceability ---

export function getMaterialTraceability(token: Token, batchId: string) {
  return apiRequest<{ batchEvents: TraceabilityEvent[] }>(`/traceability/material/${batchId}`, {
    token,
  });
}

export function getWasteTraceability(token: Token, listingId: string) {
  return apiRequest<{ events: TraceabilityEvent[] }>(`/traceability/waste/${listingId}`, {
    token,
  });
}

// --- Ratings ---

export function submitRating(
  token: Token,
  body: {
    rateeId: string;
    rating: number;
    reviewText?: string;
    contextType: "pickup" | "transaction";
    contextId: string;
  },
) {
  return apiRequest<unknown>("/ratings", { method: "POST", token, body });
}

export function getRatingSummary(token: Token, actorId: string) {
  return apiRequest<RatingSummary>(`/ratings/summary/${actorId}`, { token });
}

// --- Reports ---

export function listReports(token: Token) {
  return apiRequest<ReportExportRecord[]>("/reports", { token });
}

export function exportReportPdf(
  token: Token,
  body: { from?: string; to?: string; report_type?: string },
) {
  return apiRequest<ReportExportRecord>("/reports/export/pdf", {
    method: "POST",
    token,
    body,
  });
}

export function exportReportExcel(
  token: Token,
  body: { from?: string; to?: string; report_type?: string },
) {
  return apiRequest<ReportExportRecord>("/reports/export/excel", {
    method: "POST",
    token,
    body,
  });
}
