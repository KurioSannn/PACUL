import { Injectable, Logger } from '@nestjs/common';

export interface WasteUploadedPayload {
  listingId: string;
  householdId: string;
  categoryId: string;
  estimatedWeightKg: number;
  imageCount: number;
}

@Injectable()
export class WasteListingsTraceabilityEmitterStub {
  private readonly logger = new Logger('WasteListingsTraceabilityEmitterStub');

  emitWasteUploaded(payload: WasteUploadedPayload): void {
    this.logger.log(
      JSON.stringify({
        event: 'waste_uploaded',
        ...payload,
      }),
    );
  }
}
