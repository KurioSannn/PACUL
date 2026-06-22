import { Module } from '@nestjs/common';
import { SupabaseModule } from '../../supabase/supabase.module';
import { ChannelAuthService } from './channel-auth';
import { NegotiationChannelAccess } from './negotiation-channel';
import { RealtimeController } from './realtime.controller';

@Module({
  imports: [SupabaseModule],
  controllers: [RealtimeController],
  providers: [ChannelAuthService, NegotiationChannelAccess],
  exports: [ChannelAuthService, NegotiationChannelAccess],
})
export class RealtimeModule {}
