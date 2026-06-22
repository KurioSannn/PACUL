import { Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthUser } from '../../common/types/auth-user';
import { TransactionService } from './transaction.service';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get()
  @Roles('industry', 'collector')
  listTransactions(@CurrentUser() user: AuthUser) {
    return this.transactionService.listTransactions(user.id, user.role);
  }

  @Post(':id/complete')
  @Roles('industry', 'collector')
  completeTransaction(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.transactionService.completeTransaction(id, user.id);
  }
}
