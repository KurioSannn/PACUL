import { Logger } from '@nestjs/common';
import type { AIWasteClass } from './ai.taxonomy';
import { getTaxonomyLabel } from './ai.taxonomy';
import type {
  ClassificationResult,
  WasteClassifier,
} from './classifier.interface';

const MOCK_MODEL_VERSION = 'mock-1.0.0';
const MOCK_CYCLE_CLASSES: AIWasteClass[] = [
  'plastic_pet',
  'paper_cardboard',
  'metal_can',
  'glass',
  'electronics',
  'textile',
];

export class MockClassifier implements WasteClassifier {
  private readonly logger = new Logger('MOCK_CLASSIFIER');

  getModelVersion(): string {
    return MOCK_MODEL_VERSION;
  }

  isReady(): boolean {
    return true;
  }

  async classify(buffer: Buffer, mime: string): Promise<ClassificationResult> {
    const startedAt = Date.now();
    const delayMs = 200 + (hashBuffer(buffer) % 301);
    await sleep(delayMs);

    const hash = hashBuffer(buffer);
    const primaryClass = MOCK_CYCLE_CLASSES[hash % MOCK_CYCLE_CLASSES.length];
    const topKClasses = pickTopKClasses(primaryClass, hash);

    const rawScores = topKClasses.map((_, index) => {
      if (index === 0) {
        return 0.55 + (hash % 35) / 100;
      }

      if (index === 1) {
        return 0.2 + (hash % 20) / 100;
      }

      return 0.05 + (hash % 15) / 100;
    });

    const confidences = normalizeScores(rawScores);
    const top_k = topKClasses.map((wasteClass, index) => ({
      class: wasteClass,
      confidence: confidences[index] ?? 0,
      label: getTaxonomyLabel(wasteClass),
    }));

    const result: ClassificationResult = {
      top_class: top_k[0]?.class ?? 'unknown',
      confidence: top_k[0]?.confidence ?? 0,
      top_k,
      inference_time_ms: Date.now() - startedAt,
      model_version: MOCK_MODEL_VERSION,
      is_mock: true,
    };

    this.logger.log(
      `[MOCK_CLASSIFIER] mime=${mime} top_class=${result.top_class} confidence=${result.confidence.toFixed(3)} inference_time_ms=${result.inference_time_ms}`,
    );

    return result;
  }
}

function hashBuffer(buffer: Buffer): number {
  let hash = buffer.length;

  for (let index = 0; index < Math.min(buffer.length, 64); index += 1) {
    hash = (hash * 31 + buffer[index]) % 1_000_000_007;
  }

  return Math.abs(hash);
}

function pickTopKClasses(
  primaryClass: AIWasteClass,
  hash: number,
): AIWasteClass[] {
  const pool = MOCK_CYCLE_CLASSES.filter(
    (wasteClass) => wasteClass !== primaryClass,
  );
  const secondary = pool[hash % pool.length];
  const tertiaryPool = pool.filter((wasteClass) => wasteClass !== secondary);
  const tertiary = tertiaryPool[hash % tertiaryPool.length] ?? 'plastic_other';

  return [primaryClass, secondary, tertiary];
}

function normalizeScores(scores: number[]): number[] {
  const total = scores.reduce((sum, score) => sum + score, 0);

  if (total <= 0) {
    return scores.map(() => 1 / scores.length);
  }

  return scores.map((score) => Number((score / total).toFixed(4)));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
