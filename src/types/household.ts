import type { WasteCategory, WasteListingStatus, UserRole } from "./pacul";

export type HouseholdProfile = {
  id: string;
  name: string;
  role: UserRole;
  phone: string;
  email: string;
  address: string;
  district: string;
  city: string;
  addressNote: string;
  latitude: number;
  longitude: number;
  preferredCategories: WasteCategory[];
  preferredPickupDay: string;
  notificationsEnabled: boolean;
  stats: {
    totalMaterialSubmitted: number;
    totalListingsCreated: number;
    pickupsCompleted: number;
    estimatedIncomeTotal: number;
  };
  createdAt: string;
};

export type NotificationType =
  | "pickup_scheduled"
  | "pickup_started"
  | "pickup_status"
  | "transaction_completed"
  | "chat_new"
  | "report_ready"
  | "review_requested";

export type NotificationSeverity = "info" | "success" | "warning";

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  severity: NotificationSeverity;
  read: boolean;
  createdAt: string;
  relatedRoute: string | null;
};

export type ChatMessageType = "text" | "system" | "pickup_update";

export type ChatMessage = {
  id: string;
  threadId: string;
  senderRole: "household" | "carrier";
  senderName: string;
  type: ChatMessageType;
  content: string;
  createdAt: string;
};

export type ChatThread = {
  id: string;
  carrierId: string;
  carrierName: string;
  materialTitle: string;
  listingId: string;
  pickupStatus: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  messages: ChatMessage[];
};

export type PickupTrackingStatus =
  | "waiting_confirmation"
  | "carrier_en_route"
  | "arrived_at_household"
  | "material_picked_up"
  | "in_transit"
  | "delivered"
  | "completed";

export type PickupTimelineItem = {
  status: PickupTrackingStatus;
  label: string;
  detail: string;
  occurredAt: string | null;
};

export type PickupTracking = {
  pickupId: string;
  listingId: string;
  listingTitle: string;
  householdId: string;
  carrierId: string;
  carrierName: string;
  carrierVehicle: string;
  carrierRating: number;
  currentStatus: PickupTrackingStatus;
  lastUpdated: string;
  etaMinutes: number;
  currentLocation: { lat: number; lng: number };
  destinationLocation: { lat: number; lng: number };
  timeline: PickupTimelineItem[];
};

export type PickupConfirmation = {
  listingId: string;
  listingTitle: string;
  category: WasteCategory;
  weightKg: number;
  address: string;
  district: string;
  contactPhone: string;
  addressNote: string;
  scheduledDate: string;
  scheduledTimeSlot: string;
  carrierId: string;
  carrierName: string;
  carrierArea: string;
  carrierRating: number;
  estimatedDistanceKm: number;
  estimatedArrivalMinutes: number;
  pricePerKg: number;
  estimatedTotal: number;
  pickupFee: number;
  estimatedNetIncome: number;
};
