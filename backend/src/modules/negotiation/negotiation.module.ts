import { Module } from '@nestjs/common';
import { SupabaseModule } from '../../supabase/supabase.module';
import { NegotiationController } from './negotiation.controller';
import { NegotiationService } from './negotiation.service';
import { OrderNegotiationController } from './order-negotiation.controller';

@Module({
  imports: [SupabaseModule],
  controllers: [NegotiationController, OrderNegotiationController],
  providers: [NegotiationService],
  exports: [NegotiationService],
})
export class NegotiationModule {}
