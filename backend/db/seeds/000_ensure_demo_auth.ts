/**
 * Creates Supabase Auth demo users only (no DB tables required).
 * Run: npm run db:seed-auth
 */
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import {
  assertDemoSeedEnabled,
  getDemoPassword,
  requireEnv,
} from './demo-seed.utils';
import { DEMO_USERS } from './demo-seed.constants';

config({ path: resolve(process.cwd(), '.env') });

async function ensureDemoAuthUsers(): Promise<void> {
  assertDemoSeedEnabled();

  const supabase = createClient(
    requireEnv('SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const password = getDemoPassword();

  console.log('Ensuring demo auth users...');

  for (const user of Object.values(DEMO_USERS)) {
    const { data: existing } = await supabase.auth.admin.getUserById(user.id);

    if (!existing.user) {
      const { error } = await supabase.auth.admin.createUser({
        id: user.id,
        email: user.email,
        password,
        email_confirm: true,
        user_metadata: { role: user.role, demo: true },
      });
      if (error) {
        throw new Error(`Failed to create ${user.email}: ${error.message}`);
      }
      console.log(`  Created: ${user.email}`);
    } else {
      const { error } = await supabase.auth.admin.updateUserById(user.id, {
        password,
      });
      if (error) {
        throw new Error(`Failed to reset password for ${user.email}: ${error.message}`);
      }
      console.log(`  Ready: ${user.email}`);
    }
  }

  console.log(`Demo auth users ready. Password: ${password}`);
}

ensureDemoAuthUsers()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error('db:seed-auth failed:', message);
    process.exit(1);
  });
