import { Module } from '@nestjs/common';
import { WasteListingsModule } from '../waste-listings/waste-listings.module';
import { DashboardModule } from '../dashboard/dashboard.module';
import { CollectorController } from './collector.controller';
import { CollectorService } from './collector.service';

@Module({
  imports: [WasteListingsModule, DashboardModule],
  controllers: [CollectorController],
  providers: [CollectorService],
  exports: [CollectorService],
})
export class CollectorModule {}
