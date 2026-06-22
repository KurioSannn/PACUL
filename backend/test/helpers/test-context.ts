import { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables } from '../../src/common/config/env.validation';
import { ListingService } from '../../src/modules/waste-listings/listing.service';
import { StatusTransitionService } from '../../src/modules/waste-listings/status-transition.service';
import { MaterialBatchService } from '../../src/modules/materials/material-batch.service';
import { PickupClaimService } from '../../src/modules/pickup/pickup-claim.service';
import { OrderService } from '../../src/modules/orders/order.service';
import { NegotiationService } from '../../src/modules/negotiation/negotiation.service';
import { TraceabilityService } from '../../src/modules/traceability/traceability.service';
import { PointsService } from '../../src/modules/eco-points/points.service';
import { AuditService } from '../../src/modules/notifications/audit.service';
import { NotificationService } from '../../src/modules/notifications/notification.service';
import {
  COLLECTOR_ID,
  DEFAULT_CATEGORY,
  GLASS_CATEGORY,
  HOUSEHOLD_ID,
  INDUSTRY_ID,
} from './fixtures';
import {
  createEmptyStore,
  createSupabaseMock,
  seedCollectorCategories,
  SupabaseMockStore,
} from './supabase-mock';

export interface TestServiceContext {
  store: SupabaseMockStore;
  supabase: ReturnType<typeof createSupabaseMock>;
  traceability: TraceabilityService;
  statusTransition: StatusTransitionService;
  listing: ListingService;
  pickup: PickupClaimService;
  material: MaterialBatchService;
  order: OrderService;
  negotiation: NegotiationService;
  auditLog: jest.Mock;
  notification: jest.Mock;
}

export function createTestContext(): TestServiceContext {
  const store = createEmptyStore();
  store.waste_categories.push(DEFAULT_CATEGORY, GLASS_CATEGORY);
  store.user_profiles.push(
    { id: COLLECTOR_ID, display_name: 'Collector One' },
    { id: HOUSEHOLD_ID, display_name: 'Household One' },
    { id: INDUSTRY_ID, display_name: 'Industry One' },
  );
  store.collector_profiles.push({
    id: COLLECTOR_ID,
    business_name: 'Eco Collect',
    base_latitude: -6.2,
    base_longitude: 106.8,
  });
  seedCollectorCategories(store, COLLECTOR_ID, [DEFAULT_CATEGORY.id]);

  const supabase = createSupabaseMock(store);
  const traceability = new TraceabilityService(supabase);
  const statusTransition = new StatusTransitionService(supabase);
  const auditLog = jest.fn();
  const notification = jest.fn();
  const points = {
    awardPoints: jest.fn().mockResolvedValue(undefined),
    getUserPoints: jest.fn(),
    getPointsSummary: jest.fn(),
  } as unknown as PointsService;

  const configService = {
    get: jest.fn((key: string) => {
      if (key === 'SUPABASE_STORAGE_BUCKET_WASTE_IMAGES') {
        return 'waste-images';
      }
      return undefined;
    }),
  } as unknown as ConfigService<EnvironmentVariables, true>;

  const listing = new ListingService(
    supabase,
    configService,
    traceability,
    statusTransition,
    points,
  );

  const pickup = new PickupClaimService(
    supabase,
    statusTransition,
    traceability,
    { createNotification: notification } as unknown as NotificationService,
    { logAction: auditLog } as unknown as AuditService,
  );

  const material = new MaterialBatchService(
    supabase,
    statusTransition,
    traceability,
    points,
  );

  const order = new OrderService(supabase, material, traceability);

  const negotiation = new NegotiationService(
    supabase,
    traceability,
    { logAction: auditLog } as unknown as AuditService,
    { createNotification: notification } as unknown as NotificationService,
  );

  return {
    store,
    supabase,
    traceability,
    statusTransition,
    listing,
    pickup,
    material,
    order,
    negotiation,
    auditLog,
    notification,
  };
}

export function buildDraftListingPayload() {
  return {
    category_id: DEFAULT_CATEGORY.id,
    title: 'Botol PET bekas',
    estimated_weight_kg: 5,
    address: 'Jl. Contoh 1',
    latitude: -6.21,
    longitude: 106.81,
    city: 'Jakarta',
    province: 'DKI',
    imagePaths: [`waste-images/${HOUSEHOLD_ID}/temp/photo.jpg`],
  };
}

export async function flushTraceability(): Promise<void> {
  await new Promise<void>((resolve) => setImmediate(resolve));
}
