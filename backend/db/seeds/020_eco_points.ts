import {
  DEMO_BATCH_IDS,
  DEMO_LISTING_IDS,
  DEMO_ROUTE_ID,
  DEMO_TRANSACTION_ID,
} from './demo-seed.constants';
import {
  assertDemoSeedEnabled,
  createSeedSupabase,
  getDemoUser,
  insertIfNotExists,
} from './demo-seed.utils';

const DEMO_POINT_ENTRIES = [
  {
    id: 'db000001-0001-4000-8000-000000000001',
    userKey: 'household1' as const,
    points: 100,
    event_type: 'first_time_bonus',
    entity_type: 'user',
    entityKey: 'self' as const,
    description: 'Bonus poin pertama di PACUL',
    created_at: '2026-06-12T10:05:00.000Z',
  },
  {
    id: 'db000002-0001-4000-8000-000000000002',
    userKey: 'household1' as const,
    points: 10,
    event_type: 'listing_published',
    entity_type: 'waste_listing',
    entityId: DEMO_LISTING_IDS.petAvailable,
    description: 'Listing sampah dipublikasikan',
    created_at: '2026-06-12T10:10:00.000Z',
  },
  {
    id: 'db000003-0001-4000-8000-000000000003',
    userKey: 'collector1' as const,
    points: 100,
    event_type: 'first_time_bonus',
    entity_type: 'user',
    entityKey: 'self' as const,
    description: 'Bonus poin pertama di PACUL',
    created_at: '2026-06-15T08:05:00.000Z',
  },
  {
    id: 'db000004-0001-4000-8000-000000000004',
    userKey: 'collector1' as const,
    points: 25,
    event_type: 'pickup_completed',
    entity_type: 'pickup_route',
    entityId: DEMO_ROUTE_ID,
    description: 'Rute pickup selesai',
    created_at: '2026-06-15T12:00:00.000Z',
  },
  {
    id: 'db000005-0001-4000-8000-000000000005',
    userKey: 'collector1' as const,
    points: 15,
    event_type: 'material_batch_created',
    entity_type: 'material_batch',
    entityId: DEMO_BATCH_IDS.metalSold,
    description: 'Batch material dibuat',
    created_at: '2026-06-16T09:00:00.000Z',
  },
  {
    id: 'db000006-0001-4000-8000-000000000006',
    userKey: 'industry1' as const,
    points: 100,
    event_type: 'first_time_bonus',
    entity_type: 'user',
    entityKey: 'self' as const,
    description: 'Bonus poin pertama di PACUL',
    created_at: '2026-06-18T10:00:00.000Z',
  },
  {
    id: 'db000007-0001-4000-8000-000000000007',
    userKey: 'industry1' as const,
    points: 50,
    event_type: 'transaction_completed',
    entity_type: 'transaction',
    entityId: DEMO_TRANSACTION_ID,
    description: 'Transaksi material selesai',
    created_at: '2026-06-18T15:00:00.000Z',
  },
] as const;

export async function seedEcoPoints(): Promise<void> {
  assertDemoSeedEnabled();

  const supabase = createSeedSupabase();
  let inserted = 0;

  for (const entry of DEMO_POINT_ENTRIES) {
    const user = getDemoUser(entry.userKey);
    const entityId =
      'entityKey' in entry && entry.entityKey === 'self'
        ? user.id
        : (entry as { entityId: string }).entityId;

    const result = await insertIfNotExists(
      supabase,
      'point_ledger',
      { id: entry.id },
      {
        id: entry.id,
        user_id: user.id,
        points: entry.points,
        event_type: entry.event_type,
        entity_type: entry.entity_type,
        entity_id: entityId,
        description: entry.description,
        created_at: entry.created_at,
      },
    );

    if (result === 'inserted') {
      inserted += 1;
    }
  }

  console.log(`EcoPoints ledger ready (inserted ${inserted} new rows).`);
}
