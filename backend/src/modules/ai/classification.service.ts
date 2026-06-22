import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables } from '../../common/config/env.validation';
import { SupabaseService } from '../../supabase/supabase.service';
import { detectImageMimeType } from '../storage/waste-image.validation';
import { assertWasteImageOwnership } from '../storage/waste-image.validation';
import type {
  AiClassification,
  ClassificationResponse,
} from './ai-classification.types';
import { WASTE_CLASSIFIER } from './ai.tokens';
import { CategoryMapperService } from './category-mapper';
import type { WasteClassifier } from './classifier.interface';
import { InferenceLogger } from './inference-logger';
import { TraceabilityService } from '../traceability/traceability.service';
import type { WasteCategory } from '../waste-categories/waste-categories.types';

interface WasteCategoryRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon_key: string | null;
  unit: string;
  typical_price_per_kg: number | string | null;
  ai_model_class: string | null;
  sort_order: number;
}

interface AiClassificationRow {
  id: string;
  user_id: string;
  image_path: string;
  top_class: string;
  confidence: number | string;
  top_k_results: AiClassification['top_k_results'];
  db_category_id: string | null;
  is_mock: boolean;
  model_version: string | null;
  inference_time_ms: number | null;
  is_overridden: boolean;
  override_category_id: string | null;
  override_reason: string | null;
  overridden_at: string | null;
  overridden_by: string | null;
  created_at: string;
}

@Injectable()
export class ClassificationService {
  constructor(
    @Inject(WASTE_CLASSIFIER) private readonly classifier: WasteClassifier,
    private readonly categoryMapper: CategoryMapperService,
    private readonly inferenceLogger: InferenceLogger,
    private readonly traceabilityService: TraceabilityService,
    private readonly supabaseService: SupabaseService,
    private readonly configService: ConfigService<EnvironmentVariables, true>,
  ) {}

  async classifyWasteImage(
    userId: string,
    imagePath: string,
  ): Promise<ClassificationResponse> {
    const bucketName = this.getWasteImagesBucket();
    assertWasteImageOwnership(imagePath, userId, bucketName);

    const imageBuffer = await this.downloadWasteImage(imagePath, bucketName);
    const mimeType = detectImageMimeType(imageBuffer) ?? 'image/jpeg';

    if (!this.classifier.isReady()) {
      throw new ServiceUnavailableException({
        error: 'AI classifier is not ready',
        code: 'AI_UNAVAILABLE',
      });
    }

    let classificationResult;

    try {
      classificationResult = await this.classifier.classify(
        imageBuffer,
        mimeType,
      );
    } catch (error) {
      this.inferenceLogger.logError(error, {
        userId,
        imagePath,
        mimeType,
        inputSizeBytes: imageBuffer.length,
      });
      throw new ServiceUnavailableException({
        error: 'AI classification is temporarily unavailable',
        code: 'AI_UNAVAILABLE',
      });
    }

    const category = await this.categoryMapper.mapAIClassToDBCategory(
      classificationResult.top_class,
    );
    const topKResults =
      await this.categoryMapper.getTopKCategories(classificationResult);
    const lowConfidence =
      this.categoryMapper.isBelowThreshold(classificationResult);

    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('ai_classifications')
      .insert({
        user_id: userId,
        image_path: imagePath,
        top_class: classificationResult.top_class,
        confidence: classificationResult.confidence,
        top_k_results: topKResults.map((entry) => ({
          class: entry.class,
          confidence: entry.confidence,
          label: entry.label,
          category_id: entry.category?.id ?? null,
        })),
        db_category_id: category?.id ?? null,
        is_mock: classificationResult.is_mock,
        model_version: classificationResult.model_version,
        inference_time_ms: classificationResult.inference_time_ms,
      })
      .select(
        'id, user_id, image_path, top_class, confidence, top_k_results, db_category_id, is_mock, model_version, inference_time_ms, is_overridden, override_category_id, override_reason, overridden_at, overridden_by, created_at',
      )
      .single<AiClassificationRow>();

    if (error || !data) {
      throw new InternalServerErrorException({
        error: 'Failed to persist AI classification result',
        code: 'CLASSIFICATION_PERSIST_FAILED',
        details: error?.message,
      });
    }

    const mappedRow = this.mapRow(data);

    this.inferenceLogger.logInference(classificationResult, {
      userId,
      imagePath,
      mimeType,
      classificationId: mappedRow.id,
      inputSizeBytes: imageBuffer.length,
    });

    this.traceabilityService.emitEvent({
      eventType: 'ai_classified',
      entityType: 'ai_classification',
      entityId: mappedRow.id,
      actorId: userId,
      actorRole: 'household',
      metadata: {
        imagePath,
        topClass: mappedRow.top_class,
        confidence: mappedRow.confidence,
        categoryId: mappedRow.db_category_id,
        isMock: mappedRow.is_mock,
        modelVersion: mappedRow.model_version,
        lowConfidence,
      },
    });

    return this.toResponse(mappedRow, category, lowConfidence);
  }

  async getClassification(
    id: string,
    userId: string,
  ): Promise<ClassificationResponse> {
    const row = await this.fetchClassificationRow(id);

    if (!row || row.user_id !== userId) {
      throw new NotFoundException({
        error: 'Classification not found',
        code: 'CLASSIFICATION_NOT_FOUND',
      });
    }

    const category = await this.resolveCategoryForRow(row);

    return this.toResponse(row, category, false);
  }

  async overrideClassification(
    id: string,
    userId: string,
    overrideCategoryId: string,
    reason?: string,
  ): Promise<ClassificationResponse> {
    const row = await this.fetchClassificationRow(id);

    if (!row || row.user_id !== userId) {
      throw new NotFoundException({
        error: 'Classification not found',
        code: 'CLASSIFICATION_NOT_FOUND',
      });
    }

    if (row.is_overridden) {
      throw new ConflictException({
        error: 'Classification has already been overridden',
        code: 'ALREADY_OVERRIDDEN',
      });
    }

    const overrideCategory = await this.fetchCategoryById(overrideCategoryId);

    if (!overrideCategory) {
      throw new NotFoundException({
        error: 'Waste category not found',
        code: 'CATEGORY_NOT_FOUND',
      });
    }

    const overriddenAt = new Date().toISOString();
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('ai_classifications')
      .update({
        is_overridden: true,
        override_category_id: overrideCategoryId,
        override_reason: reason ?? null,
        overridden_at: overriddenAt,
        overridden_by: userId,
      })
      .eq('id', id)
      .eq('user_id', userId)
      .eq('is_overridden', false)
      .select(
        'id, user_id, image_path, top_class, confidence, top_k_results, db_category_id, is_mock, model_version, inference_time_ms, is_overridden, override_category_id, override_reason, overridden_at, overridden_by, created_at',
      )
      .maybeSingle<AiClassificationRow>();

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to override classification',
        code: 'CLASSIFICATION_OVERRIDE_FAILED',
        details: error.message,
      });
    }

    if (!data) {
      throw new ConflictException({
        error: 'Classification has already been overridden',
        code: 'ALREADY_OVERRIDDEN',
      });
    }

    const updatedRow = this.mapRow(data);

    this.traceabilityService.emitEvent({
      eventType: 'ai_classification_overridden',
      entityType: 'ai_classification',
      entityId: updatedRow.id,
      actorId: userId,
      actorRole: 'household',
      metadata: {
        originalCategoryId: row.db_category_id,
        overrideCategoryId,
        reason: reason ?? null,
      },
    });

    return this.toResponse(updatedRow, overrideCategory, false);
  }

  async listUserClassifications(
    userId: string,
    limit = 20,
  ): Promise<ClassificationResponse[]> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('ai_classifications')
      .select(
        'id, user_id, image_path, top_class, confidence, top_k_results, db_category_id, is_mock, model_version, inference_time_ms, is_overridden, override_category_id, override_reason, overridden_at, overridden_by, created_at',
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to list classifications',
        code: 'CLASSIFICATION_LIST_FAILED',
        details: error.message,
      });
    }

    const rows = (data ?? []).map((entry) => this.mapRow(entry));

    return Promise.all(
      rows.map(async (row) => {
        const category = await this.resolveCategoryForRow(row);

        return this.toResponse(row, category, false);
      }),
    );
  }

  private async fetchClassificationRow(
    id: string,
  ): Promise<AiClassification | null> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('ai_classifications')
      .select(
        'id, user_id, image_path, top_class, confidence, top_k_results, db_category_id, is_mock, model_version, inference_time_ms, is_overridden, override_category_id, override_reason, overridden_at, overridden_by, created_at',
      )
      .eq('id', id)
      .maybeSingle<AiClassificationRow>();

    if (error || !data) {
      return null;
    }

    return this.mapRow(data);
  }

  private async downloadWasteImage(
    imagePath: string,
    bucketName: string,
  ): Promise<Buffer> {
    const objectPath = imagePath.startsWith(`${bucketName}/`)
      ? imagePath.slice(bucketName.length + 1)
      : imagePath;

    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin.storage
      .from(bucketName)
      .download(objectPath);

    if (error || !data) {
      throw new NotFoundException({
        error: 'Waste image not found in storage',
        code: 'IMAGE_NOT_FOUND',
      });
    }

    return Buffer.from(await data.arrayBuffer());
  }

  private async resolveCategoryForRow(
    row: AiClassification,
  ): Promise<WasteCategory | null> {
    if (row.is_overridden && row.override_category_id) {
      return this.fetchCategoryById(row.override_category_id);
    }

    if (row.db_category_id) {
      return this.categoryMapper.mapAIClassToDBCategory(row.top_class);
    }

    return null;
  }

  private async fetchCategoryById(
    categoryId: string,
  ): Promise<WasteCategory | null> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('waste_categories')
      .select(
        'id, code, name, description, icon_key, unit, typical_price_per_kg, ai_model_class, sort_order',
      )
      .eq('id', categoryId)
      .eq('is_active', true)
      .maybeSingle<WasteCategoryRow>();

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to load waste category',
        code: 'CATEGORY_LOAD_FAILED',
        details: error.message,
      });
    }

    if (!data) {
      return null;
    }

    return this.mapCategoryRow(data);
  }

  private mapCategoryRow(row: WasteCategoryRow): WasteCategory {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
      icon_key: row.icon_key,
      unit: row.unit,
      typical_price_per_kg:
        row.typical_price_per_kg === null
          ? null
          : Number(row.typical_price_per_kg),
      ai_model_class: row.ai_model_class,
      sort_order: row.sort_order,
    };
  }

  private getWasteImagesBucket(): string {
    return (
      this.configService.get('SUPABASE_STORAGE_BUCKET_WASTE_IMAGES', {
        infer: true,
      }) ?? 'waste-images'
    );
  }

  private mapRow(row: AiClassificationRow): AiClassification {
    return {
      id: row.id,
      user_id: row.user_id,
      image_path: row.image_path,
      top_class: row.top_class,
      confidence: Number(row.confidence),
      top_k_results: row.top_k_results,
      db_category_id: row.db_category_id,
      is_mock: row.is_mock,
      model_version: row.model_version,
      inference_time_ms: row.inference_time_ms,
      is_overridden: row.is_overridden,
      override_category_id: row.override_category_id,
      override_reason: row.override_reason,
      overridden_at: row.overridden_at,
      overridden_by: row.overridden_by,
      created_at: row.created_at,
    };
  }

  private toResponse(
    row: AiClassification,
    category: ClassificationResponse['category'],
    lowConfidence: boolean,
  ): ClassificationResponse {
    const response: ClassificationResponse = {
      id: row.id,
      image_path: row.image_path,
      top_class: row.top_class,
      confidence: row.confidence,
      top_k_results: row.top_k_results,
      category,
      is_mock: row.is_mock,
      model_version: row.model_version,
      inference_time_ms: row.inference_time_ms,
      is_overridden: row.is_overridden,
      created_at: row.created_at,
    };

    if (row.is_overridden) {
      response.override_category_id = row.override_category_id;
      response.override_reason = row.override_reason;
      response.overridden_at = row.overridden_at;
      response.overridden_by = row.overridden_by;
    }

    if (lowConfidence) {
      response.lowConfidence = true;
      response.suggestion = 'Gunakan override manual';
    }

    return response;
  }
}
