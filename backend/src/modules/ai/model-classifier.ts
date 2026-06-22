/**
 * ONNX runtime classifier.
 *
 * `onnxruntime-node` and `sharp` are not installed by default because the hackathon
 * demo uses `AI_USE_MOCK_CLASSIFIER=true`. Install them only when enabling the real
 * model path:
 *
 *   npm install onnxruntime-node sharp
 *
 * Then set `AI_USE_MOCK_CLASSIFIER=false` and place the model at `AI_MODEL_PATH`.
 */
import { existsSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables } from '../../common/config/env.validation';
import type { AIWasteClass } from './ai.taxonomy';
import { getTaxonomyLabel } from './ai.taxonomy';
import type {
  ClassificationResult,
  WasteClassifier,
} from './classifier.interface';
import { importOptionalModule } from './optional-module-import';

const INPUT_SIZE = 224;

type OnnxRuntimeModule = {
  InferenceSession: {
    create(path: string): Promise<OnnxSession>;
  };
};

type OnnxSession = {
  inputNames: string[];
  outputNames: string[];
  run(feeds: Record<string, OnnxTensor>): Promise<Record<string, OnnxTensor>>;
};

type OnnxTensor = {
  data: Float32Array;
  dims: number[];
};

type SharpModule = {
  (input: Buffer): SharpInstance;
};

type SharpInstance = {
  resize(width: number, height: number): SharpInstance;
  raw(): SharpInstance;
  toBuffer(): Promise<Buffer>;
};

@Injectable()
export class ModelClassifier implements WasteClassifier {
  private session: OnnxSession | null = null;
  private readonly modelPath: string;
  private readonly modelVersion: string;

  constructor(
    private readonly configService: ConfigService<EnvironmentVariables, true>,
  ) {
    const configuredPath =
      this.configService.get('AI_MODEL_PATH', { infer: true }) ??
      './models/waste_classifier.onnx';
    this.modelPath = isAbsolute(configuredPath)
      ? configuredPath
      : resolve(process.cwd(), configuredPath);
    this.modelVersion =
      this.configService.get('AI_MODEL_VERSION', { infer: true }) ?? '1.0.0';
  }

  getModelVersion(): string {
    return this.modelVersion;
  }

  isReady(): boolean {
    return existsSync(this.modelPath);
  }

  async classify(buffer: Buffer, mime: string): Promise<ClassificationResult> {
    if (!this.isReady()) {
      throw new ServiceUnavailableException({
        error: `ONNX model not found at ${this.modelPath}`,
        code: 'MODEL_NOT_READY',
      });
    }

    const startedAt = Date.now();

    try {
      const onnxRuntime = await this.loadOnnxRuntime();
      const sharp = await this.loadSharp();

      if (!this.session) {
        this.session = await onnxRuntime.InferenceSession.create(
          this.modelPath,
        );
      }

      const inputTensor = await this.preprocessImage(buffer, sharp);
      const inputName = this.session.inputNames[0];
      const outputName = this.session.outputNames[0];

      if (!inputName || !outputName) {
        throw new ServiceUnavailableException({
          error: 'ONNX model is missing input or output tensors',
          code: 'MODEL_INVALID',
        });
      }

      const outputs = await this.session.run({
        [inputName]: inputTensor,
      });
      const output = outputs[outputName];

      if (!output) {
        throw new ServiceUnavailableException({
          error: 'ONNX model returned no output tensor',
          code: 'MODEL_INVALID',
        });
      }

      const result = this.mapOutputToResult(
        output.data,
        Date.now() - startedAt,
      );

      return {
        ...result,
        model_version: this.modelVersion,
        is_mock: false,
      };
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }

      const message = error instanceof Error ? error.message : String(error);

      throw new ServiceUnavailableException({
        error: `Model inference failed for mime=${mime}: ${message}`,
        code: 'MODEL_INFERENCE_FAILED',
      });
    }
  }

  private async preprocessImage(
    buffer: Buffer,
    sharp: SharpModule,
  ): Promise<OnnxTensor> {
    const pixels = await sharp(buffer)
      .resize(INPUT_SIZE, INPUT_SIZE)
      .raw()
      .toBuffer();

    const channelSize = INPUT_SIZE * INPUT_SIZE;
    const tensorData = new Float32Array(channelSize * 3);

    for (let index = 0; index < channelSize; index += 1) {
      const pixelOffset = index * 3;
      const red = pixels[pixelOffset] ?? 0;
      const green = pixels[pixelOffset + 1] ?? 0;
      const blue = pixels[pixelOffset + 2] ?? 0;

      tensorData[index] = red / 255;
      tensorData[index + channelSize] = green / 255;
      tensorData[index + channelSize * 2] = blue / 255;
    }

    return {
      data: tensorData,
      dims: [1, 3, INPUT_SIZE, INPUT_SIZE],
    };
  }

  private mapOutputToResult(
    output: Float32Array,
    inferenceTimeMs: number,
  ): Omit<ClassificationResult, 'model_version' | 'is_mock'> {
    const classOrder: AIWasteClass[] = [
      'plastic_pet',
      'plastic_other',
      'paper_cardboard',
      'metal_can',
      'glass',
      'electronics',
      'organic',
      'textile',
    ];

    const scores = Array.from(output.slice(0, classOrder.length));
    const normalized = this.softmax(scores.length > 0 ? scores : [1]);
    const ranked = classOrder
      .map((wasteClass, index) => ({
        class: wasteClass,
        confidence: normalized[index] ?? 0,
        label: getTaxonomyLabel(wasteClass),
      }))
      .sort((left, right) => right.confidence - left.confidence);

    const top_k = ranked.slice(0, 3);
    const top = top_k[0] ?? {
      class: 'unknown',
      confidence: 0,
      label: getTaxonomyLabel('unknown'),
    };

    return {
      top_class: top.class,
      confidence: top.confidence,
      top_k,
      inference_time_ms: inferenceTimeMs,
    };
  }

  private softmax(values: number[]): number[] {
    const max = Math.max(...values);
    const exps = values.map((value) => Math.exp(value - max));
    const sum = exps.reduce((total, value) => total + value, 0);

    return exps.map((value) => Number((value / sum).toFixed(4)));
  }

  private async loadOnnxRuntime(): Promise<OnnxRuntimeModule> {
    try {
      return await importOptionalModule<OnnxRuntimeModule>('onnxruntime-node');
    } catch {
      throw new ServiceUnavailableException({
        error:
          'onnxruntime-node is not installed. Run `npm install onnxruntime-node` to enable ONNX inference.',
        code: 'MODEL_DEPENDENCY_MISSING',
      });
    }
  }

  private async loadSharp(): Promise<SharpModule> {
    try {
      const module = await importOptionalModule<{ default: SharpModule }>(
        'sharp',
      );
      return module.default;
    } catch {
      throw new ServiceUnavailableException({
        error:
          'sharp is not installed. Run `npm install sharp` to enable ONNX image preprocessing.',
        code: 'MODEL_DEPENDENCY_MISSING',
      });
    }
  }
}
