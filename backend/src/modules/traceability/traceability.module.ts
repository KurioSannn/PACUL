import { Global, Module } from '@nestjs/common';
import { SupabaseModule } from '../../supabase/supabase.module';
import { TraceabilityController } from './traceability.controller';
import { TraceabilityService } from './traceability.service';

@Global()
@Module({
  imports: [SupabaseModule],
  controllers: [TraceabilityController],
  providers: [TraceabilityService],
  exports: [TraceabilityService],
})
export class TraceabilityModule {}
