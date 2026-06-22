import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { createClient } from '@supabase/supabase-js';
import { EnvironmentVariables } from '../common/config/env.validation';
import { SupabaseService } from './supabase.service';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

describe('SupabaseService', () => {
  let service: SupabaseService;
  let mockGetUser: jest.Mock;
  const mockCreateClient = createClient as jest.Mock;

  const config: Partial<EnvironmentVariables> = {
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_ANON_KEY: 'anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
    SUPABASE_JWT_SECRET: 'jwt-secret',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockGetUser = jest.fn();
    mockCreateClient.mockReturnValue({ auth: { getUser: mockGetUser } });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupabaseService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: keyof EnvironmentVariables) => config[key]),
          },
        },
      ],
    }).compile();

    service = module.get(SupabaseService);
  });

  it('creates admin client with service role key', () => {
    const client = service.getAdminClient();

    expect(mockCreateClient).toHaveBeenCalledWith(
      config.SUPABASE_URL,
      config.SUPABASE_SERVICE_ROLE_KEY,
      expect.objectContaining({
        auth: { persistSession: false, autoRefreshToken: false },
      }),
    );
    expect(client).toBeDefined();
    expect(service.getAdminClient()).toBe(client);
  });

  it('creates per-token client with anon key and bearer header', () => {
    service.getClientForToken('user-jwt');

    expect(mockCreateClient).toHaveBeenCalledWith(
      config.SUPABASE_URL,
      config.SUPABASE_ANON_KEY,
      expect.objectContaining({
        global: { headers: { Authorization: 'Bearer user-jwt' } },
      }),
    );
  });

  it('returns null from getUserFromToken when token is invalid', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'invalid' },
    });

    await expect(service.getUserFromToken('bad-token')).resolves.toBeNull();
    expect(mockGetUser).toHaveBeenCalledWith('bad-token');
  });

  it('returns user from getUserFromToken when token is valid', async () => {
    const user = { id: 'user-1', email: 'a@b.com' };
    mockGetUser.mockResolvedValue({
      data: { user },
      error: null,
    });

    await expect(service.getUserFromToken('good-token')).resolves.toEqual(user);
  });
});
