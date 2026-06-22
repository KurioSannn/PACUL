import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';
import { EnvironmentVariables } from '../common/config/env.validation';
import type {
  PaculSupabaseAdminClient,
  PaculSupabaseUserClient,
} from './supabase.types';

@Injectable()
export class SupabaseService {
  private adminClient: PaculSupabaseAdminClient | null = null;

  constructor(
    private readonly configService: ConfigService<EnvironmentVariables, true>,
  ) {}

  getAdminClient(): PaculSupabaseAdminClient {
    if (this.adminClient) {
      return this.adminClient;
    }

    const url = this.requireConfig('SUPABASE_URL');
    const serviceRoleKey = this.requireConfig('SUPABASE_SERVICE_ROLE_KEY');

    this.adminClient = createClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }) as PaculSupabaseAdminClient;

    return this.adminClient;
  }

  getClientForToken(accessToken: string): PaculSupabaseUserClient {
    const url = this.requireConfig('SUPABASE_URL');
    const anonKey = this.requireConfig('SUPABASE_ANON_KEY');

    if (!accessToken?.trim()) {
      throw new InternalServerErrorException(
        'Access token is required to create a user-scoped Supabase client',
      );
    }

    return createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    }) as PaculSupabaseUserClient;
  }

  async getUserFromToken(accessToken: string): Promise<User | null> {
    if (!accessToken?.trim()) {
      return null;
    }

    const client = this.getAdminClient();
    const { data, error } = await client.auth.getUser(accessToken);

    if (error || !data.user) {
      return null;
    }

    return data.user;
  }

  private requireConfig<K extends keyof EnvironmentVariables>(
    key: K,
  ): NonNullable<EnvironmentVariables[K]> {
    const value = this.configService.get(key, { infer: true });

    if (value === undefined || value === null || value === '') {
      throw new InternalServerErrorException(
        `Missing required configuration: ${String(key)}`,
      );
    }

    return value;
  }
}
