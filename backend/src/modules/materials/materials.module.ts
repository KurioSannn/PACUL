import { Module } from '@nestjs/common';
import { SupabaseModule } from '../../supabase/supabase.module';
import { WasteListingsModule } from '../waste-listings/waste-listings.module';
import { MaterialBatchController } from './material-batch.controller';
import { MaterialBatchService } from './material-batch.service';
import { MaterialsMarketplaceController } from './materials-marketplace.controller';

@Module({
  imports: [SupabaseModule, WasteListingsModule],
  controllers: [MaterialBatchController, MaterialsMarketplaceController],
  providers: [MaterialBatchService],
  exports: [MaterialBatchService],
})
export class MaterialsModule {}
