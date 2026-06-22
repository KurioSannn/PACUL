import type { WasteClassificationResult } from "@/lib/ai/waste-ai-taxonomy";
import { classifyWasteClient, uploadWasteImage } from "@/lib/api";
import type { AiClassificationResult } from "@/lib/api/types";

export type ClassificationPipelineResult = {
  imagePath: string;
  classification: AiClassificationResult;
  categoryId: string | null;
};

/** Upload foto + simpan hasil TensorFlow.js ke backend (bukan mock hash). */
export async function persistClientClassification(
  accessToken: string,
  file: File,
  clientResult: WasteClassificationResult,
): Promise<ClassificationPipelineResult> {
  const uploaded = await uploadWasteImage(accessToken, file);
  const classification = await classifyWasteClient(accessToken, {
    imagePath: uploaded.path,
    top_class: clientResult.top_class,
    confidence: clientResult.confidence,
    model_version: clientResult.model_version,
    inference_time_ms: clientResult.inference_time_ms,
    top_k: clientResult.top_k.map((item) => ({
      class: item.class,
      confidence: item.confidence,
      label: item.label,
    })),
  });

  return {
    imagePath: uploaded.path,
    classification,
    categoryId: classification.db_category_id,
  };
}
