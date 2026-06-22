import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

const NEGOTIATION_CHANNEL_PREFIX = 'negotiation:';
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface ThreadPartyRow {
  industry_id: string;
  collector_id: string;
}

export interface ChannelAuthResult {
  authorized: boolean;
  token?: string;
}

export interface RealtimePresencePayload {
  userId: string;
  role: string;
  displayName: string;
  online_at: string;
}

export function getChannelName(threadId: string): string {
  return `${NEGOTIATION_CHANNEL_PREFIX}${threadId}`;
}

export function parseNegotiationThreadId(channelName: string): string | null {
  if (!channelName.startsWith(NEGOTIATION_CHANNEL_PREFIX)) {
    return null;
  }

  const threadId = channelName.slice(NEGOTIATION_CHANNEL_PREFIX.length).trim();

  if (!UUID_PATTERN.test(threadId)) {
    return null;
  }

  return threadId;
}

@Injectable()
export class ChannelAuthService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async authorizeChannelAccess(
    channelName: string,
    userId: string,
  ): Promise<boolean> {
    const threadId = parseNegotiationThreadId(channelName);

    if (!threadId) {
      return false;
    }

    return this.isNegotiationParty(threadId, userId);
  }

  async getChannelJwt(
    userId: string,
    channelName: string,
    accessToken: string,
  ): Promise<string | null> {
    const authorized = await this.authorizeChannelAccess(channelName, userId);

    if (!authorized || !accessToken.trim()) {
      return null;
    }

    return accessToken.trim();
  }

  async authorizeChannel(
    channelName: string,
    userId: string,
    accessToken: string,
  ): Promise<ChannelAuthResult> {
    const authorized = await this.authorizeChannelAccess(channelName, userId);

    if (!authorized) {
      return { authorized: false };
    }

    const token = await this.getChannelJwt(userId, channelName, accessToken);

    if (!token) {
      return { authorized: false };
    }

    return { authorized: true, token };
  }

  buildPresencePayload(
    userId: string,
    role: string,
    displayName: string,
  ): RealtimePresencePayload {
    return {
      userId,
      role,
      displayName,
      online_at: new Date().toISOString(),
    };
  }

  private async isNegotiationParty(
    threadId: string,
    userId: string,
  ): Promise<boolean> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('negotiation_threads')
      .select('industry_id, collector_id')
      .eq('id', threadId)
      .maybeSingle<ThreadPartyRow>();

    if (error || !data) {
      return false;
    }

    return data.industry_id === userId || data.collector_id === userId;
  }
}
