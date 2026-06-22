import { Module } from '@nestjs/common';
import { SupabaseModule } from '../../supabase/supabase.module';
import { DashboardModule } from '../dashboard/dashboard.module';
import { StorageModule } from '../storage/storage.module';
import { TraceabilityModule } from '../traceability/traceability.module';
import { ExcelGenerator } from './excel-generator';
import { PdfGenerator } from './pdf-generator';
import { ReportController } from './report.controller';
import { ReportDataService } from './report-data.service';
import { ReportService } from './report.service';

@Module({
  imports: [SupabaseModule, StorageModule, DashboardModule, TraceabilityModule],
  controllers: [ReportController],
  providers: [ReportService, ReportDataService, PdfGenerator, ExcelGenerator],
  exports: [ReportService],
})
export class ReportsModule {}
