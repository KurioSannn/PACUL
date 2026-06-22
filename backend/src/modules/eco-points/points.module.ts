import { Global, Module } from '@nestjs/common';
import { SupabaseModule } from '../../supabase/supabase.module';
import { PointsController } from './points.controller';
import { PointsService } from './points.service';

@Global()
@Module({
  imports: [SupabaseModule],
  controllers: [PointsController],
  providers: [PointsService],
  exports: [PointsService],
})
export class EcoPointsModule {}
