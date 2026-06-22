import { Injectable, Logger } from '@nestjs/common';

export interface AiClassificationOverriddenPayload {
  classificationId: string;
  userId: string;
  originalCategoryId: string | null;
  overrideCategoryId: string;
  reason: string | null;
}

@Injectable()
export class TraceabilityEmitterStub {
  private readonly logger = new Logger('TraceabilityEmitterStub');

  emitAiClassificationOverridden(
    payload: AiClassificationOverriddenPayload,
  ): void {
    this.logger.log(
      JSON.stringify({
        event: 'ai_classification_overridden',
        ...payload,
      }),
    );
  }
}
