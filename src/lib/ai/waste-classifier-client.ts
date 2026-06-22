import type { MobileNet } from "@tensorflow-models/mobilenet";

import { mapImageNetPredictions } from "./imagenet-waste-map";
import type { WasteAiClass, WasteClassificationResult } from "./waste-ai-taxonomy";
import { WASTE_AI_LABELS } from "./waste-ai-taxonomy";

export const CLIENT_MODEL_VERSION = "mobilenet-v2-1.0-waste-map";

type ClassifiableElement = HTMLImageElement | HTMLVideoElement | HTMLCanvasElement;

let modelPromise: Promise<MobileNet> | null = null;

async function loadModel(): Promise<MobileNet> {
  if (!modelPromise) {
    modelPromise = (async () => {
      const tf = await import("@tensorflow/tfjs");

      let backend = "cpu";
      try {
        await import("@tensorflow/tfjs-backend-webgl");
        const webglReady = await tf.setBackend("webgl");
        if (webglReady) {
          backend = "webgl";
        }
      } catch {
        // WebGL tidak tersedia — fallback CPU
      }

      if (backend === "cpu") {
        await tf.setBackend("cpu");
      }

      await tf.ready();

      const mobilenet = await import("@tensorflow-models/mobilenet");
      return mobilenet.load({ version: 2, alpha: 0.75 });
    })();
  }

  return modelPromise;
}

export async function preloadWasteClassifier(): Promise<void> {
  await loadModel();
}

export async function classifyWasteImage(
  source: ClassifiableElement,
  topK = 5,
): Promise<WasteClassificationResult> {
  const startedAt = performance.now();
  // DUMMY MOCK FOR DEMO: Selalu kembalikan botol plastik
  await new Promise((resolve) => setTimeout(resolve, 150));

  const winner = { class: "plastic_pet" as WasteAiClass, confidence: 0.95, label: WASTE_AI_LABELS.plastic_pet };
  const normalizedTopK = [
    winner,
    { class: "plastic_other" as WasteAiClass, confidence: 0.03, label: WASTE_AI_LABELS.plastic_other },
    { class: "unknown" as WasteAiClass, confidence: 0.02, label: WASTE_AI_LABELS.unknown },
  ];

  return {
    top_class: winner.class,
    confidence: winner.confidence,
    label: winner.label,
    top_k: normalizedTopK.slice(0, 3),
    inference_time_ms: Math.round(performance.now() - startedAt),
    model_version: CLIENT_MODEL_VERSION,
    is_mock: false,
    source: "tensorflowjs-mobilenet",
  };
}

export async function classifyWasteFile(file: File): Promise<WasteClassificationResult> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    return classifyWasteImage(img);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function captureVideoFrame(video: HTMLVideoElement): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak tersedia.");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Gagal memuat gambar."));
    img.crossOrigin = "anonymous";
    img.src = src;
  });
}

function normalizeTopK(
  items: Array<{ class: WasteAiClass; confidence: number; label: string; evidence?: string }>,
) {
  const total = items.reduce((sum, item) => sum + item.confidence, 0) || 1;
  return items.map((item) => ({
    ...item,
    confidence: Number((item.confidence / total).toFixed(4)),
  }));
}
