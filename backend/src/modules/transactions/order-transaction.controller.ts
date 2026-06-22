import { Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthUser } from '../../common/types/auth-user';
import { TransactionService } from './transaction.service';

@Controller('orders')
export class OrderTransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post(':id/transactions/simulate')
  @Roles('industry')
  simulateTransaction(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) orderId: string,
  ) {
    return this.transactionService.simulateTransaction(orderId, user.id);
  }
}
