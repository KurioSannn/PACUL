import { Module } from '@nestjs/common';
import { SupabaseModule } from '../../supabase/supabase.module';
import { WasteListingsModule } from '../waste-listings/waste-listings.module';
import { PickupClaimController } from './pickup-claim.controller';
import { PickupClaimService } from './pickup-claim.service';

@Module({
  imports: [SupabaseModule, WasteListingsModule],
  controllers: [PickupClaimController],
  providers: [PickupClaimService],
  exports: [PickupClaimService],
})
export class PickupModule {}
