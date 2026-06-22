import { Module } from '@nestjs/common';
import { SupabaseModule } from '../../supabase/supabase.module';
import { MaterialsModule } from '../materials/materials.module';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';

@Module({
  imports: [SupabaseModule, MaterialsModule],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrdersModule {}
