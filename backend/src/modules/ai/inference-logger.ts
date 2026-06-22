import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import type { ClassificationResult } from './classifier.interface';
import { ModelVersionService } from './model-version.service';

export interface InferenceLogContext {
  userId?: string;
  imagePath?: string;
  mimeType?: string;
  modelVersion?: string;
  isMock?: boolean;
  classificationId?: string;
  inputSizeBytes?: number;
}

@Injectable()
export class InferenceLogger {
  private readonly logger = new Logger('InferenceLogger');

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly modelVersionService: ModelVersionService,
  ) {}

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

    this.persistInferenceLog({
      classification_id: context.classificationId ?? null,
      user_id: context.userId ?? null,
      image_path: context.imagePath ?? null,
      input_size_bytes: context.inputSizeBytes ?? null,
      inference_time_ms: result.inference_time_ms,
      top_class: result.top_class,
      confidence: result.confidence,
      error_message: null,
      is_error: false,
    });
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

    this.persistInferenceLog({
      classification_id: context.classificationId ?? null,
      user_id: context.userId ?? null,
      image_path: context.imagePath ?? null,
      input_size_bytes: context.inputSizeBytes ?? null,
      inference_time_ms: null,
      top_class: null,
      confidence: null,
      error_message: message,
      is_error: true,
    });
  }

  private persistInferenceLog(payload: {
    classification_id: string | null;
    user_id: string | null;
    image_path: string | null;
    input_size_bytes: number | null;
    inference_time_ms: number | null;
    top_class: string | null;
    confidence: number | null;
    error_message: string | null;
    is_error: boolean;
  }): void {
    void this.writeInferenceLog(payload).catch((persistError: unknown) => {
      const message =
        persistError instanceof Error
          ? persistError.message
          : String(persistError);
      this.logger.warn(`Failed to persist inference log: ${message}`);
    });
  }

  private async writeInferenceLog(payload: {
    classification_id: string | null;
    user_id: string | null;
    image_path: string | null;
    input_size_bytes: number | null;
    inference_time_ms: number | null;
    top_class: string | null;
    confidence: number | null;
    error_message: string | null;
    is_error: boolean;
  }): Promise<void> {
    const modelVersionId =
      await this.modelVersionService.getActiveModelVersionId();

    const admin = this.supabaseService.getAdminClient();
    const { error } = await admin.from('inference_logs').insert({
      ...payload,
      model_version_id: modelVersionId,
    });

    if (error) {
      throw new Error(error.message);
    }
  }
}
