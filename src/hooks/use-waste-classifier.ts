"use client";

import { useCallback, useEffect, useState } from "react";

import type { WasteClassificationResult } from "@/lib/ai/waste-ai-taxonomy";
import {
  classifyWasteFile,
  classifyWasteImage,
  preloadWasteClassifier,
} from "@/lib/ai/waste-classifier-client";

export function useWasteClassifier() {
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isClassifying, setIsClassifying] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [result, setResult] = useState<WasteClassificationResult | null>(null);

  useEffect(() => {
    let active = true;
    preloadWasteClassifier()
      .then(() => {
        if (active) setIsModelLoading(false);
      })
      .catch((err) => {
        if (active) {
          setModelError(err instanceof Error ? err.message : "Model AI gagal dimuat.");
          setIsModelLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const classifyFile = useCallback(async (file: File) => {
    setIsClassifying(true);
    setModelError(null);
    try {
      const next = await classifyWasteFile(file);
      setResult(next);
      return next;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Klasifikasi gagal.";
      setModelError(message);
      throw err;
    } finally {
      setIsClassifying(false);
    }
  }, []);

  const classifyElement = useCallback(
    async (el: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement) => {
      setIsClassifying(true);
      setModelError(null);
      try {
        const next = await classifyWasteImage(el);
        setResult(next);
        return next;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Klasifikasi gagal.";
        setModelError(message);
        throw err;
      } finally {
        setIsClassifying(false);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setResult(null);
    setModelError(null);
  }, []);

  return {
    isModelLoading,
    isClassifying,
    modelError,
    result,
    classifyFile,
    classifyElement,
    reset,
  };
}
