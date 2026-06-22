import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  const required = {
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_ANON_KEY: 'anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
    SUPABASE_JWT_SECRET: 'jwt-secret',
  };

  it('passes when required Supabase vars are set', () => {
    const result = validateEnv(required);
    expect(result.SUPABASE_URL).toBe(required.SUPABASE_URL);
    expect(result.PORT).toBe(4000);
    expect(result.AI_USE_MOCK_CLASSIFIER).toBe(true);
  });

  it('throws a clear error when required vars are missing', () => {
    expect(() => validateEnv({})).toThrow(
      /Environment validation failed[\s\S]*SUPABASE_URL is required/,
    );
  });
});
