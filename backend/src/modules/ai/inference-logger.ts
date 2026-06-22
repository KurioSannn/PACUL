import { Injectable, Logger } from '@nestjs/common';
import type { ClassificationResult } from './classifier.interface';

export interface InferenceLogContext {
  userId?: string;
  imagePath?: string;
  mimeType?: string;
  modelVersion?: string;
  isMock?: boolean;
}

@Injectable()
export class InferenceLogger {
  private readonly logger = new Logger('InferenceLogger');

  logInference(
    result: ClassificationResult,
    context: InferenceLogContext = {},
  ): void {
    this.logger.log(
      JSON.stringify({
        event: 'ai.inference.success',
        top_class: result.top_class,
        confidence: result.confidence,
        inference_time_ms: result.inference_time_ms,
        model_version: result.model_version,
        is_mock: result.is_mock,
        top_k: result.top_k,
        ...context,
      }),
    );
  }

  logError(error: unknown, context: InferenceLogContext = {}): void {
    const message = error instanceof Error ? error.message : String(error);

    this.logger.error(
      JSON.stringify({
        event: 'ai.inference.error',
        error: message,
        ...context,
      }),
    );
  }
}
