import type { MaterialBatchStatus } from '../../modules/materials/materials.types';
import type { OrderStatus } from '../../modules/orders/orders.types';
import type { WasteListingStatus } from '../../modules/waste-listings/waste-listings.types';

export const WASTE_LISTING_STATUS_TRANSITIONS: Record<
  WasteListingStatus,
  readonly WasteListingStatus[]
> = {
  draft: ['available', 'cancelled'],
  available: ['claimed', 'cancelled'],
  claimed: ['pickup_planned', 'picked_up', 'cancelled'],
  pickup_planned: ['picked_up', 'cancelled'],
  picked_up: ['sorting'],
  sorting: ['sorted'],
  sorted: ['converted_to_material'],
  cancelled: [],
  converted_to_material: [],
};

export const MATERIAL_BATCH_STATUS_TRANSITIONS: Record<
  MaterialBatchStatus,
  readonly MaterialBatchStatus[]
> = {
  draft: ['available', 'unavailable'],
  available: ['ordered', 'negotiating', 'unavailable'],
  ordered: ['negotiating', 'sold', 'available'],
  negotiating: ['sold', 'available'],
  sold: [],
  unavailable: ['available'],
};

export const WASTE_LISTING_TERMINAL_STATUSES: readonly WasteListingStatus[] = [
  'cancelled',
  'converted_to_material',
];

export const MATERIAL_BATCH_TERMINAL_STATUSES: readonly MaterialBatchStatus[] =
  ['sold'];

export const ORDER_STATUS_TRANSITIONS: Record<
  OrderStatus,
  readonly OrderStatus[]
> = {
  created: ['negotiating', 'accepted', 'rejected', 'cancelled'],
  negotiating: ['accepted', 'rejected', 'cancelled'],
  accepted: ['completed', 'cancelled'],
  rejected: [],
  cancelled: [],
  completed: [],
};

export const ORDER_TERMINAL_STATUSES: readonly OrderStatus[] = [
  'rejected',
  'cancelled',
  'completed',
];

export function validateStatusTransition(
  from: WasteListingStatus,
  to: WasteListingStatus,
): boolean {
  if (from === to) {
    return false;
  }

  return WASTE_LISTING_STATUS_TRANSITIONS[from].includes(to);
}

export function validateMaterialBatchStatusTransition(
  from: MaterialBatchStatus,
  to: MaterialBatchStatus,
): boolean {
  if (from === to) {
    return false;
  }

  return MATERIAL_BATCH_STATUS_TRANSITIONS[from].includes(to);
}

export function validateOrderStatusTransition(
  from: OrderStatus,
  to: OrderStatus,
): boolean {
  if (from === to) {
    return false;
  }

  return ORDER_STATUS_TRANSITIONS[from].includes(to);
}
