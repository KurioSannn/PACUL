import {
  DEMO_LISTING_IDS,
  DEMO_LOCATIONS,
  type DemoUserKey,
} from './demo-seed.constants';
import {
  assertDemoSeedEnabled,
  createSeedSupabase,
  fetchCategoryIdMap,
  getDemoUser,
  insertIfNotExists,
} from './demo-seed.utils';

interface DemoListingSeed {
  id: string;
  householdKey: DemoUserKey;
  categoryCode: string;
  title: string;
  description: string;
  estimatedWeightKg: number;
  actualWeightKg?: number;
  status: string;
  address: string;
  latitude: number;
  longitude: number;
  district: string;
  city: string;
  province: string;
  pickupFee: number;
  claimedByKey?: DemoUserKey;
  claimedAt?: string;
  pickedUpAt?: string;
  sortedAt?: string;
}

const DEMO_LISTINGS: DemoListingSeed[] = [
  {
    id: DEMO_LISTING_IDS.petAvailable,
    householdKey: 'household1' as const,
    categoryCode: 'PLASTIC_PET',
    title: 'Botol PET bekas minuman',
    description: 'Sekitar 5 kg botol PET bersih, siap diambil.',
    estimatedWeightKg: 5,
    status: 'available',
    address: DEMO_LOCATIONS.surabayaHousehold.address,
    latitude: -7.2661,
    longitude: 112.746,
    district: DEMO_LOCATIONS.surabayaHousehold.district,
    city: DEMO_LOCATIONS.surabayaHousehold.city,
    province: DEMO_LOCATIONS.surabayaHousehold.province,
    pickupFee: 8000,
  },
  {
    id: DEMO_LISTING_IDS.plasticOtherClaimed,
    householdKey: 'household1' as const,
    categoryCode: 'PLASTIC_OTHER',
    title: 'Kemasan plastik campuran',
    description: 'Plastik HDPE dan kemasan sachet, estimasi 8 kg.',
    estimatedWeightKg: 8,
    status: 'claimed',
    address: DEMO_LOCATIONS.surabayaHousehold.address,
    latitude: -7.2648,
    longitude: 112.7445,
    district: DEMO_LOCATIONS.surabayaHousehold.district,
    city: DEMO_LOCATIONS.surabayaHousehold.city,
    province: DEMO_LOCATIONS.surabayaHousehold.province,
    pickupFee: 9000,
    claimedByKey: 'collector1' as const,
    claimedAt: '2026-06-18T08:30:00.000Z',
  },
  {
    id: DEMO_LISTING_IDS.paperAvailable,
    householdKey: 'household2' as const,
    categoryCode: 'PAPER',
    title: 'Kardus dan kertas bekas',
    description: 'Kardus flatten dan kertas kantor, sekitar 12 kg.',
    estimatedWeightKg: 12,
    status: 'available',
    address: DEMO_LOCATIONS.sidoarjoHousehold.address,
    latitude: -7.4485,
    longitude: 112.719,
    district: DEMO_LOCATIONS.sidoarjoHousehold.district,
    city: DEMO_LOCATIONS.sidoarjoHousehold.city,
    province: DEMO_LOCATIONS.sidoarjoHousehold.province,
    pickupFee: 10000,
  },
  {
    id: DEMO_LISTING_IDS.metalSorted,
    householdKey: 'household2' as const,
    categoryCode: 'METAL_CAN',
    title: 'Kaleng aluminium bekas',
    description: 'Kaleng minuman aluminium, sudah dicuci.',
    estimatedWeightKg: 15,
    actualWeightKg: 14.5,
    status: 'sorted',
    address: DEMO_LOCATIONS.sidoarjoHousehold.address,
    latitude: -7.4472,
    longitude: 112.7175,
    district: DEMO_LOCATIONS.sidoarjoHousehold.district,
    city: DEMO_LOCATIONS.sidoarjoHousehold.city,
    province: DEMO_LOCATIONS.sidoarjoHousehold.province,
    pickupFee: 12000,
    claimedByKey: 'collector1' as const,
    claimedAt: '2026-06-15T06:00:00.000Z',
    pickedUpAt: '2026-06-15T09:15:00.000Z',
    sortedAt: '2026-06-15T14:00:00.000Z',
  },
  {
    id: DEMO_LISTING_IDS.petSorted,
    householdKey: 'household1' as const,
    categoryCode: 'PLASTIC_PET',
    title: 'Botol PET volume besar',
    description: 'Kumpulan botol PET dari warung, estimasi 12 kg.',
    estimatedWeightKg: 12,
    actualWeightKg: 11.8,
    status: 'sorted',
    address: DEMO_LOCATIONS.surabayaHousehold.address,
    latitude: -7.265,
    longitude: 112.7438,
    district: DEMO_LOCATIONS.surabayaHousehold.district,
    city: DEMO_LOCATIONS.surabayaHousehold.city,
    province: DEMO_LOCATIONS.surabayaHousehold.province,
    pickupFee: 11000,
    claimedByKey: 'collector1' as const,
    claimedAt: '2026-06-15T05:30:00.000Z',
    pickedUpAt: '2026-06-15T08:45:00.000Z',
    sortedAt: '2026-06-15T13:30:00.000Z',
  },
  {
    id: DEMO_LISTING_IDS.textileAvailable,
    householdKey: 'household2' as const,
    categoryCode: 'TEXTILE',
    title: 'Kain dan pakaian bekas',
    description: 'Kain perca dan pakaian layak daur ulang, 6 kg.',
    estimatedWeightKg: 6,
    status: 'available',
    address: DEMO_LOCATIONS.sidoarjoHousehold.address,
    latitude: -7.4491,
    longitude: 112.7168,
    district: DEMO_LOCATIONS.sidoarjoHousehold.district,
    city: DEMO_LOCATIONS.sidoarjoHousehold.city,
    province: DEMO_LOCATIONS.sidoarjoHousehold.province,
    pickupFee: 7000,
  },
];

export async function seedWasteListings(): Promise<void> {
  assertDemoSeedEnabled();

  const supabase = createSeedSupabase();
  const categoryMap = await fetchCategoryIdMap(supabase);
  let inserted = 0;

  for (const listing of DEMO_LISTINGS) {
    const categoryId = categoryMap.get(listing.categoryCode);

    if (!categoryId) {
      throw new Error(`Missing waste category code: ${listing.categoryCode}`);
    }

    const household = getDemoUser(listing.householdKey);
    const claimedBy = listing.claimedByKey
      ? getDemoUser(listing.claimedByKey).id
      : null;

    const result = await insertIfNotExists(
      supabase,
      'waste_listings',
      { id: listing.id },
      {
        id: listing.id,
        household_id: household.id,
        category_id: categoryId,
        classification_id: null,
        title: listing.title,
        description: listing.description,
        estimated_weight_kg: listing.estimatedWeightKg,
        actual_weight_kg: listing.actualWeightKg ?? null,
        status: listing.status,
        address: listing.address,
        latitude: listing.latitude,
        longitude: listing.longitude,
        district: listing.district,
        city: listing.city,
        province: listing.province,
        available_from: '2026-06-10T00:00:00.000Z',
        available_until: '2026-07-10T23:59:59.000Z',
        notes: null,
        pickup_fee: listing.pickupFee,
        claimed_by: claimedBy,
        claimed_at: listing.claimedAt ?? null,
        picked_up_at: listing.pickedUpAt ?? null,
        sorted_at: listing.sortedAt ?? null,
        cancelled_at: null,
        cancel_reason: null,
      },
    );

    if (result === 'inserted') {
      inserted += 1;
    }
  }

  console.log(`Waste listings ready (inserted ${inserted} new rows).`);
}
