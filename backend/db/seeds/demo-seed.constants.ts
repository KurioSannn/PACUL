export type DemoUserKey =
  | 'household1'
  | 'household2'
  | 'collector1'
  | 'collector2'
  | 'industry1'
  | 'industry2';

export type DemoUserRole = 'household' | 'collector' | 'industry';

export const DEMO_PASSWORD_ENV_VAR = 'DEMO_PASSWORD';

/**
 * Hackathon-only fallback when DEMO_PASSWORD is unset.
 * Override via DEMO_PASSWORD in .env for local demo runs.
 */
export const DEMO_PASSWORD_FALLBACK = 'PaculDemo2025!';

export interface DemoUserDefinition {
  key: DemoUserKey;
  id: string;
  email: string;
  role: DemoUserRole;
  displayName: string;
  phone: string;
}

export const DEMO_USERS: Record<DemoUserKey, DemoUserDefinition> = {
  household1: {
    key: 'household1',
    id: 'd1000001-0001-4000-8000-000000000001',
    email: 'household1@pacul-demo.com',
    role: 'household',
    displayName: 'Siti Rahayu',
    phone: '+6281234567001',
  },
  household2: {
    key: 'household2',
    id: 'd1000002-0001-4000-8000-000000000002',
    email: 'household2@pacul-demo.com',
    role: 'household',
    displayName: 'Budi Santoso',
    phone: '+6281234567002',
  },
  collector1: {
    key: 'collector1',
    id: 'd1000003-0001-4000-8000-000000000003',
    email: 'collector1@pacul-demo.com',
    role: 'collector',
    displayName: 'Agus Picker',
    phone: '+6281234567003',
  },
  collector2: {
    key: 'collector2',
    id: 'd1000004-0001-4000-8000-000000000004',
    email: 'collector2@pacul-demo.com',
    role: 'collector',
    displayName: 'Dewi Kolektor',
    phone: '+6281234567004',
  },
  industry1: {
    key: 'industry1',
    id: 'd1000005-0001-4000-8000-000000000005',
    email: 'industry1@pacul-demo.com',
    role: 'industry',
    displayName: 'PT Daur Plastik Jaya',
    phone: '+6281234567005',
  },
  industry2: {
    key: 'industry2',
    id: 'd1000006-0001-4000-8000-000000000006',
    email: 'industry2@pacul-demo.com',
    role: 'industry',
    displayName: 'CV Recycle Nusantara',
    phone: '+6281234567006',
  },
};

export const DEMO_LISTING_IDS = {
  petAvailable: 'd2000001-0001-4000-8000-000000000001',
  plasticOtherClaimed: 'd2000002-0001-4000-8000-000000000002',
  paperAvailable: 'd2000003-0001-4000-8000-000000000003',
  metalSorted: 'd2000004-0001-4000-8000-000000000004',
  petSorted: 'd2000005-0001-4000-8000-000000000005',
  textileAvailable: 'd2000006-0001-4000-8000-000000000006',
} as const;

export const DEMO_CLASSIFICATION_IDS = {
  household1Pet: 'd3000001-0001-4000-8000-000000000001',
  household1Plastic: 'd3000002-0001-4000-8000-000000000002',
  household2Paper: 'd3000003-0001-4000-8000-000000000003',
} as const;

export const DEMO_PICKUP_CLAIM_IDS = {
  plasticOther: 'd4000001-0001-4000-8000-000000000001',
  metal: 'd4000002-0001-4000-8000-000000000002',
  pet: 'd4000003-0001-4000-8000-000000000003',
} as const;

export const DEMO_ROUTE_ID = 'd5000001-0001-4000-8000-000000000001';
export const DEMO_ROUTE_STOP_IDS = {
  metal: 'd5000002-0001-4000-8000-000000000002',
  pet: 'd5000003-0001-4000-8000-000000000003',
} as const;

export const DEMO_BATCH_IDS = {
  petAvailable: 'd6000001-0001-4000-8000-000000000001',
  metalSold: 'd6000002-0001-4000-8000-000000000002',
} as const;

export const DEMO_ORDER_IDS = {
  metalCompleted: 'd7000001-0001-4000-8000-000000000001',
  petNegotiating: 'd7000002-0001-4000-8000-000000000002',
} as const;

export const DEMO_NEGOTIATION_THREAD_IDS = {
  metalCompleted: 'd8000001-0001-4000-8000-000000000001',
  petNegotiating: 'd8000002-0001-4000-8000-000000000002',
} as const;

export const DEMO_TRANSACTION_ID = 'd9000001-0001-4000-8000-000000000001';

export const DEMO_RATING_IDS = {
  householdPickup: 'da000001-0001-4000-8000-000000000001',
  industryTransaction: 'da000002-0001-4000-8000-000000000002',
} as const;

export const DEMO_SEED_MARKER = 'pacul_demo_seed_v1';

/** Surabaya, Sidoarjo, and Gresik area coordinates for realistic demo data. */
export const DEMO_LOCATIONS = {
  surabayaHousehold: {
    address: 'Jl. Raya Darmo No. 45, Surabaya',
    latitude: -7.2654,
    longitude: 112.7453,
    district: 'Wonokromo',
    city: 'Surabaya',
    province: 'Jawa Timur',
  },
  sidoarjoHousehold: {
    address: 'Jl. Pahlawan No. 12, Sidoarjo',
    latitude: -7.4478,
    longitude: 112.7183,
    district: 'Candi',
    city: 'Sidoarjo',
    province: 'Jawa Timur',
  },
  surabayaCollector: {
    businessName: 'Jasa Angkut Sampah Surabaya',
    serviceArea: 'Surabaya Selatan dan Timur',
    latitude: -7.2501,
    longitude: 112.7402,
  },
  gresikCollector: {
    businessName: 'Kolektor Kertas Gresik',
    serviceArea: 'Gresik dan sekitarnya',
    latitude: -7.1554,
    longitude: 112.654,
  },
  surabayaIndustry: {
    companyName: 'PT Daur Plastik Jaya',
    industryType: 'plastic_recycling',
    address: 'Kawasan Industri Rungkut, Surabaya',
    latitude: -7.263,
    longitude: 112.748,
  },
  sidoarjoIndustry: {
    companyName: 'CV Recycle Nusantara',
    industryType: 'mixed_recycling',
    address: 'Jl. Industri No. 8, Sidoarjo',
    latitude: -7.44,
    longitude: 112.71,
  },
} as const;
