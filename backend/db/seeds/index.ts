import { config } from 'dotenv';
import { resolve } from 'node:path';
import { setupStorage } from './000_setup_storage';
import { seedWasteCategories } from './002_waste_categories';
import { seedDemoUsers } from './010_demo_users';
import { seedCollectorCategories } from './011_collector_categories';
import { seedWasteListings } from './012_waste_listings';
import { seedAiClassifications } from './013_ai_classifications';
import { seedPickupRoutes } from './014_pickup_routes';
import { seedMaterialBatches } from './015_material_batches';
import { seedOrdersNegotiation } from './016_orders_negotiation';
import { seedRatings } from './017_ratings';
import { seedTraceability } from './018_traceability';

config({ path: resolve(process.cwd(), '.env') });

type SeedRunner = {
  name: string;
  run: () => Promise<void>;
};

const seeds: SeedRunner[] = [
  {
    name: '000_setup_storage',
    run: setupStorage,
  },
  {
    name: '002_waste_categories',
    run: seedWasteCategories,
  },
  {
    name: '010_demo_users',
    run: seedDemoUsers,
  },
  {
    name: '011_collector_categories',
    run: seedCollectorCategories,
  },
  {
    name: '012_waste_listings',
    run: seedWasteListings,
  },
  {
    name: '013_ai_classifications',
    run: seedAiClassifications,
  },
  {
    name: '014_pickup_routes',
    run: seedPickupRoutes,
  },
  {
    name: '015_material_batches',
    run: seedMaterialBatches,
  },
  {
    name: '016_orders_negotiation',
    run: seedOrdersNegotiation,
  },
  {
    name: '017_ratings',
    run: seedRatings,
  },
  {
    name: '018_traceability',
    run: seedTraceability,
  },
];

async function runSeeds(): Promise<void> {
  for (const seed of seeds) {
    console.log(`Running seed: ${seed.name}`);
    await seed.run();
  }
}

runSeeds()
  .then(() => {
    console.log('All seeds completed successfully.');
    process.exit(0);
  })
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Seed run failed:', message);
    process.exit(1);
  });
