import { Injectable, Logger } from '@nestjs/common';

export interface TransactionCompletedPayload {
  transactionId: string;
  orderId: string;
  industryId: string;
  collectorId: string;
  batchId: string;
  amount: number;
  actorId: string;
}

@Injectable()
export class TransactionTraceabilityEmitterStub {
  private readonly logger = new Logger('TransactionTraceabilityEmitterStub');

  emitTransactionCompleted(payload: TransactionCompletedPayload): void {
    this.logger.log(
      JSON.stringify({
        event: 'transaction_completed',
        ...payload,
      }),
    );
  }
}
