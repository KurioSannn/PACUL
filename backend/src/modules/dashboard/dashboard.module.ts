import { Module } from '@nestjs/common';
import { SupabaseModule } from '../../supabase/supabase.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { GeoImpactService } from './geo-impact.service';

@Module({
  imports: [SupabaseModule],
  controllers: [DashboardController],
  providers: [DashboardService, GeoImpactService],
  exports: [DashboardService, GeoImpactService],
})
export class DashboardModule {}
