import {
  assertDemoSeedEnabled,
  createSeedSupabase,
  ensureAuthUser,
  getDemoPassword,
} from './demo-seed.utils';
import { DEMO_USERS } from './demo-seed.constants';

export async function seedDemoUsers(): Promise<void> {
  assertDemoSeedEnabled();

  const supabase = createSeedSupabase();
  const password = getDemoPassword();

  console.log('Seeding demo users (auth + profiles)...');

  for (const user of Object.values(DEMO_USERS)) {
    await ensureAuthUser(supabase, user, password);
  }

  console.log(`Demo users ready (${Object.keys(DEMO_USERS).length} accounts).`);
}
