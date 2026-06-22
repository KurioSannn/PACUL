export type WasteAiClass =
  | "plastic_pet"
  | "plastic_other"
  | "paper_cardboard"
  | "metal_can"
  | "glass"
  | "electronics"
  | "organic"
  | "textile"
  | "unknown";

export const WASTE_AI_LABELS: Record<WasteAiClass, string> = {
  plastic_pet: "Botol PET / Plastik Kemasan",
  plastic_other: "Plastik Lainnya (HDPE, dll.)",
  paper_cardboard: "Kertas & Kardus",
  metal_can: "Kaleng & Logam",
  glass: "Kaca",
  electronics: "Elektronik Kecil",
  organic: "Organik",
  textile: "Tekstil / Kain",
  unknown: "Tidak dikenali",
};

export interface WasteClassificationResult {
  top_class: WasteAiClass;
  confidence: number;
  label: string;
  top_k: Array<{ class: WasteAiClass; confidence: number; label: string; evidence?: string }>;
  inference_time_ms: number;
  model_version: string;
  is_mock: false;
  source: "tensorflowjs-mobilenet";
}

export function wasteClassLabel(wasteClass: string): string {
  return WASTE_AI_LABELS[wasteClass as WasteAiClass] ?? wasteClass.replace(/_/g, " ");
}
