import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  DEMO_LOCATIONS,
  DEMO_PASSWORD_ENV_VAR,
  DEMO_PASSWORD_FALLBACK,
  DEMO_SEED_MARKER,
  DEMO_USERS,
  type DemoUserDefinition,
  type DemoUserKey,
} from './demo-seed.constants';

export function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function assertDemoSeedEnabled(): void {
  const enabled = process.env.DEMO_SEED_ENABLED;

  if (enabled === 'false' || enabled === '0') {
    throw new Error(
      'Demo seed is disabled. Set DEMO_SEED_ENABLED=true to run demo seeds.',
    );
  }
}

export function getDemoPassword(): string {
  return process.env[DEMO_PASSWORD_ENV_VAR] ?? DEMO_PASSWORD_FALLBACK;
}

export function createSeedSupabase(): SupabaseClient {
  return createClient(
    requireEnv('SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}

export function getDemoUser(key: DemoUserKey): DemoUserDefinition {
  return DEMO_USERS[key];
}

export async function rowExists(
  supabase: SupabaseClient,
  table: string,
  match: Record<string, unknown>,
): Promise<boolean> {
  let query = supabase.from(table).select('id').limit(1);

  for (const [column, value] of Object.entries(match)) {
    query = query.eq(column, value);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(`Failed to check ${table}: ${error.message}`);
  }

  return data !== null;
}

export async function insertIfNotExists(
  supabase: SupabaseClient,
  table: string,
  match: Record<string, unknown>,
  row: Record<string, unknown>,
): Promise<'inserted' | 'skipped'> {
  const exists = await rowExists(supabase, table, match);

  if (exists) {
    return 'skipped';
  }

  const { error } = await supabase.from(table).insert(row);

  if (error) {
    throw new Error(`Failed to insert into ${table}: ${error.message}`);
  }

  return 'inserted';
}

export async function fetchCategoryIdMap(
  supabase: SupabaseClient,
): Promise<Map<string, string>> {
  const { data, error } = await supabase
    .from('waste_categories')
    .select('id, code');

  if (error) {
    throw new Error(`Failed to load waste categories: ${error.message}`);
  }

  const map = new Map<string, string>();

  for (const row of data ?? []) {
    map.set(row.code as string, row.id as string);
  }

  return map;
}

export async function ensureAuthUser(
  supabase: SupabaseClient,
  user: DemoUserDefinition,
  password: string,
): Promise<void> {
  const { data: existingById, error: getError } =
    await supabase.auth.admin.getUserById(user.id);

  if (getError && !getError.message.toLowerCase().includes('not found')) {
    throw new Error(
      `Failed to look up demo user ${user.email}: ${getError.message}`,
    );
  }

  if (!existingById.user) {
    const { error: createError } = await supabase.auth.admin.createUser({
      id: user.id,
      email: user.email,
      password,
      email_confirm: true,
      user_metadata: {
        role: user.role,
        demo: true,
        seed_marker: DEMO_SEED_MARKER,
      },
    });

    if (createError) {
      throw new Error(
        `Failed to create demo user ${user.email}: ${createError.message}`,
      );
    }

    console.log(`  Created auth user: ${user.email}`);
  } else {
    console.log(`  Auth user already exists: ${user.email}`);
  }

  const profileResult = await insertIfNotExists(
    supabase,
    'user_profiles',
    { id: user.id },
    {
      id: user.id,
      role: user.role,
      display_name: user.displayName,
      phone: user.phone,
      avatar_url: null,
      is_active: true,
    },
  );

  if (profileResult === 'inserted') {
    console.log(`  Created user profile: ${user.email}`);
  }

  await ensureRoleProfile(supabase, user);
}

async function ensureRoleProfile(
  supabase: SupabaseClient,
  user: DemoUserDefinition,
): Promise<void> {
  switch (user.key) {
    case 'household1':
      await insertIfNotExists(
        supabase,
        'household_profiles',
        { id: user.id },
        {
          id: user.id,
          address: DEMO_LOCATIONS.surabayaHousehold.address,
          latitude: DEMO_LOCATIONS.surabayaHousehold.latitude,
          longitude: DEMO_LOCATIONS.surabayaHousehold.longitude,
          district: DEMO_LOCATIONS.surabayaHousehold.district,
          city: DEMO_LOCATIONS.surabayaHousehold.city,
          province: DEMO_LOCATIONS.surabayaHousehold.province,
          total_waste_kg: 32,
          total_listings: 3,
        },
      );
      return;
    case 'household2':
      await insertIfNotExists(
        supabase,
        'household_profiles',
        { id: user.id },
        {
          id: user.id,
          address: DEMO_LOCATIONS.sidoarjoHousehold.address,
          latitude: DEMO_LOCATIONS.sidoarjoHousehold.latitude,
          longitude: DEMO_LOCATIONS.sidoarjoHousehold.longitude,
          district: DEMO_LOCATIONS.sidoarjoHousehold.district,
          city: DEMO_LOCATIONS.sidoarjoHousehold.city,
          province: DEMO_LOCATIONS.sidoarjoHousehold.province,
          total_waste_kg: 33,
          total_listings: 3,
        },
      );
      return;
    case 'collector1':
      await insertIfNotExists(
        supabase,
        'collector_profiles',
        { id: user.id },
        {
          id: user.id,
          business_name: DEMO_LOCATIONS.surabayaCollector.businessName,
          service_area_description: DEMO_LOCATIONS.surabayaCollector.serviceArea,
          base_latitude: DEMO_LOCATIONS.surabayaCollector.latitude,
          base_longitude: DEMO_LOCATIONS.surabayaCollector.longitude,
          vehicle_capacity_kg: 500,
          rating_average: 4.5,
          rating_count: 2,
          total_pickups: 18,
          total_kg_collected: 420,
        },
      );
      return;
    case 'collector2':
      await insertIfNotExists(
        supabase,
        'collector_profiles',
        { id: user.id },
        {
          id: user.id,
          business_name: DEMO_LOCATIONS.gresikCollector.businessName,
          service_area_description: DEMO_LOCATIONS.gresikCollector.serviceArea,
          base_latitude: DEMO_LOCATIONS.gresikCollector.latitude,
          base_longitude: DEMO_LOCATIONS.gresikCollector.longitude,
          vehicle_capacity_kg: 350,
          rating_average: 0,
          rating_count: 0,
          total_pickups: 0,
          total_kg_collected: 0,
        },
      );
      return;
    case 'industry1':
      await insertIfNotExists(
        supabase,
        'industry_profiles',
        { id: user.id },
        {
          id: user.id,
          company_name: DEMO_LOCATIONS.surabayaIndustry.companyName,
          industry_type: DEMO_LOCATIONS.surabayaIndustry.industryType,
          address: DEMO_LOCATIONS.surabayaIndustry.address,
          latitude: DEMO_LOCATIONS.surabayaIndustry.latitude,
          longitude: DEMO_LOCATIONS.surabayaIndustry.longitude,
          rating_average: 0,
          rating_count: 0,
          total_orders: 1,
        },
      );
      return;
    case 'industry2':
      await insertIfNotExists(
        supabase,
        'industry_profiles',
        { id: user.id },
        {
          id: user.id,
          company_name: DEMO_LOCATIONS.sidoarjoIndustry.companyName,
          industry_type: DEMO_LOCATIONS.sidoarjoIndustry.industryType,
          address: DEMO_LOCATIONS.sidoarjoIndustry.address,
          latitude: DEMO_LOCATIONS.sidoarjoIndustry.latitude,
          longitude: DEMO_LOCATIONS.sidoarjoIndustry.longitude,
          rating_average: 0,
          rating_count: 0,
          total_orders: 0,
        },
      );
      return;
    default: {
      const exhaustiveCheck: never = user.key;
      throw new Error(`Unhandled demo user key: ${String(exhaustiveCheck)}`);
    }
  }
}

export interface TraceEventSeed {
  id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  actor_id: string | null;
  actor_role: string | null;
  previous_status?: string | null;
  new_status?: string | null;
  metadata?: Record<string, unknown>;
  linked_entity_type?: string | null;
  linked_entity_id?: string | null;
  created_at: string;
}

export async function seedTraceEventsIfMissing(
  supabase: SupabaseClient,
  events: TraceEventSeed[],
): Promise<number> {
  let inserted = 0;

  for (const event of events) {
    const result = await insertIfNotExists(
      supabase,
      'traceability_events',
      { id: event.id },
      {
        ...event,
        metadata: {
          seed_marker: DEMO_SEED_MARKER,
          ...(event.metadata ?? {}),
        },
      },
    );

    if (result === 'inserted') {
      inserted += 1;
    }
  }

  return inserted;
}
