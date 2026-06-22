import { Module } from '@nestjs/common';
import { SupabaseModule } from '../../supabase/supabase.module';
import { WasteListingsModule } from '../waste-listings/waste-listings.module';
import { MaterialBatchController } from './material-batch.controller';
import { MaterialBatchService } from './material-batch.service';
import { MaterialsMarketController } from './materials-market.controller';
import { MaterialsMarketplaceController } from './materials-marketplace.controller';

@Module({
  imports: [SupabaseModule, WasteListingsModule],
  controllers: [
    MaterialBatchController,
    MaterialsMarketController,
    MaterialsMarketplaceController,
  ],
  providers: [MaterialBatchService],
  exports: [MaterialBatchService],
})
export class MaterialsModule {}
