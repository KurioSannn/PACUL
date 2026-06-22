import { InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { CategoryMapperService } from './category-mapper';
import type { ClassificationResult } from './classifier.interface';

describe('CategoryMapperService', () => {
  let mapper: CategoryMapperService;
  let fromMock: jest.Mock;
  let selectMock: jest.Mock;
  let eqMock: jest.Mock;
  let maybeSingleMock: jest.Mock;

  const plasticPetCategory = {
    id: 'cat-plastic-pet',
    code: 'PLASTIC_PET',
    name: 'Botol PET',
    description: 'Botol plastik PET seperti botol minuman.',
    icon_key: 'plastic-pet',
    unit: 'kg',
    typical_price_per_kg: 2500,
    ai_model_class: 'plastic_pet',
    sort_order: 1,
  };

  beforeEach(() => {
    maybeSingleMock = jest.fn();
    eqMock = jest.fn(() => ({ eq: eqMock, maybeSingle: maybeSingleMock }));
    selectMock = jest.fn(() => ({ eq: eqMock }));
    fromMock = jest.fn(() => ({ select: selectMock }));

    const supabaseService = {
      getAdminClient: jest.fn(() => ({
        from: fromMock,
      })),
    } as unknown as SupabaseService;

    mapper = new CategoryMapperService(supabaseService);
  });

  it('maps a known AI class to a DB category by code', async () => {
    maybeSingleMock.mockResolvedValue({
      data: plasticPetCategory,
      error: null,
    });

    const category = await mapper.mapAIClassToDBCategory('plastic_pet');

    expect(fromMock).toHaveBeenCalledWith('waste_categories');
    expect(eqMock).toHaveBeenCalledWith('code', 'PLASTIC_PET');
    expect(eqMock).toHaveBeenCalledWith('is_active', true);
    expect(category).toEqual(plasticPetCategory);
  });

  it('returns null for unknown AI class without querying DB', async () => {
    const category = await mapper.mapAIClassToDBCategory('unknown');

    expect(category).toBeNull();
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('returns null when DB category is missing', async () => {
    maybeSingleMock.mockResolvedValue({ data: null, error: null });

    const category = await mapper.mapAIClassToDBCategory('glass');

    expect(category).toBeNull();
  });

  it('maps top-k predictions to categories', async () => {
    maybeSingleMock
      .mockResolvedValueOnce({ data: plasticPetCategory, error: null })
      .mockResolvedValueOnce({ data: null, error: null });

    const result: ClassificationResult = {
      top_class: 'plastic_pet',
      confidence: 0.82,
      top_k: [
        { class: 'plastic_pet', confidence: 0.82, label: 'Botol PET' },
        { class: 'unknown', confidence: 0.18, label: 'Tidak dikenali' },
      ],
      inference_time_ms: 240,
      model_version: 'mock-1.0.0',
      is_mock: true,
    };

    const mapped = await mapper.getTopKCategories(result);

    expect(mapped).toHaveLength(2);
    expect(mapped[0]?.category).toEqual(plasticPetCategory);
    expect(mapped[1]?.category).toBeNull();
  });

  it('detects low-confidence results below taxonomy threshold', () => {
    const lowConfidence: ClassificationResult = {
      top_class: 'plastic_pet',
      confidence: 0.3,
      top_k: [],
      inference_time_ms: 100,
      model_version: 'mock-1.0.0',
      is_mock: true,
    };

    const highConfidence: ClassificationResult = {
      ...lowConfidence,
      confidence: 0.91,
    };

    expect(mapper.isBelowThreshold(lowConfidence)).toBe(true);
    expect(mapper.isBelowThreshold(highConfidence)).toBe(false);
  });

  it('treats unknown top class as below threshold', () => {
    const unknownResult: ClassificationResult = {
      top_class: 'unknown',
      confidence: 0.99,
      top_k: [],
      inference_time_ms: 100,
      model_version: 'mock-1.0.0',
      is_mock: true,
    };

    expect(mapper.isBelowThreshold(unknownResult)).toBe(true);
  });

  it('throws when DB query fails', async () => {
    maybeSingleMock.mockResolvedValue({
      data: null,
      error: { message: 'db unavailable' },
    });

    await expect(
      mapper.mapAIClassToDBCategory('metal_can'),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });
});
