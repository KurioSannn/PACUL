import {
  assertDemoSeedEnabled,
  createSeedSupabase,
  insertIfNotExists,
} from './demo-seed.utils';

const MOCK_MODEL_VERSION = {
  id: '00000000-0000-0000-0000-0000000000a1',
  version_string: 'mock-1.0.0',
  model_type: 'mock',
  description: 'Default mock waste classifier used for demo and fallback.',
  taxonomy_version: '1.0',
  is_active: true,
  deployed_at: '2026-06-01T00:00:00.000Z',
  deprecated_at: null,
  metadata: { source: 'seed', note: 'Deterministic mock classifier' },
} as const;

export async function seedAiModelVersions(): Promise<void> {
  assertDemoSeedEnabled();

  const supabase = createSeedSupabase();

  const result = await insertIfNotExists(
    supabase,
    'ai_model_versions',
    { version_string: MOCK_MODEL_VERSION.version_string },
    { ...MOCK_MODEL_VERSION },
  );

  console.log(
    `AI model versions ready (${result === 'inserted' ? 'inserted' : 'skipped'} mock-1.0.0).`,
  );
}
