export interface ClassificationTopKEntry {
  class: string;
  confidence: number;
  label: string;
}

export interface ClassificationResult {
  top_class: string;
  confidence: number;
  top_k: ClassificationTopKEntry[];
  inference_time_ms: number;
  model_version: string;
  is_mock: boolean;
}

export interface WasteClassifier {
  classify(buffer: Buffer, mime: string): Promise<ClassificationResult>;
  getModelVersion(): string;
  isReady(): boolean;
}
