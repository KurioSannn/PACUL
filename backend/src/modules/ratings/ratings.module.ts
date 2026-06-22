import { Module } from '@nestjs/common';
import { SupabaseModule } from '../../supabase/supabase.module';
import { TraceabilityModule } from '../traceability/traceability.module';
import { RatingController } from './rating.controller';
import { RatingService } from './rating.service';

@Module({
  imports: [SupabaseModule, TraceabilityModule],
  controllers: [RatingController],
  providers: [RatingService],
  exports: [RatingService],
})
export class RatingsModule {}
