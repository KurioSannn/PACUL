import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables } from '../../common/config/env.validation';
import { SupabaseService } from '../../supabase/supabase.service';
import { CategoryMapperService } from './category-mapper';
import { ClassificationService } from './classification.service';
import type { WasteClassifier } from './classifier.interface';
import { InferenceLogger } from './inference-logger';
import { TraceabilityService } from '../traceability/traceability.service';

describe('ClassificationService', () => {
  let service: ClassificationService;
  let classifier: jest.Mocked<WasteClassifier>;
  let categoryMapper: jest.Mocked<CategoryMapperService>;
  let downloadMock: jest.Mock;
  let insertMock: jest.Mock;
  let selectMock: jest.Mock;
  let singleMock: jest.Mock;

  const userId = '11111111-1111-1111-1111-111111111111';
  const imagePath = `waste-images/${userId}/temp/123_photo.jpg`;

  beforeEach(() => {
    classifier = {
      classify: jest.fn(),
      getModelVersion: jest.fn().mockReturnValue('mock-1.0.0'),
      isReady: jest.fn().mockReturnValue(true),
    };

    categoryMapper = {
      mapAIClassToDBCategory: jest.fn(),
      getTopKCategories: jest.fn(),
      isBelowThreshold: jest.fn(),
    } as unknown as jest.Mocked<CategoryMapperService>;

    singleMock = jest.fn();
    insertMock = jest.fn(() => ({
      select: jest.fn(() => ({
        single: singleMock,
      })),
    }));
    selectMock = jest.fn(() => ({
      eq: jest.fn(() => ({
        maybeSingle: jest.fn(),
      })),
    }));
    downloadMock = jest.fn();

    const supabaseService = {
      getAdminClient: jest.fn(() => ({
        storage: {
          from: jest.fn(() => ({
            download: downloadMock,
          })),
        },
        from: jest.fn((table: string) => {
          if (table === 'ai_classifications') {
            return {
              insert: insertMock,
              select: selectMock,
            };
          }

          return { select: selectMock };
        }),
      })),
    } as unknown as SupabaseService;

    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'SUPABASE_STORAGE_BUCKET_WASTE_IMAGES') {
          return 'waste-images';
        }

        return undefined;
      }),
    } as unknown as ConfigService<EnvironmentVariables, true>;

    service = new ClassificationService(
      classifier,
      categoryMapper,
      new InferenceLogger(),
      { emitEvent: jest.fn() } as unknown as TraceabilityService,
      supabaseService,
      configService,
    );
  });

  it('classifies, persists, and flags low confidence', async () => {
    const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
    downloadMock.mockResolvedValue({
      data: {
        arrayBuffer: () =>
          Promise.resolve(
            jpegBuffer.buffer.slice(
              jpegBuffer.byteOffset,
              jpegBuffer.byteOffset + jpegBuffer.byteLength,
            ),
          ),
      },
      error: null,
    });

    classifier.classify.mockResolvedValue({
      top_class: 'plastic_pet',
      confidence: 0.42,
      top_k: [{ class: 'plastic_pet', confidence: 0.42, label: 'Botol PET' }],
      inference_time_ms: 250,
      model_version: 'mock-1.0.0',
      is_mock: true,
    });

    categoryMapper.mapAIClassToDBCategory.mockResolvedValue({
      id: 'cat-1',
      code: 'PLASTIC_PET',
      name: 'Botol PET',
      description: null,
      icon_key: 'plastic-pet',
      unit: 'kg',
      typical_price_per_kg: 2500,
      ai_model_class: 'plastic_pet',
      sort_order: 1,
    });
    categoryMapper.getTopKCategories.mockResolvedValue([
      {
        class: 'plastic_pet',
        confidence: 0.42,
        label: 'Botol PET',
        category: {
          id: 'cat-1',
          code: 'PLASTIC_PET',
          name: 'Botol PET',
          description: null,
          icon_key: 'plastic-pet',
          unit: 'kg',
          typical_price_per_kg: 2500,
          ai_model_class: 'plastic_pet',
          sort_order: 1,
        },
      },
    ]);
    categoryMapper.isBelowThreshold.mockReturnValue(true);

    singleMock.mockResolvedValue({
      data: {
        id: 'cls-1',
        user_id: userId,
        image_path: imagePath,
        top_class: 'plastic_pet',
        confidence: 0.42,
        top_k_results: [],
        db_category_id: 'cat-1',
        is_mock: true,
        model_version: 'mock-1.0.0',
        inference_time_ms: 250,
        is_overridden: false,
        override_category_id: null,
        override_reason: null,
        overridden_at: null,
        overridden_by: null,
        created_at: '2026-06-22T00:00:00.000Z',
      },
      error: null,
    });

    const result = await service.classifyWasteImage(userId, imagePath);

    expect(result.id).toBe('cls-1');
    expect(result.lowConfidence).toBe(true);
    expect(result.suggestion).toBe('Gunakan override manual');
    expect(insertMock).toHaveBeenCalled();
  });

  it('throws AI_UNAVAILABLE when classifier fails', async () => {
    const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
    downloadMock.mockResolvedValue({
      data: {
        arrayBuffer: () =>
          Promise.resolve(
            jpegBuffer.buffer.slice(
              jpegBuffer.byteOffset,
              jpegBuffer.byteOffset + jpegBuffer.byteLength,
            ),
          ),
      },
      error: null,
    });
    classifier.classify.mockRejectedValue(new Error('model failed'));

    await expect(
      service.classifyWasteImage(userId, imagePath),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('enforces ownership on getClassification', async () => {
    const maybeSingleMock = jest.fn().mockResolvedValue({
      data: {
        id: 'cls-1',
        user_id: '22222222-2222-2222-2222-222222222222',
        image_path: imagePath,
        top_class: 'glass',
        confidence: 0.8,
        top_k_results: [],
        db_category_id: null,
        is_mock: true,
        model_version: 'mock-1.0.0',
        inference_time_ms: 200,
        is_overridden: false,
        override_category_id: null,
        override_reason: null,
        overridden_at: null,
        overridden_by: null,
        created_at: '2026-06-22T00:00:00.000Z',
      },
      error: null,
    });

    selectMock.mockReturnValue({
      eq: jest.fn(() => ({
        maybeSingle: maybeSingleMock,
      })),
    });

    await expect(
      service.getClassification('cls-1', userId),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
