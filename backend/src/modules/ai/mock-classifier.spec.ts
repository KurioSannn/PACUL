import { MockClassifier } from './mock-classifier';

describe('MockClassifier', () => {
  const classifier = new MockClassifier();

  it('is always ready', () => {
    expect(classifier.isReady()).toBe(true);
    expect(classifier.getModelVersion()).toBe('mock-1.0.0');
  });

  it('returns a valid classification shape with top_k=3', async () => {
    const result = await classifier.classify(
      Buffer.from('test-image-bytes'),
      'image/jpeg',
    );

    expect(result.is_mock).toBe(true);
    expect(result.model_version).toBe('mock-1.0.0');
    expect(result.top_k).toHaveLength(3);
    expect(result.top_class).toBe(result.top_k[0]?.class);
    expect(result.confidence).toBe(result.top_k[0]?.confidence);
    expect(result.inference_time_ms).toBeGreaterThanOrEqual(200);
    expect(result.inference_time_ms).toBeLessThanOrEqual(600);
  });

  it('keeps confidences between 0 and 1 and roughly summing to 1', async () => {
    const result = await classifier.classify(Buffer.alloc(128, 7), 'image/png');
    const totalConfidence = result.top_k.reduce(
      (sum, entry) => sum + entry.confidence,
      0,
    );

    for (const entry of result.top_k) {
      expect(entry.confidence).toBeGreaterThanOrEqual(0);
      expect(entry.confidence).toBeLessThanOrEqual(1);
      expect(entry.label.length).toBeGreaterThan(0);
    }

    expect(totalConfidence).toBeGreaterThan(0.95);
    expect(totalConfidence).toBeLessThanOrEqual(1.01);
  });

  it('varies top class deterministically by buffer content', async () => {
    const first = await classifier.classify(Buffer.alloc(10, 1), 'image/jpeg');
    const second = await classifier.classify(Buffer.alloc(20, 2), 'image/jpeg');

    expect(first.top_class).not.toBe(second.top_class);
  });
});
