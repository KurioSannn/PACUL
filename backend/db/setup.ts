import { setupStorage } from './seeds/000_setup_storage';

/**
 * Idempotent backend setup: storage buckets only.
 * Safe to re-run; existing buckets are skipped.
 */
export async function runSetup(): Promise<void> {
  await setupStorage();
  console.log('setup complete');
}

if (require.main === module) {
  runSetup()
    .then(() => {
      process.exit(0);
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Setup failed:', message);
      process.exit(1);
    });
}
