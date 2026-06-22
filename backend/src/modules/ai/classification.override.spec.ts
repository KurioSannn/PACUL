import { ConflictException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables } from '../../common/config/env.validation';
import { SupabaseService } from '../../supabase/supabase.service';
import { CategoryMapperService } from './category-mapper';
import { ClassificationService } from './classification.service';
import type { WasteClassifier } from './classifier.interface';
import { InferenceLogger } from './inference-logger';
import { ModelVersionService } from './model-version.service';
import { TraceabilityService } from '../traceability/traceability.service';

describe('ClassificationService overrideClassification', () => {
  let service: ClassificationService;
  let categoryMapper: jest.Mocked<CategoryMapperService>;
  let emitEventMock: jest.Mock;
  let traceabilityService: TraceabilityService;
  let maybeSingleMock: jest.Mock;
  let updateMaybeSingleMock: jest.Mock;
  let wasteCategoriesMaybeSingleMock: jest.Mock;

  const userId = '11111111-1111-1111-1111-111111111111';
  const otherUserId = '22222222-2222-2222-2222-222222222222';
  const classificationId = '33333333-3333-3333-3333-333333333333';
  const overrideCategoryId = '44444444-4444-4444-4444-444444444444';
  const imagePath = `waste-images/${userId}/temp/123_photo.jpg`;

  const baseRow = {
    id: classificationId,
    user_id: userId,
    image_path: imagePath,
    top_class: 'plastic_pet',
    confidence: 0.42,
    top_k_results: [],
    db_category_id: 'cat-original',
    is_mock: true,
    model_version: 'mock-1.0.0',
    inference_time_ms: 250,
    is_overridden: false,
    override_category_id: null,
    override_reason: null,
    overridden_at: null,
    overridden_by: null,
    created_at: '2026-06-22T00:00:00.000Z',
  };

  const overrideCategory = {
    id: overrideCategoryId,
    code: 'GLASS',
    name: 'Kaca',
    description: null,
    icon_key: 'glass',
    unit: 'kg',
    typical_price_per_kg: 500,
    ai_model_class: 'glass',
    sort_order: 2,
  };

  beforeEach(() => {
    categoryMapper = {
      mapAIClassToDBCategory: jest.fn(),
      getTopKCategories: jest.fn(),
      isBelowThreshold: jest.fn(),
    } as unknown as jest.Mocked<CategoryMapperService>;

    maybeSingleMock = jest.fn();
    updateMaybeSingleMock = jest.fn();
    wasteCategoriesMaybeSingleMock = jest.fn();

    const supabaseService = {
      getAdminClient: jest.fn(() => ({
        from: jest.fn((table: string) => {
          if (table === 'ai_classifications') {
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => ({
                  maybeSingle: maybeSingleMock,
                })),
              })),
              update: jest.fn(() => ({
                eq: jest.fn(() => ({
                  eq: jest.fn(() => ({
                    eq: jest.fn(() => ({
                      select: jest.fn(() => ({
                        maybeSingle: updateMaybeSingleMock,
                      })),
                    })),
                  })),
                })),
              })),
            };
          }

          if (table === 'waste_categories') {
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => ({
                  eq: jest.fn(() => ({
                    maybeSingle: wasteCategoriesMaybeSingleMock,
                  })),
                })),
              })),
            };
          }

          if (table === 'classification_overrides') {
            return {
              insert: jest.fn(() => Promise.resolve({ error: null })),
            };
          }

          return { select: jest.fn() };
        }),
      })),
    } as unknown as SupabaseService;

    const configService = {
      get: jest.fn(),
    } as unknown as ConfigService<EnvironmentVariables, true>;

    emitEventMock = jest.fn();
    traceabilityService = {
      emitEvent: emitEventMock,
    } as unknown as TraceabilityService;

    const classifier = {
      classify: jest.fn(),
      getModelVersion: jest.fn(),
      isReady: jest.fn(),
    } as unknown as WasteClassifier;

    const modelVersionService = {
      getActiveModelVersionId: jest.fn().mockResolvedValue(null),
    } as unknown as ModelVersionService;

    service = new ClassificationService(
      classifier,
      categoryMapper,
      new InferenceLogger(supabaseService, modelVersionService),
      traceabilityService,
      supabaseService,
      configService,
    );
  });

  it('overrides classification successfully', async () => {
    maybeSingleMock.mockResolvedValue({ data: baseRow, error: null });
    wasteCategoriesMaybeSingleMock.mockResolvedValue({
      data: {
        id: overrideCategory.id,
        code: overrideCategory.code,
        name: overrideCategory.name,
        description: overrideCategory.description,
        icon_key: overrideCategory.icon_key,
        unit: overrideCategory.unit,
        typical_price_per_kg: overrideCategory.typical_price_per_kg,
        ai_model_class: overrideCategory.ai_model_class,
        sort_order: overrideCategory.sort_order,
      },
      error: null,
    });
    updateMaybeSingleMock.mockResolvedValue({
      data: {
        ...baseRow,
        is_overridden: true,
        override_category_id: overrideCategoryId,
        override_reason: 'Bukan PET, ini kaca',
        overridden_at: '2026-06-22T01:00:00.000Z',
        overridden_by: userId,
      },
      error: null,
    });

    const result = await service.overrideClassification(
      classificationId,
      userId,
      overrideCategoryId,
      'Bukan PET, ini kaca',
    );

    expect(result.is_overridden).toBe(true);
    expect(result.category).toEqual(overrideCategory);
    expect(result.override_category_id).toBe(overrideCategoryId);
    expect(result.override_reason).toBe('Bukan PET, ini kaca');
    expect(emitEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'ai_classification_overridden',
        entityType: 'ai_classification',
        entityId: classificationId,
        actorId: userId,
        metadata: {
          originalCategoryId: 'cat-original',
          overrideCategoryId,
          reason: 'Bukan PET, ini kaca',
        },
      }),
    );
  });

  it('rejects double override with ALREADY_OVERRIDDEN', async () => {
    maybeSingleMock.mockResolvedValue({
      data: {
        ...baseRow,
        is_overridden: true,
        override_category_id: overrideCategoryId,
      },
      error: null,
    });

    await expect(
      service.overrideClassification(
        classificationId,
        userId,
        overrideCategoryId,
      ),
    ).rejects.toMatchObject({
      response: { code: 'ALREADY_OVERRIDDEN' },
    });
    await expect(
      service.overrideClassification(
        classificationId,
        userId,
        overrideCategoryId,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects cross-user override', async () => {
    maybeSingleMock.mockResolvedValue({
      data: {
        ...baseRow,
        user_id: otherUserId,
      },
      error: null,
    });

    await expect(
      service.overrideClassification(
        classificationId,
        userId,
        overrideCategoryId,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
