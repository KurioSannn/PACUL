import { Injectable, Logger } from '@nestjs/common';

export interface OrderCreatedPayload {
  orderId: string;
  industryId: string;
  collectorId: string;
  batchId: string;
  requestedWeightKg: number;
  offeredPricePerKg: number;
}

@Injectable()
export class OrdersTraceabilityEmitterStub {
  private readonly logger = new Logger('OrdersTraceabilityEmitterStub');

  emitOrderCreated(payload: OrderCreatedPayload): void {
    this.logger.log(
      JSON.stringify({
        event: 'order_created',
        ...payload,
      }),
    );
  }
}
