import { Module } from '@nestjs/common';
import { SupabaseModule } from '../../supabase/supabase.module';
import { ListingService } from './listing.service';
import { StatusTransitionService } from './status-transition.service';
import { WasteListingsController } from './waste-listings.controller';

@Module({
  imports: [SupabaseModule],
  controllers: [WasteListingsController],
  providers: [ListingService, StatusTransitionService],
  exports: [ListingService, StatusTransitionService],
})
export class WasteListingsModule {}
