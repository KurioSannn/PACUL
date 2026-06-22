import { Injectable, Logger } from '@nestjs/common';

export interface NegotiationOfferSentPayload {
  threadId: string;
  orderId: string;
  senderId: string;
  messageType: 'offer' | 'counter_offer';
  pricePerKg: number;
  weightKg: number;
}

export interface DealAcceptedPayload {
  threadId: string;
  orderId: string;
  acceptorId: string;
  pricePerKg: number;
  weightKg: number;
  totalAmount: number;
}

@Injectable()
export class NegotiationTraceabilityEmitterStub {
  private readonly logger = new Logger('NegotiationTraceabilityEmitterStub');

  emitOfferSent(payload: NegotiationOfferSentPayload): void {
    this.logger.log(
      JSON.stringify({
        event: 'negotiation_offer_sent',
        ...payload,
      }),
    );
  }

  emitDealAccepted(payload: DealAcceptedPayload): void {
    this.logger.log(
      JSON.stringify({
        event: 'deal_accepted',
        ...payload,
      }),
    );
  }
}
