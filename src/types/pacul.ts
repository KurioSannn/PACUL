export type UserRole = "household" | "collector" | "industry";

export type WasteCategory =
  | "plastic"
  | "paper"
  | "metal"
  | "glass"
  | "organic"
  | "electronic";

export type WasteListingStatus =
  | "draft"
  | "listed"
  | "scheduled"
  | "picked_up"
  | "sorted"
  | "cancelled";

export type PickupStatus = "available" | "scheduled" | "in_progress" | "completed" | "cancelled";

export type MaterialStatus = "available" | "reserved" | "sold";

export type OrderStatus = "requested" | "negotiating" | "approved" | "paid" | "shipped" | "completed" | "cancelled";

export type NegotiationStatus = "waiting_reply" | "countered" | "approved" | "cancelled" | "completed";

export type TransactionStatus = "pending" | "paid" | "settled" | "cancelled";

export type ReviewStatus = "draft" | "submitted" | "published" | "archived";

export type DeployReadinessStatus = "ready" | "pending" | "blocked";

export type WasteListing = {
  id: string;
  householdId: string;
  householdName: string;
  title: string;
  category: WasteCategory;
  weightKg: number;
  district: string;
  address: string;
  status: WasteListingStatus;
  aiPredictedCategory?: WasteCategory | null;
  aiConfidence?: number | null;
  createdAt: string;
};

export type MaterialStock = {
  id: string;
  collectorId: string;
  collectorName: string;
  sourceWasteListingId: string | null;
  materialName: string;
  category: WasteCategory;
  weightKg: number;
  pricePerKg: number;
  location: string;
  status: MaterialStatus;
  createdAt: string;
};

export type RouteStop = {
  id: string;
  title: string;
  district: string;
  distanceKm: number;
  estimatedCost: number;
  status: PickupStatus;
};

export type PickupRoute = {
  id: string;
  title: string;
  driverName: string;
  totalDistanceKm: number;
  estimatedDurationMinutes: number;
  estimatedCost: number;
  stops: RouteStop[];
};

export type OrderRecord = {
  id: string;
  buyerName: string;
  supplierName: string;
  materialName: string;
  status: OrderStatus;
  totalKg: number;
  totalPrice: number;
  createdAt: string;
};

export type NegotiationRecord = {
  id: string;
  orderId: string;
  buyerName: string;
  supplierName: string;
  offeredPricePerKg: number;
  counterPricePerKg: number | null;
  status: NegotiationStatus;
  createdAt: string;
};

export type TransactionRecord = {
  id: string;
  orderId: string;
  status: TransactionStatus;
  paidAt: string | null;
  channel: string;
};

export type ReviewRecord = {
  id: string;
  reviewerRole: UserRole;
  subjectName: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
  createdAt: string;
};

export type TraceabilityEvent = {
  id: string;
  materialId: string;
  step: "source" | "pickup" | "sorting" | "stock" | "order" | "transaction";
  title: string;
  detail: string;
  occurredAt: string;
};

export type ClassificationDemo = {
  predictedCategory: WasteCategory;
  confidence: number;
  manualOverride: WasteCategory | null;
  status: "ready" | "low-confidence" | "failed";
};

export type DeployReadinessItem = {
  id: string;
  label: string;
  status: DeployReadinessStatus;
  note: string;
};
