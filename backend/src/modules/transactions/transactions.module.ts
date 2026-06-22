import { Module } from '@nestjs/common';
import { SupabaseModule } from '../../supabase/supabase.module';
import { OrderTransactionController } from './order-transaction.controller';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';

@Module({
  imports: [SupabaseModule],
  controllers: [TransactionController, OrderTransactionController],
  providers: [TransactionService],
  exports: [TransactionService],
})
export class TransactionsModule {}
