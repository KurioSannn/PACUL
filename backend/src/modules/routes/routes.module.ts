import { Module } from '@nestjs/common';
import { SupabaseModule } from '../../supabase/supabase.module';
import { WasteListingsModule } from '../waste-listings/waste-listings.module';
import { CostEstimationService } from './cost-estimation.service';
import { RouteService } from './route.service';
import { RoutesController } from './routes.controller';

@Module({
  imports: [SupabaseModule, WasteListingsModule],
  controllers: [RoutesController],
  providers: [RouteService, CostEstimationService],
  exports: [RouteService, CostEstimationService],
})
export class RoutesModule {}
